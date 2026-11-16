-- Additive foundation; no existing hunt or migration tables are altered.
create table public.movement_sources (
 id text primary key, name text not null, kind text not null, url text not null check (url like 'https://%'),
 terms_url text, taxon text not null, cadence text not null, ingestion_mode text not null check (ingestion_mode in ('automated','manual','disabled')),
 rights_status text not null, notes text not null, checked_at date not null,
 constraint movement_automated_rights check (ingestion_mode <> 'automated' or rights_status = 'approved')
);
create table public.movement_regions (
 id text primary key, name text not null, taxon text not null check (taxon in ('white-tailed-deer','wild-turkey')),
 state_code text not null check (state_code ~ '^[A-Z]{2}$'), latitude double precision not null check(latitude between -90 and 90),
 longitude double precision not null check(longitude between -180 and 180), timezone text not null,
 scope_note text not null, active boolean not null default false, unique(id,taxon)
);
create table public.movement_knowledge (
 id text primary key, region_id text not null references public.movement_regions(id),
 source_id text not null references public.movement_sources(id), topic text not null,
 claim text not null, limitations text not null, source_locator text not null, checked_at date not null,
 review_status text not null default 'context_only' check (review_status in ('context_only','model_approved','retired')),
 unique (region_id,source_id,topic)
);
create table public.movement_model_versions (
 id text primary key, target text not null, validation_status text not null check(validation_status in ('context_only','experimental','validated')),
 validation_report_url text, created_at timestamptz not null default now(),
 check(validation_status <> 'validated' or (validation_report_url is not null and validation_report_url like 'https://%'))
);
create table public.movement_source_runs (
 id uuid primary key default gen_random_uuid(), source_id text not null references public.movement_sources(id),
 status text not null check(status in ('running','success','partial','failed')),
 regions_attempted integer not null check(regions_attempted >= 0), regions_updated integer not null default 0 check(regions_updated >= 0),
 started_at timestamptz not null, completed_at timestamptz, check(regions_updated <= regions_attempted), errors jsonb not null default '[]' check(jsonb_typeof(errors)='array')
);
create table public.movement_weather_batches (
 id uuid primary key default gen_random_uuid(), region_id text not null references public.movement_regions(id),
 source_id text not null references public.movement_sources(id), first_run_id uuid not null references public.movement_source_runs(id),
 source_url text not null check(source_url like 'https://api.weather.gov/%'), issued_at timestamptz not null, fetched_at timestamptz not null,
 content_hash text not null check(content_hash ~ '^[0-9a-f]{64}$'), periods jsonb not null check(jsonb_typeof(periods)='array' and jsonb_array_length(periods) between 12 and 48),
 unique(region_id, source_id, content_hash)
);
create table public.movement_forecast_snapshots (
 id uuid primary key default gen_random_uuid(), region_id text not null references public.movement_regions(id),
 batch_id uuid not null references public.movement_weather_batches(id), model_id text not null references public.movement_model_versions(id),
 last_run_id uuid not null references public.movement_source_runs(id), generated_at timestamptz not null, valid_through timestamptz not null,
 published boolean not null default false, activity_score smallint check(activity_score between 0 and 100),
 summary text not null, context jsonb not null check(jsonb_typeof(context)='object'),
 unique(region_id,batch_id,model_id), check(valid_through > generated_at)
);
create index movement_snapshots_region_time on public.movement_forecast_snapshots(region_id,generated_at desc);
create index movement_batches_region_time on public.movement_weather_batches(region_id,issued_at desc);
create index movement_runs_source_time on public.movement_source_runs(source_id,started_at desc);
create index movement_knowledge_source on public.movement_knowledge(source_id);
create index movement_snapshots_batch on public.movement_forecast_snapshots(batch_id);
create index movement_snapshots_model on public.movement_forecast_snapshots(model_id);
create index movement_snapshots_run on public.movement_forecast_snapshots(last_run_id);
create index movement_batches_source on public.movement_weather_batches(source_id);
create index movement_batches_run on public.movement_weather_batches(first_run_id);

-- Explicit grants and RLS. Research, raw weather and health logs stay server-only.
alter table public.movement_sources enable row level security;
alter table public.movement_regions enable row level security;
alter table public.movement_knowledge enable row level security;
alter table public.movement_model_versions enable row level security;
alter table public.movement_source_runs enable row level security;
alter table public.movement_weather_batches enable row level security;
alter table public.movement_forecast_snapshots enable row level security;
revoke all on public.movement_sources,public.movement_regions,public.movement_knowledge,public.movement_model_versions,public.movement_source_runs,public.movement_weather_batches,public.movement_forecast_snapshots from public,anon,authenticated;
grant all on public.movement_sources,public.movement_regions,public.movement_knowledge,public.movement_model_versions,public.movement_source_runs,public.movement_weather_batches,public.movement_forecast_snapshots to service_role;
grant select on public.movement_regions,public.movement_forecast_snapshots to authenticated;
create policy "Signed-in users read active movement regions" on public.movement_regions for select to authenticated using(active);
create policy "Signed-in users read fresh published movement context" on public.movement_forecast_snapshots for select to authenticated
 using(published and valid_through > now() and exists(select 1 from public.movement_regions r where r.id=region_id and r.active));

-- Keep unvalidated numeric scores out of all snapshots, including service writes.
create function public.movement_guard_snapshot() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if not exists(select 1 from public.movement_weather_batches b where b.id=new.batch_id and b.region_id=new.region_id) then
  raise exception 'Weather batch must match snapshot region';
 end if;
 if new.activity_score is not null and not exists(select 1 from public.movement_model_versions m where m.id=new.model_id and m.validation_status='validated') then
  raise exception 'Numeric activity scores require a validated model';
 end if;
 return new;
end $$;
revoke all on function public.movement_guard_snapshot() from public,anon,authenticated;
grant execute on function public.movement_guard_snapshot() to service_role;
create trigger movement_snapshot_guard before insert or update on public.movement_forecast_snapshots for each row execute function public.movement_guard_snapshot();

-- Atomic, idempotent ingestion: called by the server worker, never a browser.
create function public.movement_ingest_weather(
 p_region_id text,p_run_id uuid,p_issued_at timestamptz,p_fetched_at timestamptz,p_source_url text,p_hash text,p_periods jsonb,p_context jsonb
) returns uuid language plpgsql security invoker set search_path='' as $$
declare v_batch uuid; v_snapshot uuid; v_last timestamptz;
begin
 perform 1 from public.movement_regions where id=p_region_id and active for update;
 if not found then raise exception 'Region disabled or missing'; end if;
 if not exists(select 1 from public.movement_sources where id='nws-hourly' and ingestion_mode='automated' and rights_status='approved') then raise exception 'Source ingestion is not approved'; end if;
 if not exists(select 1 from public.movement_source_runs where id=p_run_id and source_id='nws-hourly' and status='running') then raise exception 'Ingestion run is not active'; end if;
 if p_issued_at < p_fetched_at - interval '6 hours' or p_issued_at > p_fetched_at + interval '5 minutes' then raise exception 'Stale or future weather issue time'; end if;
 if p_fetched_at > now() + interval '5 minutes' or p_fetched_at < now() - interval '1 day' then raise exception 'Invalid fetch time'; end if;
 if jsonb_typeof(p_periods) <> 'array' or jsonb_array_length(p_periods) not between 12 and 48 then raise exception 'Incomplete hourly coverage'; end if;
 if exists(select 1 from jsonb_array_elements(p_periods) x where (x->>'valid_at') is null or (x->>'valid_at')::timestamptz < p_fetched_at - interval '1 hour' or (x->>'valid_at')::timestamptz > p_fetched_at + interval '48 hours') then raise exception 'Invalid forecast interval'; end if;
 if (select count(distinct x->>'valid_at') from jsonb_array_elements(p_periods) x) <> jsonb_array_length(p_periods) then raise exception 'Duplicate hours'; end if;
 if exists(select 1 from public.movement_weather_batches where region_id=p_region_id and issued_at > p_issued_at) then raise exception 'Newer weather already exists'; end if;
 select max((x->>'valid_at')::timestamptz)+interval '1 hour' into v_last from jsonb_array_elements(p_periods) x;
 insert into public.movement_weather_batches(region_id,source_id,first_run_id,issued_at,fetched_at,source_url,content_hash,periods)
 values(p_region_id,'nws-hourly',p_run_id,p_issued_at,p_fetched_at,p_source_url,p_hash,p_periods)
 on conflict(region_id,source_id,content_hash) do update set fetched_at=excluded.fetched_at returning id into v_batch;
 insert into public.movement_forecast_snapshots(region_id,batch_id,model_id,last_run_id,generated_at,valid_through,published,activity_score,summary,context)
 values(p_region_id,v_batch,'weather-context-v0',p_run_id,p_fetched_at,least(v_last,p_fetched_at+interval '3 hours'),false,null,'Weather and sourced biological context only; animal activity model is not validated.',p_context || jsonb_build_object('biology',coalesce((select jsonb_agg(jsonb_build_object('claim',k.claim,'limitations',k.limitations,'source_id',k.source_id,'source_url',s.url,'source_locator',k.source_locator,'checked_at',k.checked_at) order by k.id) from public.movement_knowledge k join public.movement_sources s on s.id=k.source_id where k.region_id=p_region_id and k.review_status <> 'retired'),'[]'::jsonb)))
 on conflict(region_id,batch_id,model_id) do update set generated_at=excluded.generated_at,valid_through=excluded.valid_through,last_run_id=excluded.last_run_id,context=excluded.context,published=false,activity_score=null
 returning id into v_snapshot;
 return v_snapshot;
end $$;
revoke all on function public.movement_ingest_weather(text,uuid,timestamptz,timestamptz,text,text,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.movement_ingest_weather(text,uuid,timestamptz,timestamptz,text,text,jsonb,jsonb) to service_role;
insert into public.movement_model_versions(id,target,validation_status) values('weather-context-v0','environmental context, not an animal activity prediction','context_only');
comment on table public.movement_regions is 'Research pilots and representative weather points, not property boundaries or legal zones.';
comment on table public.movement_forecast_snapshots is 'Draft context by default; no live deer/turkey activity score until model validation and explicit publication.';

insert into public.movement_sources(id,name,kind,url,terms_url,taxon,cadence,ingestion_mode,rights_status,notes,checked_at) values('nws-hourly','National Weather Service hourly forecast','api','https://www.weather.gov/documentation/services-web-api','https://www.weather.gov/disclaimer','shared','hourly','automated','approved','Temperature, wind, precipitation forecasts; environmental context, not animal observations.','2026-11-16');

insert into public.movement_sources(id,name,kind,url,terms_url,taxon,cadence,ingestion_mode,rights_status,notes,checked_at) values('md-whitetail-biology','Maryland DNR whitetail biology','agency_research','https://dnr.maryland.gov/wildlife/Pages/hunt_trap/wtdeerbiology.aspx',null,'white-tailed-deer','annual_review','manual','citation_only','Regional breeding context; do not assign Maryland timing to other deer species.','2026-11-16');

insert into public.movement_sources(id,name,kind,url,terms_url,taxon,cadence,ingestion_mode,rights_status,notes,checked_at) values('ms-deer-breeding','Mississippi MDWFP breeding map','agency_research','https://www.mdwfp.com/wildlife-hunting/wildlife-species-program/deer-program/deer-breeding-date-map',null,'white-tailed-deer','annual_review','manual','review_required','Regional simulated conception dates; distinguish conception, chasing and observable movement.','2026-11-16');

insert into public.movement_sources(id,name,kind,url,terms_url,taxon,cadence,ingestion_mode,rights_status,notes,checked_at) values('msu-buck-movement','Mississippi State University buck movement','research','https://extension.msstate.edu/publications/understanding-buck-movement-how-when-and-why-bucks-navigate-the-landscape',null,'white-tailed-deer','annual_review','manual','citation_only','Research to inform model features, not a real-time feed or permission for wholesale copying.','2026-11-16');

insert into public.movement_sources(id,name,kind,url,terms_url,taxon,cadence,ingestion_mode,rights_status,notes,checked_at) values('pa-rut','Pennsylvania Game Commission rut research','agency_research','https://www.pa.gov/agencies/pgc/wildlife/discover-pa-wildlife/white-tailed-deer/when-is-the-rut',null,'white-tailed-deer','annual_review','manual','citation_only','State-specific reproductive chronology and uncertainty.','2026-11-16');

insert into public.movement_sources(id,name,kind,url,terms_url,taxon,cadence,ingestion_mode,rights_status,notes,checked_at) values('usfs-turkey-weather','USDA Forest Service turkey gobbling/weather paper','research','https://research.fs.usda.gov/treesearch/64503','https://doi.org/10.1002/ece3.9018','wild-turkey','annual_review','manual','citation_only','Southeastern Eastern wild turkey acoustic research; gobbling is not the same target as movement.','2026-11-16');

insert into public.movement_sources(id,name,kind,url,terms_url,taxon,cadence,ingestion_mode,rights_status,notes,checked_at) values('sc-turkey-research','SCDNR turkey research report','agency_research','https://www.dnr.sc.gov/wildlife/turkey/pdf/2018SCDNRTurkeyReporttoGeneralAssembly.pdf',null,'wild-turkey','annual_review','manual','citation_only','Lower coastal plain breeding, nesting and gobbling; do not generalize dates statewide or nationwide.','2026-11-16');

insert into public.movement_sources(id,name,kind,url,terms_url,taxon,cadence,ingestion_mode,rights_status,notes,checked_at) values('sc-turkey-harvest','SCDNR 2025 turkey harvest report','agency_report','https://www.dnr.sc.gov/wildlife/turkey/2025TurkeyHarvest.html',null,'wild-turkey','annual','manual','review_required','Seasonal effort/harvest context with reporting bias; not a live gobbling feed.','2026-11-16');

insert into public.movement_sources(id,name,kind,url,terms_url,taxon,cadence,ingestion_mode,rights_status,notes,checked_at) values('movebank','Movebank telemetry studies','dataset_catalog','https://www.movebank.org/cms/movebank-content/access-data','https://www.movebank.org/cms/movebank-content/data-policy','shared','per_study','disabled','per_study_permission','GPS studies for training/validation only after species/region/download/commercial rights review. No study license accepted automatically.','2026-11-16');

insert into public.movement_sources(id,name,kind,url,terms_url,taxon,cadence,ingestion_mode,rights_status,notes,checked_at) values('ebird','Cornell eBird','api','https://support.ebird.org/en/support/solutions/articles/48000838205-download-ebird-data','https://www.birds.cornell.edu/home/ebird-api-terms-of-use/','wild-turkey','variable','disabled','commercial_permission_required','Turkey occurrence/effort context only after explicit commercial permission. API availability does not grant commercial use.','2026-11-16');

insert into public.movement_sources(id,name,kind,url,terms_url,taxon,cadence,ingestion_mode,rights_status,notes,checked_at) values('usgs-nlcd','USGS Annual NLCD','habitat','https://www.usgs.gov/centers/eros/science/annual-nlcd-data-access',null,'shared','annual','disabled','review_required','Land cover and habitat covariates; public-domain products, review delivery terms and chosen version; not animal movement.','2026-11-16');

insert into public.movement_sources(id,name,kind,url,terms_url,taxon,cadence,ingestion_mode,rights_status,notes,checked_at) values('usa-npn','USA National Phenology Network','phenology','https://www.usanpn.org/data/code','https://data.usanpn.org/','shared','daily_or_seasonal','disabled','review_required','Green-up and spring timing candidate; verify exact product license, coverage and issue date before integration.','2026-11-16');

insert into public.movement_regions(id,name,taxon,state_code,latitude,longitude,timezone,scope_note,active) values('md-whitetail-pilot','Maryland whitetail pilot reference point','white-tailed-deer','MD','38.48','-76.2','America/New_York','Representative pilot weather point, not a statewide or property-specific forecast.',true);

insert into public.movement_regions(id,name,taxon,state_code,latitude,longitude,timezone,scope_note,active) values('sc-coastal-turkey-pilot','South Carolina lower coastal plain turkey pilot','wild-turkey','SC','33.3','-81.6','America/New_York','Representative research-region weather point. No parcel, statewide or all-subspecies prediction.',true);

insert into public.movement_knowledge(id,region_id,source_id,topic,claim,limitations,source_locator,checked_at) values
('md-whitetail-breeding','md-whitetail-pilot','md-whitetail-biology','breeding_context','Maryland whitetail breeding extends from October into mid-December; most pregnancies begin in the first half of November.','Broad biology, not an exact daily movement forecast; not applicable to sika or Sitka deer.','Reproduction section','2026-11-16'),
('sc-turkey-weather-context','sc-coastal-turkey-pilot','usfs-turkey-weather','gobbling_weather','A southeastern US acoustic study found associations between weather and Eastern wild turkey gobbling activity.','Gobbling is not movement or harvest success; published results do not validate BlindIQ coefficients or all turkey subspecies.','2022 abstract and DOI 10.1002/ece3.9018','2026-11-16');

-- Optional future first-party observations. No existing hunts are copied or shared.
create table public.movement_field_observations (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 client_event_id uuid not null, region_id text,
 taxon text not null check(taxon in ('white-tailed-deer','wild-turkey')), occurred_at timestamptz not null,
 effort_minutes integer not null check(effort_minutes between 1 and 1440),
 sightings integer not null check(sightings >= 0), gobbles integer check(gobbles >= 0),
 training_consent boolean not null default false, created_at timestamptz not null default now(),
 foreign key(region_id,taxon) references public.movement_regions(id,taxon),
 unique(user_id,client_event_id), check(taxon='wild-turkey' or gobbles is null)
);
create index movement_field_user_time on public.movement_field_observations(user_id,occurred_at desc);
create index movement_field_region on public.movement_field_observations(region_id);
alter table public.movement_field_observations enable row level security;
revoke all on public.movement_field_observations from public,anon,authenticated;
grant select,insert,update,delete on public.movement_field_observations to authenticated;
grant all on public.movement_field_observations to service_role;
create policy "Users read own movement observations" on public.movement_field_observations for select to authenticated using((select auth.uid())=user_id);
create policy "Users insert own movement observations" on public.movement_field_observations for insert to authenticated with check((select auth.uid())=user_id);
create policy "Users update own movement observations" on public.movement_field_observations for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy "Users delete own movement observations" on public.movement_field_observations for delete to authenticated using((select auth.uid())=user_id);
comment on table public.movement_field_observations is 'Private optional observations with effort; no automatic hunt import, exact coordinates, or training enrollment.';

insert into public.movement_sources(id,name,kind,url,terms_url,taxon,cadence,ingestion_mode,rights_status,notes,checked_at) values('dryad-turkey-gobbling','Dryad turkey gobbling and weather 2014–2018','research_dataset','https://doi.org/10.5061/dryad.573n5tb9k','https://datadryad.org/terms','wild-turkey','versioned_release','manual','cc0_dataset_review','Daily gobble counts, recording-unit effort and weather covariates; offline research candidate, not a live feed.','2026-11-16');

insert into public.movement_sources(id,name,kind,url,terms_url,taxon,cadence,ingestion_mode,rights_status,notes,checked_at) values('dryad-turkey-gps','Dryad male wild turkey GPS 2020–2021','research_dataset','https://doi.org/10.5061/dryad.rv15dv4fb','https://datadryad.org/terms','wild-turkey','versioned_release','manual','cc0_dataset_review','Historical male turkey tracks; hold out animals/sites and preserve fix-quality filters. Not all subspecies or live locations.','2026-11-16');

insert into public.movement_sources(id,name,kind,url,terms_url,taxon,cadence,ingestion_mode,rights_status,notes,checked_at) values('dryad-whitetail-gps','Dryad southern Illinois whitetail GPS 2023–2025','research_dataset','https://doi.org/10.5061/dryad.51c59zwr4','https://datadryad.org/terms','white-tailed-deer','versioned_release','manual','cc0_dataset_review','125 animals across three southern Illinois study sites. Road-encounter sampling context; avoid population-wide or rut-only generalizations.','2026-11-16');

insert into public.movement_sources(id,name,kind,url,terms_url,taxon,cadence,ingestion_mode,rights_status,notes,checked_at) values('noaa-ncei','NOAA NCEI historical weather','api','https://www.ncei.noaa.gov/cdo-web/webservices/v2','https://www.ncei.noaa.gov/cdo-web/token','shared','historical','disabled','product_review_and_token_required','Historical station weather for back-tests; select product/units/station coverage. API token required for CDO v2.','2026-11-16');
