create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  user_agent text,
  device_label text,
  enabled boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_enabled_idx
  on public.push_subscriptions (user_id, enabled);

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  season_alerts boolean not null default true,
  regulation_alerts boolean not null default true,
  migration_alerts boolean not null default true,
  hunt_reminders boolean not null default true,
  membership_alerts boolean not null default true,
  hunt_milestones boolean not null default true,
  followed_states text[] not null default array['MD']::text[],
  followed_flyways text[] not null default array['Atlantic','Mississippi','Central','Pacific']::text[],
  migration_threshold smallint not null default 65,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_preferences_threshold check (migration_threshold between 1 and 100)
);

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  event_type text not null,
  audience_kind text not null,
  target_value text,
  target_user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  url text not null default '/?view=notifications',
  priority text not null default 'normal',
  payload jsonb not null default '{}'::jsonb,
  deliver_at timestamptz not null default now(),
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  processing_started_at timestamptz,
  processed_at timestamptz,
  constraint notification_events_audience check (audience_kind in ('all','state','flyway','user')),
  constraint notification_events_priority check (priority in ('urgent','normal','digest')),
  constraint notification_events_status check (status in ('pending','processing','sent','cancelled')),
  constraint notification_events_user_target check (
    (audience_kind = 'user' and target_user_id is not null)
    or (audience_kind <> 'user' and target_user_id is null)
  )
);

create index if not exists notification_events_due_idx
  on public.notification_events (status, deliver_at);

alter table public.notification_events
  add column if not exists processing_started_at timestamptz;

create table if not exists public.notification_inbox (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.notification_events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  title text not null,
  body text not null,
  url text not null default '/?view=notifications',
  priority text not null default 'normal',
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  unique (event_id, user_id)
);

create index if not exists notification_inbox_user_created_idx
  on public.notification_inbox (user_id, created_at desc);

create index if not exists notification_inbox_user_unread_idx
  on public.notification_inbox (user_id, read_at) where read_at is null;

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.notification_events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
  status text not null default 'pending',
  response_code integer,
  error_message text,
  attempted_at timestamptz not null default now(),
  delivered_at timestamptz,
  unique (event_id, subscription_id),
  constraint notification_deliveries_status check (status in ('pending','sent','failed','expired'))
);

create table if not exists public.notification_season_periods (
  id text primary key,
  state_code text not null,
  state_name text not null,
  season_name text not null,
  category text not null,
  zone text not null,
  start_date date not null,
  end_date date not null,
  season_year text not null,
  data_status text not null default 'current',
  source_url text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_season_state_code check (state_code ~ '^[A-Z]{2}$'),
  constraint notification_season_category check (category in ('ducks','geese','other')),
  constraint notification_season_dates check (end_date >= start_date)
);

create index if not exists notification_season_start_idx
  on public.notification_season_periods (active, start_date);

create index if not exists notification_season_end_idx
  on public.notification_season_periods (active, end_date);

create table if not exists public.regulation_releases (
  id uuid primary key default gen_random_uuid(),
  state_code text not null,
  season_year text not null,
  version text not null,
  title text not null,
  summary text not null,
  source_url text not null,
  status text not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (state_code, season_year, version),
  constraint regulation_release_state_code check (state_code ~ '^[A-Z]{2}$'),
  constraint regulation_release_status check (status in ('draft','published','withdrawn'))
);

create table if not exists public.active_hunts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null,
  state_code text not null,
  state_name text not null,
  zone text not null,
  status text not null default 'active',
  started_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  reminder_sent_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint active_hunts_state_code check (state_code ~ '^[A-Z]{2}$'),
  constraint active_hunts_status check (status in ('active','saved','discarded'))
);

create index if not exists active_hunts_reminder_idx
  on public.active_hunts (status, started_at, reminder_sent_at);

alter table public.push_subscriptions enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.notification_events enable row level security;
alter table public.notification_inbox enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.notification_season_periods enable row level security;
alter table public.regulation_releases enable row level security;
alter table public.active_hunts enable row level security;

revoke all on table public.push_subscriptions from anon, authenticated;
revoke all on table public.notification_preferences from anon, authenticated;
revoke all on table public.notification_events from anon, authenticated;
revoke all on table public.notification_inbox from anon, authenticated;
revoke all on table public.notification_deliveries from anon, authenticated;
revoke all on table public.notification_season_periods from anon, authenticated;
revoke all on table public.regulation_releases from anon, authenticated;
revoke all on table public.active_hunts from anon, authenticated;

grant select, insert, update, delete on table public.push_subscriptions to authenticated;
grant select, insert, update on table public.notification_preferences to authenticated;
grant select, update, delete on table public.notification_inbox to authenticated;
grant select, insert, update on table public.active_hunts to authenticated;
grant all on table public.push_subscriptions to service_role;
grant all on table public.notification_preferences to service_role;
grant all on table public.notification_events to service_role;
grant all on table public.notification_inbox to service_role;
grant all on table public.notification_deliveries to service_role;
grant all on table public.notification_season_periods to service_role;
grant all on table public.regulation_releases to service_role;
grant all on table public.active_hunts to service_role;

create policy "Members manage their own push devices"
  on public.push_subscriptions for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Members manage their notification preferences"
  on public.notification_preferences for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Members read their own notification inbox"
  on public.notification_inbox for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Members update their own notification inbox"
  on public.notification_inbox for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Members delete their own notification inbox"
  on public.notification_inbox for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Members manage their own active hunts"
  on public.active_hunts for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Only exact, source-backed calendar dates belong here. Tentative records are
-- intentionally retained but the processor will identify them as provisional.
insert into public.notification_season_periods
  (id, state_code, state_name, season_name, category, zone, start_date, end_date, season_year, data_status, source_url)
values
  ('md-early-canada-east-2026', 'MD', 'Maryland', 'Early Resident Canada Goose', 'geese', 'Eastern Zone', '2026-09-01', '2026-09-15', '2026–2027', 'tentative', 'https://www.eregulations.com/maryland/hunting/migratory-game-bird-seasons-limits'),
  ('md-early-canada-west-2026', 'MD', 'Maryland', 'Early Resident Canada Goose', 'geese', 'Western Zone', '2026-09-01', '2026-09-25', '2026–2027', 'tentative', 'https://www.eregulations.com/maryland/hunting/migratory-game-bird-seasons-limits'),
  ('md-september-teal-2026', 'MD', 'Maryland', 'September Teal', 'ducks', 'Designated eastern counties and partial counties', '2026-09-17', '2026-09-26', '2026–2027', 'tentative', 'https://www.eregulations.com/maryland/hunting/migratory-game-bird-seasons-limits'),
  ('md-duck-west-1-2026', 'MD', 'Maryland', 'Regular Duck', 'ducks', 'Western Duck Zone', '2026-10-03', '2026-10-17', '2026–2027', 'tentative', 'https://www.eregulations.com/maryland/hunting/migratory-game-bird-seasons-limits'),
  ('md-duck-east-1-2026', 'MD', 'Maryland', 'Regular Duck', 'ducks', 'Eastern Duck Zone', '2026-10-10', '2026-10-17', '2026–2027', 'tentative', 'https://www.eregulations.com/maryland/hunting/migratory-game-bird-seasons-limits'),
  ('md-duck-east-2-2026', 'MD', 'Maryland', 'Regular Duck', 'ducks', 'Eastern Duck Zone', '2026-11-14', '2026-11-27', '2026–2027', 'tentative', 'https://www.eregulations.com/maryland/hunting/migratory-game-bird-seasons-limits'),
  ('md-duck-west-2-2026', 'MD', 'Maryland', 'Regular Duck', 'ducks', 'Western Duck Zone', '2026-11-21', '2026-11-27', '2026–2027', 'tentative', 'https://www.eregulations.com/maryland/hunting/migratory-game-bird-seasons-limits'),
  ('md-duck-east-3-2026', 'MD', 'Maryland', 'Regular Duck', 'ducks', 'Eastern Duck Zone', '2026-12-15', '2027-01-30', '2026–2027', 'tentative', 'https://www.eregulations.com/maryland/hunting/migratory-game-bird-seasons-limits'),
  ('md-duck-west-3-2026', 'MD', 'Maryland', 'Regular Duck', 'ducks', 'Western Duck Zone', '2026-12-15', '2027-01-30', '2026–2027', 'tentative', 'https://www.eregulations.com/maryland/hunting/migratory-game-bird-seasons-limits'),
  ('va-september-canada-2026', 'VA', 'Virginia', 'September Canada Goose', 'geese', 'Statewide', '2026-09-01', '2026-09-25', '2026–2027', 'current', 'https://dwr.virginia.gov/hunting/regulations/migratory-gamebirds/'),
  ('va-teal-east-2026', 'VA', 'Virginia', 'September Teal', 'ducks', 'East of I-95', '2026-09-19', '2026-09-27', '2026–2027', 'current', 'https://dwr.virginia.gov/hunting/regulations/migratory-gamebirds/'),
  ('va-teal-west-2026', 'VA', 'Virginia', 'September Teal', 'ducks', 'West of I-95', '2026-09-22', '2026-09-27', '2026–2027', 'current', 'https://dwr.virginia.gov/hunting/regulations/migratory-gamebirds/'),
  ('va-duck-1-2026', 'VA', 'Virginia', 'Regular Duck / Coot / Merganser', 'ducks', 'Statewide', '2026-10-09', '2026-10-12', '2026–2027', 'current', 'https://dwr.virginia.gov/hunting/regulations/migratory-gamebirds/'),
  ('va-duck-2-2026', 'VA', 'Virginia', 'Regular Duck / Coot / Merganser', 'ducks', 'Statewide', '2026-11-18', '2026-11-29', '2026–2027', 'current', 'https://dwr.virginia.gov/hunting/regulations/migratory-gamebirds/'),
  ('va-duck-3-2026', 'VA', 'Virginia', 'Regular Duck / Coot / Merganser', 'ducks', 'Statewide', '2026-12-19', '2027-01-31', '2026–2027', 'current', 'https://dwr.virginia.gov/hunting/regulations/migratory-gamebirds/'),
  ('nd-early-canada-missouri-2026', 'ND', 'North Dakota', 'Early Canada Goose', 'geese', 'Missouri River Canada Goose Zone', '2026-08-15', '2026-09-07', '2026–2027', 'current', 'https://gf.nd.gov/regulations/small-game'),
  ('nd-early-canada-west-2026', 'ND', 'North Dakota', 'Early Canada Goose', 'geese', 'Western Canada Goose Zone', '2026-08-15', '2026-09-15', '2026–2027', 'current', 'https://gf.nd.gov/regulations/small-game'),
  ('nd-early-canada-east-2026', 'ND', 'North Dakota', 'Early Canada Goose', 'geese', 'Eastern Canada Goose Zone', '2026-08-15', '2026-09-22', '2026–2027', 'current', 'https://gf.nd.gov/regulations/small-game'),
  ('nd-duck-1-2026', 'ND', 'North Dakota', 'Duck Season', 'ducks', 'Low and High Plains Duck Units', '2026-09-26', '2026-12-06', '2026–2027', 'current', 'https://gf.nd.gov/regulations/small-game'),
  ('nd-duck-high-2-2026', 'ND', 'North Dakota', 'High Plains Duck Season', 'ducks', 'High Plains Duck Unit', '2026-12-12', '2027-01-03', '2026–2027', 'current', 'https://gf.nd.gov/regulations/small-game'),
  ('sd-august-canada-2026', 'SD', 'South Dakota', 'August Canada Goose Management Take', 'geese', 'Specified resident-only areas', '2026-08-15', '2026-08-31', '2026–2027', 'current', 'https://gfp.sd.gov/waterfowl/'),
  ('sd-early-canada-unit-1-2026', 'SD', 'South Dakota', 'Early Fall Canada Goose', 'geese', 'Canada Goose Unit 1', '2026-09-01', '2026-09-30', '2026–2027', 'current', 'https://gfp.sd.gov/waterfowl/'),
  ('sd-duck-north-middle-2026', 'SD', 'South Dakota', 'Low Plains North / Middle Duck Season', 'ducks', 'Low Plains North and Middle Duck Zones', '2026-09-26', '2026-12-08', '2026–2027', 'current', 'https://gfp.sd.gov/waterfowl/'),
  ('sd-duck-high-2026', 'SD', 'South Dakota', 'High Plains Duck Season', 'ducks', 'High Plains Duck Zone', '2026-10-10', '2027-01-14', '2026–2027', 'current', 'https://gfp.sd.gov/waterfowl/'),
  ('sd-duck-south-2026', 'SD', 'South Dakota', 'Low Plains South Duck Season', 'ducks', 'Low Plains South Duck Zone', '2026-10-24', '2027-01-05', '2026–2027', 'current', 'https://gfp.sd.gov/waterfowl/')
on conflict (id) do update set
  state_code = excluded.state_code,
  state_name = excluded.state_name,
  season_name = excluded.season_name,
  category = excluded.category,
  zone = excluded.zone,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  season_year = excluded.season_year,
  data_status = excluded.data_status,
  source_url = excluded.source_url,
  active = true,
  updated_at = now();

comment on table public.push_subscriptions is 'Per-device Web Push endpoints. Endpoints and encryption keys are user-private capability data.';
comment on table public.notification_events is 'Server-only deduplicated notification event queue.';
comment on table public.notification_inbox is 'Account-owned BlindIQ notification center records.';
comment on table public.notification_season_periods is 'Exact source-backed season segments used by automated opening and closing alerts.';
comment on table public.regulation_releases is 'Server-authored regulation publication records that trigger member alerts when published.';
comment on table public.active_hunts is 'Best-effort online hunt-session heartbeat used for unfinished-hunt reminders.';
