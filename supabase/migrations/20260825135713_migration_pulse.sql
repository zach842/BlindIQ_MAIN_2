create table if not exists public.migration_regions (
  id text primary key,
  flyway text not null check (flyway in ('Atlantic', 'Mississippi')),
  name text not null,
  short_name text not null,
  state_codes text[] not null default '{}',
  description text not null,
  latitude double precision not null,
  longitude double precision not null,
  display_order integer not null check (display_order between 1 and 20),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.migration_snapshots (
  id uuid primary key default gen_random_uuid(),
  region_id text not null references public.migration_regions(id) on delete cascade,
  species_group text not null default 'all-waterfowl',
  observed_index smallint not null check (observed_index between 0 and 100),
  forecast_index smallint not null check (forecast_index between 0 and 100),
  confidence smallint not null check (confidence between 0 and 100),
  direction text not null check (direction in ('northbound', 'southbound', 'staging')),
  trend text not null check (trend in ('rising', 'steady', 'falling')),
  status text not null,
  summary text not null,
  drivers jsonb not null default '[]'::jsonb check (jsonb_typeof(drivers) = 'array'),
  sources jsonb not null default '[]'::jsonb check (jsonb_typeof(sources) = 'array'),
  generated_at timestamptz not null,
  valid_through timestamptz not null,
  created_at timestamptz not null default now(),
  unique (region_id, species_group, generated_at)
);

create table if not exists public.migration_observations (
  id uuid primary key default gen_random_uuid(),
  region_id text not null references public.migration_regions(id) on delete cascade,
  source text not null,
  metric text not null,
  value numeric,
  unit text,
  observed_at timestamptz not null,
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object'),
  created_at timestamptz not null default now()
);

create table if not exists public.migration_source_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  status text not null check (status in ('running', 'success', 'partial', 'failed')),
  regions_attempted integer not null default 0,
  regions_updated integer not null default 0,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists migration_snapshots_region_generated_idx
  on public.migration_snapshots (region_id, generated_at desc);

create index if not exists migration_observations_region_time_idx
  on public.migration_observations (region_id, observed_at desc);

create index if not exists migration_source_runs_started_idx
  on public.migration_source_runs (started_at desc);

alter table public.migration_regions enable row level security;
alter table public.migration_snapshots enable row level security;
alter table public.migration_observations enable row level security;
alter table public.migration_source_runs enable row level security;

revoke all on table public.migration_regions from anon;
revoke all on table public.migration_snapshots from anon;
revoke all on table public.migration_observations from anon, authenticated;
revoke all on table public.migration_source_runs from anon, authenticated;

grant select on table public.migration_regions to authenticated;
grant select on table public.migration_snapshots to authenticated;
grant all on table public.migration_regions to service_role;
grant all on table public.migration_snapshots to service_role;
grant all on table public.migration_observations to service_role;
grant all on table public.migration_source_runs to service_role;

drop policy if exists "Members can read migration regions" on public.migration_regions;
create policy "Members can read migration regions"
  on public.migration_regions
  for select
  to authenticated
  using (true);

drop policy if exists "Members can read migration snapshots" on public.migration_snapshots;
create policy "Members can read migration snapshots"
  on public.migration_snapshots
  for select
  to authenticated
  using (true);

insert into public.migration_regions
  (id, flyway, name, short_name, state_codes, description, latitude, longitude, display_order)
values
  ('atlantic-north', 'Atlantic', 'Northern Atlantic', 'North', array['ME','NH','VT','MA','RI','CT','NY','PA','NJ'], 'New England, Great Lakes, upper Mid-Atlantic, and northern coastal staging areas.', 42.65, -73.75, 1),
  ('atlantic-mid', 'Atlantic', 'Mid-Atlantic', 'Mid', array['MD','DE','VA','WV'], 'Chesapeake, Delaware Bay, and central Appalachian movement corridor.', 38.48, -76.20, 2),
  ('atlantic-south', 'Atlantic', 'Southern Atlantic', 'South', array['NC','SC','GA','FL'], 'Carolina sounds, coastal marshes, and southern wintering areas.', 33.84, -78.72, 3),
  ('mississippi-north', 'Mississippi', 'Northern Mississippi', 'North', array['MN','WI','MI'], 'Prairie transition, Great Lakes, and upper Mississippi staging areas.', 44.95, -92.95, 1),
  ('mississippi-mid', 'Mississippi', 'Central Mississippi', 'Mid', array['IA','IL','IN','OH','MO','KY','TN'], 'Major river confluences and central agricultural stopover habitat.', 39.45, -90.55, 2),
  ('mississippi-south', 'Mississippi', 'Southern Mississippi', 'South', array['AR','MS','LA','AL'], 'Lower Mississippi alluvial valley and Gulf Coast wintering habitat.', 32.62, -91.45, 3)
on conflict (id) do update set
  flyway = excluded.flyway,
  name = excluded.name,
  short_name = excluded.short_name,
  state_codes = excluded.state_codes,
  description = excluded.description,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  display_order = excluded.display_order,
  active = true,
  updated_at = now();

comment on table public.migration_regions is
  'Broad BlindIQ flyway monitoring regions. These are planning regions, not legal boundaries.';

comment on table public.migration_snapshots is
  'Time-stamped observed-condition and 48-hour movement-potential summaries generated by the scheduled migration updater.';

comment on table public.migration_observations is
  'Server-only normalized source measurements used to explain and audit Migration Pulse scores.';

comment on table public.migration_source_runs is
  'Server-only health log for scheduled migration source refreshes.';
