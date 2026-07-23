-- T1-5 · Camera-first capture + venue-geofence auto-filing (Rank 5,
-- docs/compvss/MOBILE_BEST_PRACTICES_2026-07.md).
--
-- `venue_geofences` — org-scoped circular geofences over the canonical venue
-- store (`locations`). The COMPVSS Capture surface resolves a device fix
-- against these circles to auto-file field photos into the right project's
-- daily log (CompanyCam mechanic: crew shoots first, the app files it).
--
-- Shape notes:
--   * `location_id` → public.locations, the space registry (LEG3ND hub is its
--     write surface). One location may carry several circles (gate, dock,
--     bowl) — hence a separate table rather than columns on locations.
--   * `project_id` is an OPTIONAL active-event override: when set, a fix
--     inside this circle files straight to that project without consulting
--     the venue→project linkage (venues.location_id / events.location_id).
--     ON DELETE SET NULL — the fence outlives the show and falls back to
--     derived resolution.
--   * LDP: no lifecycle here — a fence is configuration, not a workflow.
--     `active` is a plain visibility flag (mirrors time_clock_zones).

create table if not exists public.venue_geofences (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  -- Operator-facing name for the circle ("Load-In Gate", "North Lot").
  -- Falls back to the location name in UI when null.
  label text,
  center_lat numeric not null check (center_lat >= -90 and center_lat <= 90),
  center_lng numeric not null check (center_lng >= -180 and center_lng <= 180),
  -- 10 m floor (below GPS accuracy it's noise), 10 km ceiling (a "fence"
  -- larger than that would swallow a city and mis-file everything).
  radius_m integer not null default 250 check (radius_m >= 10 and radius_m <= 10000),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- FK + hot-path indexes (org-scoped active lookup is the capture read).
create index if not exists idx_venue_geofences_org_active on public.venue_geofences (org_id) where active;
create index if not exists idx_venue_geofences_location on public.venue_geofences (location_id);
create index if not exists idx_venue_geofences_project on public.venue_geofences (project_id) where project_id is not null;

create trigger venue_geofences_touch_updated_at
  before update on public.venue_geofences
  for each row execute function public.touch_updated_at();

alter table public.venue_geofences enable row level security;

-- pg_default_acl grants anon SELECT on new tables — revoke explicitly.
revoke all on public.venue_geofences from anon;
grant select, insert, update, delete on public.venue_geofences to authenticated;

-- Org members read (every crew member's capture screen needs the circles);
-- manager band writes (fence admin lives on the LEG3ND hub location detail).
create policy venue_geofences_select on public.venue_geofences
  for select to authenticated
  using (private.is_org_member(org_id));

create policy venue_geofences_write on public.venue_geofences
  for all to authenticated
  using (private.has_org_role(org_id, array['owner','admin','manager','controller']))
  with check (private.has_org_role(org_id, array['owner','admin','manager','controller']));
