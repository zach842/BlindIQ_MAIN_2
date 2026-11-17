import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
test('hunt deletion SQL is idempotent and permits only the authenticated owner', async () => {
 const db=new PGlite();
 try {
  await db.exec(`create role anon; create role authenticated; create schema auth;
  create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;
  create table public.hunts(id uuid primary key,user_id uuid not null);
  alter table public.hunts enable row level security;
  grant select on public.hunts to authenticated;
  create policy own_select on public.hunts for select to authenticated using(auth.uid()=user_id);
  insert into public.hunts values('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','11111111-1111-1111-1111-111111111111'),('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','22222222-2222-2222-2222-222222222222');`);
  const sql=await readFile(new URL('../supabase/HUNT_DELETE_SETUP.sql',import.meta.url),'utf8');
  await db.exec(sql); await db.exec(sql);
  await db.exec(`set role authenticated; set request.jwt.claim.sub='11111111-1111-1111-1111-111111111111';`);
  assert.equal((await db.query("delete from public.hunts where id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' returning id")).rows.length,0);
  assert.equal((await db.query("delete from public.hunts where id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' returning id")).rows.length,1);
  await db.exec(`set request.jwt.claim.sub='';`);
  assert.equal((await db.query('delete from public.hunts returning id')).rows.length,0);
  await db.exec('reset role; set role anon;');
  await assert.rejects(db.query('delete from public.hunts'));
  await db.exec('reset role;');
  assert.equal((await db.query('select count(*)::int n from public.hunts')).rows[0].n,1);
 } finally { await db.close(); }
});
