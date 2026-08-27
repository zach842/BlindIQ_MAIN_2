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
  ('central-south', 'Central', 'Southern Central', 'South', array['NM*','OK','TX'], 'Southern High Plains, Red River corridor, and Gulf Coast wintering habitat.', 34.75, -99.25, 3),
  ('pacific-north', 'Pacific', 'Alaska & North Pacific', 'North', array['AK'], 'Alaska breeding and staging areas feeding the Pacific coastal and interior migration corridors.', 61.22, -149.90, 1),
  ('pacific-mid', 'Pacific', 'Pacific Northwest', 'Mid', array['WA','OR','ID','MT*','WY*'], 'Pacific Northwest wetlands, Columbia Basin, and northern Intermountain staging habitat.', 43.62, -116.20, 2),
  ('pacific-south', 'Pacific', 'Pacific Southwest', 'South', array['CA','NV','UT','AZ','CO*','NM*'], 'California valleys, Great Basin, desert wetlands, and southwestern wintering habitat.', 36.74, -119.78, 3)
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
    execute 'alter table public.notification_preferences alter column followed_flyways set default array[''Atlantic'',''Mississippi'',''Central'',''Pacific'']::text[]';
    execute 'update public.notification_preferences set followed_flyways = array_append(followed_flyways, ''Central''), updated_at = now() where not (''Central'' = any(followed_flyways))';
    execute 'update public.notification_preferences set followed_flyways = array_append(followed_flyways, ''Pacific''), updated_at = now() where not (''Pacific'' = any(followed_flyways))';
  end if;
end
$$;

do $$
declare
  central_region_count integer;
  pacific_region_count integer;
begin
  select count(*) into central_region_count
  from public.migration_regions
  where flyway = 'Central' and active = true;

  select count(*) into pacific_region_count
  from public.migration_regions
  where flyway = 'Pacific' and active = true;

  if central_region_count <> 3 or pacific_region_count <> 3 then
    raise exception 'Flyway verification failed: expected 3 Central and 3 Pacific regions, found % and %', central_region_count, pacific_region_count;
  end if;
end
$$;

comment on constraint migration_regions_flyway_check on public.migration_regions is
  'Allows all four U.S. administrative flyway planning reports.';
