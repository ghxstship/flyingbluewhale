-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 046: Location Canonization
-- Normalizes all denormalized location references to FK
-- pointers into the canonical `locations` table.
-- Additive-only: deprecated columns kept for backward compat.
-- ═══════════════════════════════════════════════════════

-- ─── 1. Expand location type taxonomy ────────────────
-- Drop old CHECK constraint and replace with enum
alter table locations drop constraint if exists locations_type_check;
alter table locations add constraint locations_type_check
  check (type in (
    'warehouse','site','dock','stage','storage','vehicle','vendor',
    'venue','office','room','gate','zone','loading_bay','parking',
    'green_room','production_office','kitchen','bar','dining',
    'performance','backstage','other'
  ));

-- ─── 2. Project ↔ Venue FK ──────────────────────────
-- Canonical FK link from project to its venue location
alter table projects
  add column if not exists venue_id uuid references locations(id) on delete set null;

create index if not exists idx_projects_venue on projects(venue_id);

-- ─── 3. Catering meal plan location FK ──────────────
alter table catering_meal_plans
  add column if not exists location_id uuid references locations(id) on delete set null;

create index if not exists idx_meal_plans_location on catering_meal_plans(location_id);

-- ─── 4. Credential check-in location FK ─────────────
alter table credential_check_ins
  add column if not exists location_id uuid references locations(id) on delete set null;

create index if not exists idx_checkin_location on credential_check_ins(location_id);

-- ─── 5. Ticket scan location FK ─────────────────────
alter table ticket_scans
  add column if not exists location_id uuid references locations(id) on delete set null;

create index if not exists idx_ticket_scan_location on ticket_scans(location_id);

-- ─── 6. Lost & Found: lost_location_id FK ───────────
alter table lost_found_reports
  add column if not exists lost_location_id uuid references locations(id) on delete set null;

create index if not exists idx_lf_lost_location on lost_found_reports(lost_location_id);

-- ─── 7. Spaces ↔ Locations bridge ───────────────────
-- Every space should have a corresponding canonical location record
alter table spaces
  add column if not exists location_id uuid references locations(id) on delete set null;

create index if not exists idx_spaces_location on spaces(location_id);

-- ─── 8. Backfill: Create venue locations from seed project JSONB ───

-- 8a. iii Joints 2026 → Factory Town venue
insert into locations (id, organization_id, project_id, name, slug, type, address, capacity, contact, metadata)
select
  'f0000001-0000-0000-0000-fac707100001'::uuid,
  p.organization_id,
  p.id,
  'Factory Town',
  'factory-town',
  'venue',
  jsonb_build_object(
    'street', '4800 NW 37th Ave',
    'city', 'Miami',
    'state', 'FL',
    'zip', '33142'
  ),
  jsonb_build_object('total', 5000),
  jsonb_build_object(
    'day_of_show', (p.venue->'dos_contacts')
  ),
  jsonb_build_object(
    'indoor_outdoor', 'both',
    'parking', 'No on-site parking. Rideshare recommended.'
  )
from projects p
where p.id = 'a0000001-0000-0000-0000-111101005000'::uuid
on conflict (id) do nothing;

-- Set venue_id FK
update projects set venue_id = 'f0000001-0000-0000-0000-fac707100001'::uuid
where id = 'a0000001-0000-0000-0000-111101005000'::uuid;

-- 8b. Salvage City at EDC LV → Las Vegas Motor Speedway venue
insert into locations (id, organization_id, project_id, name, slug, type, address, capacity, contact, metadata)
select
  'f0000002-0000-0000-0000-1a5e9a500001'::uuid,
  p.organization_id,
  p.id,
  'Las Vegas Motor Speedway',
  'las-vegas-motor-speedway',
  'venue',
  jsonb_build_object(
    'street', '7000 Las Vegas Blvd N',
    'city', 'Las Vegas',
    'state', 'NV',
    'zip', '89115'
  ),
  jsonb_build_object('total', 170000),
  '{}'::jsonb,
  jsonb_build_object(
    'indoor_outdoor', 'outdoor',
    'area', 'Nomads Land',
    'parent_event', 'Electric Daisy Carnival Las Vegas 2026',
    'parent_event_dates', 'May 15-17, 2026'
  )
from projects p
where p.id = 'a0000002-0000-0000-0000-5a1a9ec17200'::uuid
on conflict (id) do nothing;

update projects set venue_id = 'f0000002-0000-0000-0000-1a5e9a500001'::uuid
where id = 'a0000002-0000-0000-0000-5a1a9ec17200'::uuid;

-- ─── 9. Backfill: Create child locations from iii Joints spaces ───

-- Satiiiva (The Park)
insert into locations (id, organization_id, project_id, parent_id, name, slug, type, metadata)
select 'f0000001-0000-0000-0000-57a9e00000a1'::uuid,
  p.organization_id, p.id, 'f0000001-0000-0000-0000-fac707100001'::uuid,
  'Satiiiva (The Park)', 'satiiiva-the-park', 'stage',
  '{"backline": {"cdj": {"model": "CDJ-3000", "quantity": 4}, "mixer": {"model": "DJM-V10", "quantity": 1}, "extras": [{"model": "RMX-1000", "quantity": 1}]}}'::jsonb
from projects p where p.id = 'a0000001-0000-0000-0000-111101005000'::uuid
on conflict (id) do nothing;

-- Strain Room (Chain Room)
insert into locations (id, organization_id, project_id, parent_id, name, slug, type, metadata)
select 'f0000001-0000-0000-0000-57a9e00000a2'::uuid,
  p.organization_id, p.id, 'f0000001-0000-0000-0000-fac707100001'::uuid,
  'Strain Room (Chain Room)', 'strain-room-chain-room', 'stage',
  '{"backline": {"cdj": {"model": "CDJ-3000", "quantity": 4}, "mixer": {"model": "DJM-V10", "quantity": 1}}}'::jsonb
from projects p where p.id = 'a0000001-0000-0000-0000-111101005000'::uuid
on conflict (id) do nothing;

-- Skate Space (Warehouse)
insert into locations (id, organization_id, project_id, parent_id, name, slug, type, metadata)
select 'f0000001-0000-0000-0000-57a9e00000a3'::uuid,
  p.organization_id, p.id, 'f0000001-0000-0000-0000-fac707100001'::uuid,
  'Skate Space (Warehouse)', 'skate-space-warehouse', 'stage',
  '{"backline": {"cdj": {"model": "CDJ-3000", "quantity": 4}, "mixer": {"model": "DJM-A9", "quantity": 1}, "extras": [{"model": "Turntable", "quantity": 2}]}}'::jsonb
from projects p where p.id = 'a0000001-0000-0000-0000-111101005000'::uuid
on conflict (id) do nothing;

-- Kush Gardens (Cypress End)
insert into locations (id, organization_id, project_id, parent_id, name, slug, type, metadata)
select 'f0000001-0000-0000-0000-57a9e00000a4'::uuid,
  p.organization_id, p.id, 'f0000001-0000-0000-0000-fac707100001'::uuid,
  'Kush Gardens (Cypress End)', 'kush-gardens-cypress-end', 'stage',
  '{"backline": {"cdj": {"model": "CDJ-3000", "quantity": 4}, "mixer": {"model": "DJM-V10", "quantity": 1}}}'::jsonb
from projects p where p.id = 'a0000001-0000-0000-0000-111101005000'::uuid
on conflict (id) do nothing;

-- Diesel Den (Engine Room)
insert into locations (id, organization_id, project_id, parent_id, name, slug, type, metadata)
select 'f0000001-0000-0000-0000-57a9e00000a5'::uuid,
  p.organization_id, p.id, 'f0000001-0000-0000-0000-fac707100001'::uuid,
  'Diesel Den (Engine Room)', 'diesel-den-engine-room', 'stage',
  '{"backline": {"cdj": {"model": "CDJ-3000", "quantity": 4}, "mixer": {"model": "DJM-V10", "quantity": 1}}}'::jsonb
from projects p where p.id = 'a0000001-0000-0000-0000-111101005000'::uuid
on conflict (id) do nothing;

-- Reefer Theater (Infinity Room)
insert into locations (id, organization_id, project_id, parent_id, name, slug, type, metadata)
select 'f0000001-0000-0000-0000-57a9e00000a6'::uuid,
  p.organization_id, p.id, 'f0000001-0000-0000-0000-fac707100001'::uuid,
  'Reefer Theater (Infinity Room)', 'reefer-theater-infinity-room', 'stage',
  '{"backline": {"cdj": {"model": "CDJ-3000", "quantity": 4}, "mixer": {"model": "DJM-A9", "quantity": 1}, "notes": "Hybrid stage: DJ + live bands + game shows + film"}}'::jsonb
from projects p where p.id = 'a0000001-0000-0000-0000-111101005000'::uuid
on conflict (id) do nothing;

-- ─── 10. Bridge spaces → locations ──────────────────
-- Link each iii Joints space to its canonical location
update spaces set location_id = 'f0000001-0000-0000-0000-57a9e00000a1'::uuid where id = 'b0000001-0000-0000-0000-5a7111a00001'::uuid;
update spaces set location_id = 'f0000001-0000-0000-0000-57a9e00000a2'::uuid where id = 'b0000001-0000-0000-0000-573a10200001'::uuid;
update spaces set location_id = 'f0000001-0000-0000-0000-57a9e00000a3'::uuid where id = 'b0000001-0000-0000-0000-50a7e50ace01'::uuid;
update spaces set location_id = 'f0000001-0000-0000-0000-57a9e00000a4'::uuid where id = 'b0000001-0000-0000-0000-005b9a4de051'::uuid;
update spaces set location_id = 'f0000001-0000-0000-0000-57a9e00000a5'::uuid where id = 'b0000001-0000-0000-0000-d1e5e1de0001'::uuid;
update spaces set location_id = 'f0000001-0000-0000-0000-57a9e00000a6'::uuid where id = 'b0000001-0000-0000-0000-4eefe47bea71'::uuid;

-- ─── 11. Backfill: Salvage City spaces → locations ──

-- Main Dining Tent
insert into locations (id, organization_id, project_id, parent_id, name, slug, type, capacity, metadata)
select 'f0000002-0000-0000-0000-57a9e00000b1'::uuid,
  p.organization_id, p.id, 'f0000002-0000-0000-0000-1a5e9a500001'::uuid,
  'Main Dining Tent', 'main-dining-tent', 'dining',
  '{"seated": 80}'::jsonb,
  '{"tables": 4, "seats_per_table": 20, "layout": "family_style", "decor_theme": "post_apocalyptic"}'::jsonb
from projects p where p.id = 'a0000002-0000-0000-0000-5a1a9ec17200'::uuid
on conflict (id) do nothing;

-- Production Kitchen
insert into locations (id, organization_id, project_id, parent_id, name, slug, type, metadata)
select 'f0000002-0000-0000-0000-57a9e00000b2'::uuid,
  p.organization_id, p.id, 'f0000002-0000-0000-0000-1a5e9a500001'::uuid,
  'Production Kitchen', 'production-kitchen', 'kitchen',
  '{"type": "full_service", "courses": 5, "services_per_night": 3}'::jsonb
from projects p where p.id = 'a0000002-0000-0000-0000-5a1a9ec17200'::uuid
on conflict (id) do nothing;

-- Performance Area
insert into locations (id, organization_id, project_id, parent_id, name, slug, type, metadata)
select 'f0000002-0000-0000-0000-57a9e00000b3'::uuid,
  p.organization_id, p.id, 'f0000002-0000-0000-0000-1a5e9a500001'::uuid,
  'Performance Area', 'performance-area', 'performance',
  '{"type": "immersive", "acts": ["circus", "aerial", "theatrical"], "integrated_with_dining": true}'::jsonb
from projects p where p.id = 'a0000002-0000-0000-0000-5a1a9ec17200'::uuid
on conflict (id) do nothing;

-- Bar & Cocktail Station
insert into locations (id, organization_id, project_id, parent_id, name, slug, type, metadata)
select 'f0000002-0000-0000-0000-57a9e00000b4'::uuid,
  p.organization_id, p.id, 'f0000002-0000-0000-0000-1a5e9a500001'::uuid,
  'Bar & Cocktail Station', 'bar-cocktail-station', 'bar',
  '{"type": "full_bar", "free_flowing": true, "cocktails": true, "wine": true, "soft_drinks": true}'::jsonb
from projects p where p.id = 'a0000002-0000-0000-0000-5a1a9ec17200'::uuid
on conflict (id) do nothing;

-- Backstage / Green Room
insert into locations (id, organization_id, project_id, parent_id, name, slug, type, metadata)
select 'f0000002-0000-0000-0000-57a9e00000b5'::uuid,
  p.organization_id, p.id, 'f0000002-0000-0000-0000-1a5e9a500001'::uuid,
  'Backstage / Green Room', 'backstage-green-room', 'green_room',
  '{"type": "crew_area"}'::jsonb
from projects p where p.id = 'a0000002-0000-0000-0000-5a1a9ec17200'::uuid
on conflict (id) do nothing;

-- Link Salvage City spaces
update spaces set location_id = 'f0000002-0000-0000-0000-57a9e00000b1'::uuid where id = 'b0000002-0000-0000-0000-d1010970e001'::uuid;
update spaces set location_id = 'f0000002-0000-0000-0000-57a9e00000b2'::uuid where id = 'b0000002-0000-0000-0000-0170be000001'::uuid;
update spaces set location_id = 'f0000002-0000-0000-0000-57a9e00000b3'::uuid where id = 'b0000002-0000-0000-0000-0e4f04be4501'::uuid;
update spaces set location_id = 'f0000002-0000-0000-0000-57a9e00000b4'::uuid where id = 'b0000002-0000-0000-0000-ba4000000001'::uuid;
update spaces set location_id = 'f0000002-0000-0000-0000-57a9e00000b5'::uuid where id = 'b0000002-0000-0000-0000-bac05790e001'::uuid;

-- ─── 12. Backfill: Link catering meal plans to dining tent location ──
update catering_meal_plans
  set location_id = 'f0000002-0000-0000-0000-57a9e00000b1'::uuid
where project_id = 'a0000002-0000-0000-0000-5a1a9ec17200'::uuid
  and location_id is null;
