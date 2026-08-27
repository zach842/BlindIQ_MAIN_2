alter table public.migration_regions
  drop constraint if exists migration_regions_flyway_check;

alter table public.migration_regions
  add constraint migration_regions_flyway_check
  check (flyway in ('Atlantic', 'Mississippi', 'Central', 'Pacific'));

insert into public.migration_regions
  (id, flyway, name, short_name, state_codes, description, latitude, longitude, display_order)
values
  ('central-north', 'Central', 'Northern Central', 'North', array['MT*','ND','SD'], 'Northern Great Plains, prairie potholes, and upper Central Flyway staging areas.', 45.45, -101.20, 1),
  ('central-mid', 'Central', 'Central Plains', 'Mid', array['WY*','CO*','NE','KS'], 'High Plains reservoirs, Platte corridor, and central agricultural stopover habitat.', 40.45, -99.45, 2),
  ('central-south', 'Central', 'Southern Central', 'South', array['NM*','OK','TX'], 'Southern High Plains, Red River corridor, and Gulf Coast wintering habitat.', 34.75, -99.25, 3)
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

do $$
begin
  if to_regclass('public.notification_preferences') is not null then
    execute 'alter table public.notification_preferences alter column followed_flyways set default array[''Atlantic'',''Mississippi'',''Central'']::text[]';
    execute 'update public.notification_preferences set followed_flyways = array_append(followed_flyways, ''Central''), updated_at = now() where not (''Central'' = any(followed_flyways))';
  end if;
end
$$;

do $$
declare
  central_region_count integer;
begin
  select count(*) into central_region_count
  from public.migration_regions
  where flyway = 'Central' and active = true;

  if central_region_count <> 3 then
    raise exception 'Central Flyway verification failed: expected 3 active regions, found %', central_region_count;
  end if;
end
$$;

comment on constraint migration_regions_flyway_check on public.migration_regions is
  'Allows the Atlantic, Mississippi, and Central Flyway planning reports.';
