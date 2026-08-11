create table if not exists public.hunts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hunted_at timestamptz not null default now(),
  state_code text not null,
  state_name text not null,
  zone text not null,
  is_simulation boolean not null default false,
  season_year text,
  entries jsonb not null default '[]'::jsonb,
  bird_count integer not null default 0,
  app_version text not null default '1.25',
  created_at timestamptz not null default now(),
  constraint hunts_state_code_format check (state_code ~ '^[A-Z]{2}$'),
  constraint hunts_entries_array check (jsonb_typeof(entries) = 'array'),
  constraint hunts_bird_count_nonnegative check (bird_count >= 0)
);

create index if not exists hunts_user_hunted_at_idx
  on public.hunts (user_id, hunted_at desc);

alter table public.hunts enable row level security;

revoke all on table public.hunts from anon;
revoke all on table public.hunts from authenticated;
grant select, insert on table public.hunts to authenticated;
grant all on table public.hunts to service_role;

drop policy if exists "Users can view their own hunts" on public.hunts;
create policy "Users can view their own hunts"
  on public.hunts
  for select
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can save their own hunts" on public.hunts;
create policy "Users can save their own hunts"
  on public.hunts
  for insert
  to authenticated
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

comment on table public.hunts is
  'Account-owned BlindIQ live and simulation hunt history. Harvest entries are stored atomically as JSON.';
