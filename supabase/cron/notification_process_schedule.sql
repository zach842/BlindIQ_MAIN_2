-- BlindIQ field-alert scheduler
-- Run once after the notification migration and both notification functions
-- have been deployed. The two required values are stored in Supabase Vault.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

do $$
declare
  existing_job bigint;
begin
  select jobid into existing_job
  from cron.job
  where jobname = 'blindiq-notification-process'
  limit 1;

  if existing_job is not null then
    perform cron.unschedule(existing_job);
  end if;
end $$;

-- Check for due events every 15 minutes. Event keys prevent duplicate alerts.
select cron.schedule(
  'blindiq-notification-process',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'notification_project_url'
      limit 1
    ) || '/functions/v1/notification-process',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'notification_cron_secret'
        limit 1
      )
    ),
    body := jsonb_build_object('scheduled_at', now())
  );
  $$
);
