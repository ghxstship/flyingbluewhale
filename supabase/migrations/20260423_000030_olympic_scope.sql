-- fbw_030 · Olympic-grade scope foundation.
-- Covers Wave 1 P0 tables across ATLVS, GVTEWAY, COMPVSS per docs/ia/benchmarks.
-- Canonical reuse: one rate-card engine, one Ceremonies/RoS, one gate scan,
-- incidents substrate hosts safeguarding + medical + cyber + cases sub-types.

-- ═══ Programs ════════════════════════════════════════════════════════════
do $$ begin create type risk_likelihood as enum ('rare','unlikely','possible','likely','almost_certain'); exception when duplicate_object then null; end $$;
do $$ begin create type risk_impact     as enum ('insignificant','minor','moderate','major','severe'); exception when duplicate_object then null; end $$;
do $$ begin create type risk_status     as enum ('open','mitigating','accepted','closed'); exception when duplicate_object then null; end $$;
do $$ begin create type raid_kind       as enum ('risk','assumption','issue','dependency'); exception when duplicate_object then null; end $$;

create table if not exists risks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  project_id uuid,
  kind raid_kind not null default 'risk',
  title text not null,
  description text,
  category text,
  likelihood risk_likelihood not null default 'possible',
  impact risk_impact not null default 'moderate',
  inherent_score int generated always as (
    (case likelihood when 'rare' then 1 when 'unlikely' then 2 when 'possible' then 3 when 'likely' then 4 else 5 end)
    *
    (case impact when 'insignificant' then 1 when 'minor' then 2 when 'moderate' then 3 when 'major' then 4 else 5 end)
  ) stored,
  residual_score int,
  status risk_status not null default 'open',
  owner_id uuid,
  treatment text,
  due_on date,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists risks_org_status_idx on risks (org_id, status);
alter table risks enable row level security;
create policy risks_select on risks for select to authenticated using (is_org_member(org_id));
create policy risks_insert on risks for insert to authenticated with check (has_org_role(org_id, array['owner','admin','controller','collaborator']));
create policy risks_update on risks for update to authenticated using (has_org_role(org_id, array['owner','admin','controller','collaborator'])) with check (has_org_role(org_id, array['owner','admin','controller','collaborator']));
create policy risks_delete on risks for delete to authenticated using (has_org_role(org_id, array['owner','admin']));

create table if not exists program_reviews (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  title text not null,
  scheduled_at timestamptz not null,
  attendees jsonb not null default '[]'::jsonb,
  agenda jsonb not null default '[]'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  decisions jsonb not null default '[]'::jsonb,
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table program_reviews enable row level security;
create policy program_reviews_rw on program_reviews for all to authenticated using (is_org_member(org_id)) with check (is_org_member(org_id));

create table if not exists readiness_exercises (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  project_id uuid,
  name text not null,
  kind text not null default 'ttx',
  scheduled_at timestamptz,
  scenario jsonb not null default '{}'::jsonb,
  injects jsonb not null default '[]'::jsonb,
  aar jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table readiness_exercises enable row level security;
create policy readiness_exercises_rw on readiness_exercises for all to authenticated using (is_org_member(org_id)) with check (is_org_member(org_id));

-- ═══ Venues ══════════════════════════════════════════════════════════════
do $$ begin create type venue_kind as enum ('competition','training','live_site','ibc','mpc','village','support'); exception when duplicate_object then null; end $$;
do $$ begin create type handover_state as enum ('not_started','inspection','snag','sign_off','accepted','closeout'); exception when duplicate_object then null; end $$;

create table if not exists venues (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  project_id uuid,
  location_id uuid,
  name text not null,
  kind venue_kind not null default 'competition',
  cluster text,
  capacity int,
  handover_state handover_state not null default 'not_started',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists venues_org_kind_idx on venues (org_id, kind);
alter table venues enable row level security;
create policy venues_rw on venues for all to authenticated using (is_org_member(org_id)) with check (is_org_member(org_id));

create table if not exists venue_zones (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  venue_id uuid not null references venues(id) on delete cascade,
  code text not null,
  name text not null,
  parent_zone_id uuid references venue_zones(id) on delete set null,
  allowed_categories jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create unique index if not exists venue_zones_venue_code_idx on venue_zones (venue_id, code);
alter table venue_zones enable row level security;
create policy venue_zones_rw on venue_zones for all to authenticated using (is_org_member(org_id)) with check (is_org_member(org_id));

create table if not exists venue_certifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  venue_id uuid not null references venues(id) on delete cascade,
  issuer text not null,
  certificate text not null,
  issued_on date,
  expires_on date,
  file_path text,
  created_at timestamptz not null default now()
);
alter table venue_certifications enable row level security;
create policy venue_certifications_rw on venue_certifications for all to authenticated using (is_org_member(org_id)) with check (is_org_member(org_id));

-- ═══ Accreditation ═══════════════════════════════════════════════════════
do $$ begin create type accreditation_state as enum ('applied','vetting','approved','issued','suspended','revoked','expired'); exception when duplicate_object then null; end $$;
do $$ begin create type vetting_state       as enum ('pending','in_progress','clear','flagged','failed'); exception when duplicate_object then null; end $$;

create table if not exists accreditation_categories (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  code text not null,
  name text not null,
  color text,
  description text,
  zone_privileges jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create unique index if not exists accreditation_categories_code_idx on accreditation_categories (org_id, code);
alter table accreditation_categories enable row level security;
create policy accreditation_categories_rw on accreditation_categories for all to authenticated using (is_org_member(org_id)) with check (has_org_role(org_id, array['owner','admin','controller']));
create policy accreditation_categories_read on accreditation_categories for select to authenticated using (is_org_member(org_id));

create table if not exists accreditations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  person_name text not null,
  person_email text,
  user_id uuid,
  delegation_id uuid,
  category_id uuid references accreditation_categories(id),
  state accreditation_state not null default 'applied',
  vetting vetting_state not null default 'pending',
  card_barcode text unique,
  valid_from date,
  valid_to date,
  issued_at timestamptz,
  revoked_at timestamptz,
  revoke_reason text,
  photo_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists accreditations_org_state_idx on accreditations (org_id, state);
create index if not exists accreditations_user_idx on accreditations (user_id);
alter table accreditations enable row level security;
create policy accreditations_select on accreditations for select to authenticated using (is_org_member(org_id) or user_id = auth.uid());
create policy accreditations_admin on accreditations for all to authenticated using (has_org_role(org_id, array['owner','admin','controller'])) with check (has_org_role(org_id, array['owner','admin','controller']));

create table if not exists access_scans (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  accreditation_id uuid references accreditations(id),
  venue_id uuid references venues(id),
  zone_id uuid references venue_zones(id),
  gate_code text,
  result text not null, -- 'allow' | 'deny' | 'warn'
  reason text,
  scanned_by uuid,
  scanned_at timestamptz not null default now(),
  device_id text
);
create index if not exists access_scans_org_time_idx on access_scans (org_id, scanned_at desc);
create index if not exists access_scans_accred_idx on access_scans (accreditation_id);
alter table access_scans enable row level security;
create policy access_scans_select on access_scans for select to authenticated using (is_org_member(org_id));
create policy access_scans_insert on access_scans for insert to authenticated with check (is_org_member(org_id));

create table if not exists accreditation_changes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  accreditation_id uuid not null references accreditations(id) on delete cascade,
  kind text not null, -- replace | upgrade | revoke
  requested_by uuid,
  status text not null default 'pending',
  decided_by uuid,
  decided_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);
alter table accreditation_changes enable row level security;
create policy accreditation_changes_select on accreditation_changes for select to authenticated using (is_org_member(org_id));
create policy accreditation_changes_write on accreditation_changes for all to authenticated using (has_org_role(org_id, array['owner','admin','controller'])) with check (has_org_role(org_id, array['owner','admin','controller']));

-- ═══ Workforce ═══════════════════════════════════════════════════════════
do $$ begin create type workforce_kind    as enum ('paid_staff','volunteer','contractor','official'); exception when duplicate_object then null; end $$;
do $$ begin create type roster_state      as enum ('draft','published','locked'); exception when duplicate_object then null; end $$;
do $$ begin create type shift_attendance  as enum ('scheduled','checked_in','on_break','checked_out','no_show'); exception when duplicate_object then null; end $$;

create table if not exists workforce_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  user_id uuid,
  kind workforce_kind not null default 'paid_staff',
  full_name text not null,
  email text,
  phone text,
  role text,
  skills jsonb not null default '[]'::jsonb,
  venue_id uuid references venues(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists workforce_members_org_kind_idx on workforce_members (org_id, kind);
alter table workforce_members enable row level security;
create policy workforce_members_select on workforce_members for select to authenticated using (is_org_member(org_id) or user_id = auth.uid());
create policy workforce_members_admin  on workforce_members for all to authenticated using (has_org_role(org_id, array['owner','admin','controller'])) with check (has_org_role(org_id, array['owner','admin','controller']));

create table if not exists rosters (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  venue_id uuid references venues(id),
  name text not null,
  day_of date not null,
  state roster_state not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table rosters enable row level security;
create policy rosters_rw on rosters for all to authenticated using (is_org_member(org_id)) with check (is_org_member(org_id));

create table if not exists shifts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  roster_id uuid references rosters(id) on delete set null,
  workforce_member_id uuid references workforce_members(id),
  venue_id uuid references venues(id),
  zone_id uuid references venue_zones(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  role text,
  attendance shift_attendance not null default 'scheduled',
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  break_minutes int not null default 0,
  meal_credit boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists shifts_member_idx on shifts (workforce_member_id, starts_at);
create index if not exists shifts_venue_day_idx on shifts (venue_id, starts_at);
alter table shifts enable row level security;
create policy shifts_select on shifts for select to authenticated using (
  is_org_member(org_id)
  or exists (select 1 from workforce_members wm where wm.id = shifts.workforce_member_id and wm.user_id = auth.uid())
);
create policy shifts_admin on shifts for all to authenticated using (has_org_role(org_id, array['owner','admin','controller','collaborator'])) with check (has_org_role(org_id, array['owner','admin','controller','collaborator']));

create table if not exists workforce_deployments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  venue_id uuid not null references venues(id),
  zone_id uuid references venue_zones(id),
  shift_window tstzrange,
  planned_fte int not null default 0,
  actual_fte  int not null default 0,
  functional_area text,
  created_at timestamptz not null default now()
);
alter table workforce_deployments enable row level security;
create policy workforce_deployments_rw on workforce_deployments for all to authenticated using (is_org_member(org_id)) with check (is_org_member(org_id));

-- ═══ Safety extensions (reuses incidents substrate) ══════════════════════
create table if not exists major_incidents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  incident_id uuid references incidents(id) on delete set null,
  name text not null,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  ics_roles jsonb not null default '{}'::jsonb,
  timeline jsonb not null default '[]'::jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
alter table major_incidents enable row level security;
create policy major_incidents_rw on major_incidents for all to authenticated using (is_org_member(org_id)) with check (is_org_member(org_id));

create table if not exists safeguarding_reports (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  reporter_id uuid,
  subject_ref text,                  -- hashed reference, not identifying
  narrative text not null,
  evidence_paths jsonb not null default '[]'::jsonb,
  status text not null default 'open',
  assigned_to uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table safeguarding_reports enable row level security;
-- strict RLS: org admins + designated safeguarding lead only (via has_org_role 'owner','admin' gate, room for role extension)
create policy safeguarding_reports_select on safeguarding_reports for select to authenticated using (has_org_role(org_id, array['owner','admin']) or reporter_id = auth.uid());
create policy safeguarding_reports_insert on safeguarding_reports for insert to authenticated with check (is_org_member(org_id));
create policy safeguarding_reports_update on safeguarding_reports for update to authenticated using (has_org_role(org_id, array['owner','admin']));

create table if not exists medical_encounters (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  incident_id uuid references incidents(id),
  venue_id uuid references venues(id),
  patient_ref text,                  -- hashed ref, not PII
  triage text,                       -- 'green' | 'yellow' | 'red' | 'black'
  chief_complaint text,
  disposition text,                  -- 'treated_released' | 'transported' | 'refused' | 'deceased'
  clinician_id uuid,
  phi_encrypted jsonb,
  created_at timestamptz not null default now()
);
alter table medical_encounters enable row level security;
-- PHI: only clinical roles can read
create policy medical_encounters_select on medical_encounters for select to authenticated using (has_org_role(org_id, array['owner','admin','controller']));
create policy medical_encounters_write  on medical_encounters for all  to authenticated using (has_org_role(org_id, array['owner','admin','controller'])) with check (has_org_role(org_id, array['owner','admin','controller']));

create table if not exists environmental_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  venue_id uuid references venues(id),
  kind text not null,                -- heat | air | storm | cold | air_quality
  severity text not null,
  reading jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);
alter table environmental_events enable row level security;
create policy environmental_events_rw on environmental_events for all to authenticated using (is_org_member(org_id)) with check (is_org_member(org_id));

-- ═══ Crisis Comms (mass-notify) ══════════════════════════════════════════
create table if not exists crisis_alerts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  title text not null,
  body text not null,
  severity text not null default 'info',   -- info | warn | critical
  channels jsonb not null default '["push"]'::jsonb,
  audience jsonb not null default '{}'::jsonb, -- { roles: [], venues: [], personas: [] }
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now()
);
alter table crisis_alerts enable row level security;
create policy crisis_alerts_select on crisis_alerts for select to authenticated using (is_org_member(org_id));
create policy crisis_alerts_admin  on crisis_alerts for all to authenticated using (has_org_role(org_id, array['owner','admin','controller'])) with check (has_org_role(org_id, array['owner','admin','controller']));

create table if not exists crisis_alert_receipts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  alert_id uuid not null references crisis_alerts(id) on delete cascade,
  user_id uuid not null,
  delivered_at timestamptz,
  acknowledged_at timestamptz,
  channel text
);
create unique index if not exists crisis_alert_receipts_unique on crisis_alert_receipts (alert_id, user_id, channel);
alter table crisis_alert_receipts enable row level security;
create policy crisis_alert_receipts_select on crisis_alert_receipts for select to authenticated using (is_org_member(org_id) or user_id = auth.uid());
create policy crisis_alert_receipts_update on crisis_alert_receipts for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ═══ Participants / Delegations ══════════════════════════════════════════
create table if not exists delegations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  code text not null,
  name text not null,
  country text,
  attache_user_id uuid,
  contact_email text,
  contact_phone text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists delegations_org_code_idx on delegations (org_id, code);
alter table delegations enable row level security;
create policy delegations_select on delegations for select to authenticated using (is_org_member(org_id) or attache_user_id = auth.uid());
create policy delegations_admin  on delegations for all to authenticated using (has_org_role(org_id, array['owner','admin','controller'])) with check (has_org_role(org_id, array['owner','admin','controller']));

create table if not exists delegation_entries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  delegation_id uuid not null references delegations(id) on delete cascade,
  discipline text,
  event text,
  participant_name text not null,
  status text not null default 'submitted',
  created_at timestamptz not null default now()
);
alter table delegation_entries enable row level security;
create policy delegation_entries_rw on delegation_entries for all to authenticated using (is_org_member(org_id)) with check (is_org_member(org_id));

create table if not exists visa_cases (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  delegation_id uuid references delegations(id),
  person_name text not null,
  nationality text,
  passport_no text,
  status text not null default 'requested',
  letter_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table visa_cases enable row level security;
create policy visa_cases_rw on visa_cases for all to authenticated using (is_org_member(org_id)) with check (is_org_member(org_id));

-- ═══ Rate card (shared engine for delegation/media/uniforms/sport equip) ══
create table if not exists rate_card_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  catalog text not null default 'delegation', -- delegation | media | uniform | sport
  sku text not null,
  name text not null,
  description text,
  unit_price_cents int not null default 0,
  currency text not null default 'USD',
  metadata jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index if not exists rate_card_items_sku_idx on rate_card_items (org_id, catalog, sku);
alter table rate_card_items enable row level security;
create policy rate_card_items_select on rate_card_items for select to authenticated using (is_org_member(org_id));
create policy rate_card_items_admin  on rate_card_items for all to authenticated using (has_org_role(org_id, array['owner','admin','controller'])) with check (has_org_role(org_id, array['owner','admin','controller']));

create table if not exists rate_card_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  catalog text not null default 'delegation',
  delegation_id uuid references delegations(id),
  requester_id uuid,
  status text not null default 'draft',
  total_cents int not null default 0,
  currency text not null default 'USD',
  line_items jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table rate_card_orders enable row level security;
create policy rate_card_orders_rw on rate_card_orders for all to authenticated using (is_org_member(org_id) or requester_id = auth.uid()) with check (is_org_member(org_id) or requester_id = auth.uid());

-- ═══ Transport / Dispatch ════════════════════════════════════════════════
do $$ begin create type dispatch_fleet as enum ('t1','t2','t3','media','workforce','spectator'); exception when duplicate_object then null; end $$;

create table if not exists dispatch_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  fleet dispatch_fleet not null default 't1',
  vehicle_ref text,
  driver_id uuid,
  origin_venue_id uuid references venues(id),
  destination_venue_id uuid references venues(id),
  scheduled_depart timestamptz not null,
  scheduled_arrive timestamptz,
  actual_depart timestamptz,
  actual_arrive timestamptz,
  manifest jsonb not null default '[]'::jsonb,
  status text not null default 'scheduled',
  created_at timestamptz not null default now()
);
create index if not exists dispatch_runs_org_fleet_idx on dispatch_runs (org_id, fleet, scheduled_depart);
alter table dispatch_runs enable row level security;
create policy dispatch_runs_select on dispatch_runs for select to authenticated using (is_org_member(org_id) or driver_id = auth.uid());
create policy dispatch_runs_admin  on dispatch_runs for all to authenticated using (has_org_role(org_id, array['owner','admin','controller'])) with check (has_org_role(org_id, array['owner','admin','controller']));

create table if not exists ad_manifests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  kind text not null default 'arrival', -- arrival | departure
  flight_ref text,
  carrier text,
  scheduled_at timestamptz,
  actual_at timestamptz,
  party_size int not null default 1,
  delegation_id uuid references delegations(id),
  notes text,
  status text not null default 'scheduled',
  created_at timestamptz not null default now()
);
alter table ad_manifests enable row level security;
create policy ad_manifests_rw on ad_manifests for all to authenticated using (is_org_member(org_id)) with check (is_org_member(org_id));

-- ═══ Accommodation ═══════════════════════════════════════════════════════
create table if not exists accommodation_blocks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  name text not null,
  property text not null,
  city text,
  stakeholder_group text,    -- NOC | IF | IOC | media | workforce | vip
  rooms_reserved int not null default 0,
  rooms_confirmed int not null default 0,
  starts_on date,
  ends_on date,
  contract_path text,
  created_at timestamptz not null default now()
);
alter table accommodation_blocks enable row level security;
create policy accommodation_blocks_rw on accommodation_blocks for all to authenticated using (is_org_member(org_id)) with check (is_org_member(org_id));

-- ═══ Ticketing extensions ════════════════════════════════════════════════
create table if not exists ticket_types (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  event_id uuid,
  name text not null,
  channel text not null default 'public', -- public | noc | sponsor | hospitality
  price_cents int not null default 0,
  currency text not null default 'USD',
  allocation int not null default 0,
  sold int not null default 0,
  created_at timestamptz not null default now()
);
alter table ticket_types enable row level security;
create policy ticket_types_select on ticket_types for select to authenticated using (is_org_member(org_id));
create policy ticket_types_admin  on ticket_types for all to authenticated using (has_org_role(org_id, array['owner','admin','controller'])) with check (has_org_role(org_id, array['owner','admin','controller']));

-- ═══ Sponsor Entitlements ════════════════════════════════════════════════
create table if not exists sponsor_entitlements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  sponsor_client_id uuid,   -- FK soft ref clients(id) to avoid coupling
  title text not null,
  quantity int not null default 1,
  delivered int not null default 0,
  status text not null default 'contracted',
  due_by date,
  evidence_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table sponsor_entitlements enable row level security;
create policy sponsor_entitlements_select on sponsor_entitlements for select to authenticated using (is_org_member(org_id));
create policy sponsor_entitlements_admin  on sponsor_entitlements for all to authenticated using (has_org_role(org_id, array['owner','admin','controller'])) with check (has_org_role(org_id, array['owner','admin','controller']));

-- ═══ Legal & Privacy ═════════════════════════════════════════════════════
do $$ begin create type dsar_kind   as enum ('access','deletion','correction','portability','objection'); exception when duplicate_object then null; end $$;
do $$ begin create type dsar_status as enum ('received','verifying','in_progress','fulfilled','rejected'); exception when duplicate_object then null; end $$;

create table if not exists dsar_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  requester_user_id uuid,
  requester_email text not null,
  kind dsar_kind not null default 'access',
  status dsar_status not null default 'received',
  identity_verified boolean not null default false,
  due_by date,
  fulfilled_at timestamptz,
  payload_path text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table dsar_requests enable row level security;
create policy dsar_requests_select on dsar_requests for select to authenticated using (is_org_member(org_id) or requester_user_id = auth.uid());
create policy dsar_requests_insert on dsar_requests
  for insert to authenticated
  with check (
    is_org_member(org_id)
    or requester_user_id = auth.uid()
    or lower(requester_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
  );
create policy dsar_requests_admin  on dsar_requests for all to authenticated using (has_org_role(org_id, array['owner','admin','controller'])) with check (has_org_role(org_id, array['owner','admin','controller']));

create table if not exists consent_records (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  user_id uuid,
  purpose text not null,
  granted boolean not null default false,
  version text,
  granted_at timestamptz,
  revoked_at timestamptz
);
alter table consent_records enable row level security;
create policy consent_records_rw on consent_records for all to authenticated using (is_org_member(org_id) or user_id = auth.uid()) with check (is_org_member(org_id) or user_id = auth.uid());

create table if not exists trademarks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  mark text not null,
  jurisdiction text,
  registration_no text,
  registered_on date,
  expires_on date,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
alter table trademarks enable row level security;
create policy trademarks_rw on trademarks for all to authenticated using (is_org_member(org_id)) with check (has_org_role(org_id, array['owner','admin','controller']));

create table if not exists insurance_policies (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  carrier text not null,
  policy_no text not null,
  kind text not null,        -- property | liability | cyber | cancellation
  effective_on date,
  expires_on date,
  limits jsonb not null default '{}'::jsonb,
  document_path text,
  created_at timestamptz not null default now()
);
alter table insurance_policies enable row level security;
create policy insurance_policies_rw on insurance_policies for all to authenticated using (is_org_member(org_id)) with check (has_org_role(org_id, array['owner','admin','controller']));

-- ═══ Integrations (TOC, connectors) ══════════════════════════════════════
create table if not exists integration_connectors (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  slug text not null,
  name text not null,
  kind text not null,        -- flight_feed | sms_gateway | esg | lms | etc.
  enabled boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  secret_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists integration_connectors_slug_idx on integration_connectors (org_id, slug);
alter table integration_connectors enable row level security;
create policy integration_connectors_admin on integration_connectors for all to authenticated using (has_org_role(org_id, array['owner','admin'])) with check (has_org_role(org_id, array['owner','admin']));
create policy integration_connectors_read  on integration_connectors for select to authenticated using (is_org_member(org_id));

-- ═══ Sustainability ══════════════════════════════════════════════════════
create table if not exists sustainability_metrics (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  period_start date not null,
  period_end date not null,
  scope int not null default 1,         -- 1 | 2 | 3
  kg_co2e numeric not null default 0,
  source text,
  method text,
  created_at timestamptz not null default now()
);
alter table sustainability_metrics enable row level security;
create policy sustainability_metrics_rw on sustainability_metrics for all to authenticated using (is_org_member(org_id)) with check (is_org_member(org_id));

-- ═══ Knowledge Base ══════════════════════════════════════════════════════
create table if not exists kb_articles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  slug text not null,
  title text not null,
  body_markdown text not null,
  tags jsonb not null default '[]'::jsonb,
  author_id uuid,
  version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists kb_articles_slug_idx on kb_articles (org_id, slug);
alter table kb_articles enable row level security;
create policy kb_articles_select on kb_articles for select to authenticated using (is_org_member(org_id));
create policy kb_articles_write  on kb_articles for all to authenticated using (has_org_role(org_id, array['owner','admin','controller','collaborator'])) with check (has_org_role(org_id, array['owner','admin','controller','collaborator']));
