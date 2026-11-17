import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {PGlite} from '@electric-sql/pglite';
test('notification upgrade preserves opt-ins, isolates preferences and blocks unreviewed calendar access',async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;insert into auth.users values('11111111-1111-1111-1111-111111111111'),('22222222-2222-2222-2222-222222222222');`);
 await db.exec(await readFile(new URL('../supabase/migrations/202608270001_web_push_notifications.sql',import.meta.url),'utf8'));
 const sql=await readFile(new URL('../supabase/NOTIFICATION_NATIONWIDE_SETUP.sql',import.meta.url),'utf8');await db.exec(sql);await db.exec(sql);
 await db.exec(`insert into notification_preferences(user_id) values('11111111-1111-1111-1111-111111111111'),('22222222-2222-2222-2222-222222222222');`);
 const pref=(await db.query('select nationwide_alerts,logging_nudges from notification_preferences limit 1')).rows[0];assert.deepEqual(pref,{nationwide_alerts:false,logging_nudges:false});
 await db.exec(`set role authenticated;set request.jwt.claim.sub='11111111-1111-1111-1111-111111111111';`);
 assert.equal((await db.query('select * from notification_preferences')).rows.length,1);
 assert.equal((await db.query('select * from notification_season_periods')).rows.length,0);
 assert.equal((await db.query(`update notification_preferences set logging_nudges=true where user_id='22222222-2222-2222-2222-222222222222' returning user_id`)).rows.length,0);
 await db.exec('update notification_preferences set nationwide_alerts=true,logging_nudges=true');
 await assert.rejects(db.exec('update notification_preferences set nudge_every_days=1'));
 await assert.rejects(db.exec("update notification_season_periods set verification_status='verified'"));
 await db.exec('reset role');await assert.rejects(db.exec("update notification_season_periods set verification_status='verified' where id=(select id from notification_season_periods limit 1)"));
 await db.exec("update notification_season_periods set verification_status='verified',verified_at=now(),time_zone='America/New_York' where id=(select id from notification_season_periods where data_status='current' limit 1)");
 await db.exec(`set role authenticated;set request.jwt.claim.sub='11111111-1111-1111-1111-111111111111';`);assert.equal((await db.query('select * from notification_season_periods')).rows.length,1);
 }finally{await db.close();}
});
