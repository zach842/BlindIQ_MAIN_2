import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {PGlite} from '@electric-sql/pglite';
test('preference upgrade preserves defaults, is idempotent and remains owner-only',async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon; create role authenticated; create schema auth;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;
 create table public.profiles(id uuid primary key,default_state text default 'MD',updated_at timestamptz default now());
 alter table public.profiles enable row level security; grant select,update on public.profiles to authenticated;
 create policy own_read on public.profiles for select to authenticated using(auth.uid()=id);
 create policy own_update on public.profiles for update to authenticated using(auth.uid()=id) with check(auth.uid()=id);
 insert into public.profiles(id,default_state) values('11111111-1111-1111-1111-111111111111','SC'),('22222222-2222-2222-2222-222222222222','AK');`);
 const sql=await readFile(new URL('../supabase/HUNT_PREFERENCES_SETUP.sql',import.meta.url),'utf8');await db.exec(sql);await db.exec(sql);
 assert.deepEqual((await db.query("select default_state,default_hunt_category from profiles where default_state='SC'")).rows,[{default_state:'SC',default_hunt_category:null}]);
 await db.exec(`set role authenticated;set request.jwt.claim.sub='11111111-1111-1111-1111-111111111111';`);
 assert.equal((await db.query("update profiles set default_state='WY',default_hunt_category='deer' where id='11111111-1111-1111-1111-111111111111' returning id")).rows.length,1);
 assert.equal((await db.query("update profiles set default_hunt_category='turkey' where id='22222222-2222-2222-2222-222222222222' returning id")).rows.length,0);
 await assert.rejects(db.query("update profiles set default_hunt_category='mallard'"));
 await db.exec('reset role;set role anon;');await assert.rejects(db.query('select * from profiles'));
 }finally{await db.close();}
});
