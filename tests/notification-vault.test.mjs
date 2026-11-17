import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {PGlite} from '@electric-sql/pglite';
test('push Vault RPC is invoker-only, service-only and limited to named settings',async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon;create role authenticated;create role service_role;create schema vault;create table vault.decrypted_secrets(name text,decrypted_secret text);insert into vault.decrypted_secrets values('WEB_PUSH_PUBLIC_KEY','test-public'),('WEB_PUSH_PRIVATE_KEY','test-private'),('notification_cron_secret','test-cron'),('unrelated_secret','must-not-return');grant usage on schema vault to service_role;grant select on vault.decrypted_secrets to service_role;`);
 await db.exec(await readFile(new URL('../supabase/NOTIFICATION_VAULT_SETUP.sql',import.meta.url),'utf8'));
 assert.equal((await db.query("select prosecdef from pg_proc where proname='blindiq_push_runtime_config'")).rows[0].prosecdef,false);
 for(const role of ['anon','authenticated']){await db.exec('set role '+role);await assert.rejects(db.query('select public.blindiq_push_runtime_config()'));await db.exec('reset role');}
 await db.exec('set role service_role');const result=(await db.query('select public.blindiq_push_runtime_config() as config')).rows[0].config;assert.equal(result.NOTIFICATION_CRON_SECRET,'test-cron');assert.equal(result.WEB_PUSH_PUBLIC_KEY,'test-public');assert.equal(result.unrelated_secret,undefined);
 }finally{await db.close();}
});
