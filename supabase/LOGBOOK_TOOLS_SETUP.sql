-- Additive upgrade; existing logs, fields and owner policies remain in place.
alter table public.hunts add column if not exists hunt_local_date date;
alter table public.hunts add column if not exists spot_name text check (char_length(spot_name) <= 120);
alter table public.hunts add column if not exists reporting_details jsonb not null default '[]'::jsonb
  check (jsonb_typeof(reporting_details) = 'array' and jsonb_array_length(reporting_details) <= 100 and octet_length(reporting_details::text) <= 65536);
alter table public.hunts enable row level security;
drop policy if exists "Users can update their own hunt details" on public.hunts;
create policy "Users can update their own hunt details" on public.hunts for update to authenticated
 using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
 with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
grant update (reporting_details, spot_name) on public.hunts to authenticated;
