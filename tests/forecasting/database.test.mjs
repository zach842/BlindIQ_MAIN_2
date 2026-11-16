import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {randomUUID} from 'node:crypto';

test('forecast database constraints, ingestion and RLS on embedded PostgreSQL',async(t)=>{
 const db=new PGlite();
 try{
 await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth; create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;
 alter default privileges in schema public grant all on tables to anon,authenticated;`);
 const file=(await readdir(new URL('../../supabase/migrations/',import.meta.url))).find(n=>n.endsWith('_deer_turkey_forecast_foundation.sql'));
 await db.exec(await readFile(new URL('../../supabase/migrations/'+file,import.meta.url),'utf8'));
 const now=new Date(),issued=new Date(now.getTime()-1800000);
 const periods=Array.from({length:24},(_,i)=>({valid_at:new Date(now.getTime()+i*3600000).toISOString(),temperature_c:10,wind_kph:8,precipitation_probability:null}));
 const run=randomUUID();let snapshot;
 await db.query(`insert into public.movement_source_runs(id,source_id,status,regions_attempted,started_at) values($1,'nws-hourly','running',2,now())`,[run]);
 const args=['md-whitetail-pilot',run,issued.toISOString(),now.toISOString(),'https://api.weather.gov/gridpoints/LWX/1,1/forecast/hourly','a'.repeat(64),JSON.stringify(periods),JSON.stringify({validation_status:'context_only',activity_score:null})];
 const ingest=()=>db.query('select public.movement_ingest_weather($1,$2,$3,$4,$5,$6,$7,$8) as id',args);
 await t.test('sources and pilot regions are seeded; restricted datasets stay disabled',async()=>{
  const registry=JSON.parse(await readFile(new URL('../../forecasting/sources.json',import.meta.url),'utf8'));
  const saved=(await db.query('select to_jsonb(s) as source from movement_sources s order by id')).rows.map(row=>row.source);
  assert.deepEqual(saved,registry.sort((a,b)=>a.id.localeCompare(b.id)));
  assert.equal((await db.query("select ingestion_mode from movement_sources where id='ebird'")).rows[0].ingestion_mode,'disabled');
  assert.equal((await db.query('select count(*)::int n from movement_regions where active')).rows[0].n,2);
 });
 await t.test('service ingestion is atomic and retries reuse the same snapshot',async()=>{
  await db.exec('set role service_role');
  snapshot=(await ingest()).rows[0].id;
  assert.equal((await ingest()).rows[0].id,snapshot);
  await db.exec('reset role');
  assert.equal((await db.query('select count(*)::int n from movement_weather_batches')).rows[0].n,1);
  const saved=(await db.query('select published,activity_score,context from movement_forecast_snapshots')).rows[0];
  assert.equal(saved.published,false);assert.equal(saved.activity_score,null);
  assert.equal(saved.context.biology[0].source_id,'md-whitetail-biology');
 });
 await t.test('unvalidated models cannot emit a numeric activity score',async()=>{
  await assert.rejects(db.query('update movement_forecast_snapshots set activity_score=75 where id=$1',[snapshot]),/validated model/);
  await assert.rejects(db.exec("insert into movement_model_versions(id,target,validation_status) values('bad-model','movement','validated')"),/check constraint/);
 });
 await t.test('stale issues, duplicate hours and unapproved sources fail closed',async()=>{
  const original=args[2];args[2]=new Date(now.getTime()-8*3600000).toISOString();await assert.rejects(ingest(),/Stale/);args[2]=original;
  const hours=args[6];args[6]=JSON.stringify([...periods.slice(0,12),periods[0]]);await assert.rejects(ingest(),/Duplicate/);args[6]=hours;
  await db.exec("update movement_sources set ingestion_mode='disabled' where id='nws-hourly'");await assert.rejects(ingest(),/not approved/);
  await db.exec("update movement_sources set ingestion_mode='automated' where id='nws-hourly'");
  assert.equal((await db.query('select count(*)::int n from movement_weather_batches')).rows[0].n,1);
 });
 await t.test('raw data, research and ingestion RPC are inaccessible to clients',async()=>{
  for(const role of ['anon','authenticated']){
   assert.equal((await db.query("select has_table_privilege($1,'public.movement_weather_batches','SELECT') as allowed",[role])).rows[0].allowed,false);
   assert.equal((await db.query("select has_function_privilege($1,'public.movement_ingest_weather(text,uuid,timestamp with time zone,timestamp with time zone,text,text,jsonb,jsonb)','EXECUTE') as allowed",[role])).rows[0].allowed,false);
  }
  await db.exec('set role authenticated');assert.equal((await db.query('select * from movement_forecast_snapshots')).rows.length,0);await db.exec('reset role');
 });
 await t.test('RLS exposes only published, fresh snapshots in active regions',async()=>{
  await db.query('update movement_forecast_snapshots set published=true where id=$1',[snapshot]);
  await db.exec('set role authenticated');assert.equal((await db.query('select * from movement_forecast_snapshots')).rows.length,1);await db.exec('reset role');
  await db.exec("update movement_regions set active=false where id='md-whitetail-pilot'");
  await db.exec('set role authenticated');assert.equal((await db.query('select * from movement_forecast_snapshots')).rows.length,0);await db.exec('reset role');
  await db.exec("update movement_regions set active=true where id='md-whitetail-pilot'");
  await db.query("update movement_forecast_snapshots set generated_at=now()-interval '2 hours',valid_through=now()-interval '1 hour' where id=$1",[snapshot]);
  await db.exec('set role authenticated');assert.equal((await db.query('select * from movement_forecast_snapshots')).rows.length,0);await db.exec('reset role');
 });
 await t.test('private observations enforce ownership, preserve zero sightings and default training opt-out',async()=>{
  const a=randomUUID(),b=randomUUID();await db.query('insert into auth.users values($1),($2)',[a,b]);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[a]);await db.exec('set role authenticated');
  await db.query("insert into movement_field_observations(user_id,client_event_id,taxon,occurred_at,effort_minutes,sightings) values($1,$2,'white-tailed-deer',now(),60,0)",[a,randomUUID()]);
  assert.equal((await db.query('select training_consent from movement_field_observations')).rows[0].training_consent,false);
  await assert.rejects(db.query('update movement_field_observations set user_id=$1',[b]),/row-level security/);
  await assert.rejects(db.query("insert into movement_field_observations(user_id,client_event_id,taxon,occurred_at,effort_minutes,sightings) values($1,$2,'wild-turkey',now(),60,1)",[b,randomUUID()]),/row-level security/);
  await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[b]);await db.exec('set role authenticated');
  assert.equal((await db.query('select * from movement_field_observations')).rows.length,0);await db.exec('reset role');
 });
 await t.test('local schema audit: all new tables have RLS and all functions are invoker',async()=>{
  const tables=await db.query("select relname,relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and relkind='r' and relname like 'movement_%'");
  assert.equal(tables.rows.length,8);assert.ok(tables.rows.every(row=>row.relrowsecurity));
  assert.ok((await db.query("select prosecdef from pg_proc where proname in ('movement_guard_snapshot','movement_ingest_weather')")).rows.every(row=>!row.prosecdef));
 });
 }finally{await db.close();}
});
