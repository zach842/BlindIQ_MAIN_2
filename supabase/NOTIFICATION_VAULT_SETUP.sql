-- Service-only, security-invoker access to the four named push settings.
-- Supabase service_role already has Vault read access; clients receive none.
create or replace function public.blindiq_push_runtime_config()
returns jsonb language sql stable security invoker set search_path = ''
as $$
 select coalesce(jsonb_object_agg(
   case when name='notification_cron_secret' then 'NOTIFICATION_CRON_SECRET' else name end,
   decrypted_secret
 ), '{}'::jsonb)
 from vault.decrypted_secrets
 where name in ('WEB_PUSH_PUBLIC_KEY','WEB_PUSH_PRIVATE_KEY','WEB_PUSH_SUBJECT','notification_cron_secret');
$$;
revoke all on function public.blindiq_push_runtime_config() from public, anon, authenticated;
grant execute on function public.blindiq_push_runtime_config() to service_role;
