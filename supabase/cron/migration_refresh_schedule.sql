-- BlindIQ Migration Pulse scheduler
-- Run this once in Supabase SQL Editor after:
--   1. 20260825135713_migration_pulse.sql has been applied.
--   2. migration-refresh has been deployed.
--   3. The two Vault secrets below have been created.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Remove an older copy of the schedule before recreating it.
do $$
declare
  existing_job bigint;
begin
  select jobid into existing_job
  from cron.job
  where jobname = 'blindiq-migration-refresh'
  limit 1;

  if existing_job is not null then
    perform cron.unschedule(existing_job);
  end if;
end $$;

-- Refresh at 15 minutes past midnight, 6 a.m., noon, and 6 p.m. UTC.
select cron.schedule(
  'blindiq-migration-refresh',
  '15 */6 * * *',
  $$
  select net.http_post(
    url := (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'migration_project_url'
      limit 1
    ) || '/functions/v1/migration-refresh',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'migration_secret_key'
        limit 1
      )
    ),
    body := jsonb_build_object('scheduled_at', now())
  );
  $$
);

