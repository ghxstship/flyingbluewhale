-- ═══════════════════════════════════════════════════════
-- RED SEA LION Migration 012: Operational Extensions
-- Closes GAP-005, GAP-006, GAP-010, GAP-011, GAP-012,
-- GAP-015, GAP-016, GAP-017, GAP-018, GAP-019, GAP-031,
-- GAP-035
-- ═══════════════════════════════════════════════════════

-- ===== 1. Qualification Gate Trigger (GAP-005) ===========
-- Blocks lifecycle advance to 'onboarding' unless all
-- required qualification checks are 'verified'.
create or replace function enforce_qualification_gate()
returns trigger as $$
declare
  unmet_count int;
begin
  -- Only enforce when transitioning TO onboarding
  if old.stage = 'discovery' and new.stage = 'onboarding' then
    select count(*) into unmet_count
    from qualification_requirements qr
    join project_members pm
      on pm.project_id = qr.project_id and pm.role = qr.role
    where qr.project_id = new.project_id
      and pm.user_id = new.user_id
      and qr.is_required = true
      and not exists(
        select 1 from qualification_checks qc
        where qc.project_id = new.project_id
          and qc.user_id = new.user_id
          and qc.check_type = qr.check_type
          and qc.status = 'verified'
          and (qc.expires_at is null or qc.expires_at > now())
      );

    if unmet_count > 0 then
      raise exception 'Cannot advance to onboarding: % required qualification(s) not verified', unmet_count;
    end if;
  end if;

  -- Also enforce from qualification to onboarding
  if old.stage = 'qualification' and new.stage = 'onboarding' then
    select count(*) into unmet_count
    from qualification_requirements qr
    join project_members pm
      on pm.project_id = qr.project_id and pm.role = qr.role
    where qr.project_id = new.project_id
      and pm.user_id = new.user_id
      and qr.is_required = true
      and not exists(
        select 1 from qualification_checks qc
        where qc.project_id = new.project_id
          and qc.user_id = new.user_id
          and qc.check_type = qr.check_type
          and qc.status = 'verified'
          and (qc.expires_at is null or qc.expires_at > now())
      );

    if unmet_count > 0 then
      raise exception 'Cannot advance to onboarding: % required qualification(s) not verified', unmet_count;
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger enforce_qualification_before_onboarding
  before update of stage on project_member_lifecycles
  for each row execute function enforce_qualification_gate();


-- ===== 2. Auto-Advance Lifecycle (GAP-006) ===============
-- When a user's profile is completed (has full_name set),
-- auto-advance from discovery to qualification.
create or replace function auto_advance_on_profile_complete()
returns trigger as $$
begin
  if new.full_name is not null and (old.full_name is null or old.full_name = '') then
    update project_member_lifecycles
    set stage = 'qualification',
        transition_notes = 'Auto-advanced: profile completed'
    where user_id = new.id
      and stage = 'discovery';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger auto_advance_lifecycle_on_profile
  after update of full_name on profiles
  for each row execute function auto_advance_on_profile_complete();


-- ===== 3. Shift Rules / Union Constraints (GAP-010) ======
create table shift_rules (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  union_affiliation text,
  
  -- Time constraints
  max_shift_hours numeric(4,1) not null default 12,
  min_rest_between_shifts_hours numeric(4,1) not null default 8,
  max_consecutive_days int not null default 6,
  
  -- Meal penalty
  meal_break_required_after_hours numeric(4,1) not null default 6,
  meal_break_duration_minutes int not null default 30,
  meal_penalty_rate numeric(10,2),
  
  -- Overtime
  overtime_after_hours numeric(4,1) not null default 8,
  double_time_after_hours numeric(4,1) not null default 12,
  weekly_overtime_after_hours numeric(5,1) not null default 40,
  
  -- Per diem
  per_diem_rate numeric(10,2),
  
  notes text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_shift_rules_project on shift_rules(project_id);
create index idx_shift_rules_union on shift_rules(union_affiliation);

alter table shift_rules enable row level security;

create policy "View shift rules" on shift_rules for select
  using (is_project_member(project_id));

create policy "Manage shift rules" on shift_rules for all
  using (is_internal_on_project(project_id));

create trigger shift_rules_updated_at
  before update on shift_rules
  for each row execute function update_updated_at();


-- ===== 4. Travel & Lodging (GAP-011) ====================
create type travel_type as enum (
  'flight', 'hotel', 'ground_transport', 'rental_car',
  'per_diem', 'buyout', 'shuttle', 'parking', 'other'
);

create type travel_status as enum (
  'requested', 'booked', 'confirmed', 'checked_in',
  'completed', 'cancelled', 'no_show'
);

create table travel_arrangements (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type travel_type not null,
  status travel_status not null default 'requested',
  
  -- Details
  title text not null,
  confirmation_number text,
  provider text,
  
  -- Dates
  starts_at timestamptz,
  ends_at timestamptz,
  
  -- Location
  origin text,
  destination text,
  
  -- Cost
  cost numeric(10,2),
  currency text not null default 'USD',
  is_reimbursable boolean not null default false,
  
  notes text,
  metadata jsonb not null default '{}',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_travel_project on travel_arrangements(project_id);
create index idx_travel_user on travel_arrangements(user_id);
create index idx_travel_type on travel_arrangements(type);
create index idx_travel_status on travel_arrangements(status);

alter table travel_arrangements enable row level security;

create policy "Users can view own travel" on travel_arrangements
  for select using (user_id = auth.uid());

create policy "Project members can view travel" on travel_arrangements
  for select using (is_project_member(project_id));

create policy "Internal can manage travel" on travel_arrangements
  for all using (is_internal_on_project(project_id));

create trigger travel_updated_at
  before update on travel_arrangements
  for each row execute function update_updated_at();


-- ===== 5. Rider Fulfillment Tracking (GAP-012) ==========
-- Bridge table linking rider deliverable items to catalog allocations
create table rider_fulfillment (
  id uuid primary key default gen_random_uuid(),
  deliverable_id uuid not null references deliverables(id) on delete cascade,
  item_key text not null, -- JSON path key within deliverable.data
  item_description text not null,
  
  -- Fulfillment binding
  allocation_id uuid references catalog_item_allocations(id) on delete set null,
  advance_item_id uuid references advance_items(id) on delete set null,
  
  -- Status
  status text not null default 'pending'
    check (status in ('pending', 'sourcing', 'allocated', 'fulfilled', 'substituted', 'declined')),
  substitute_notes text,
  
  fulfilled_by uuid references auth.users(id),
  fulfilled_at timestamptz,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_rider_deliverable on rider_fulfillment(deliverable_id);
create index idx_rider_allocation on rider_fulfillment(allocation_id);
create index idx_rider_status on rider_fulfillment(status);

alter table rider_fulfillment enable row level security;

create policy "View rider fulfillment" on rider_fulfillment
  for select using (exists(
    select 1 from deliverables d where d.id = deliverable_id and is_project_member(d.project_id)
  ));

create policy "Manage rider fulfillment" on rider_fulfillment
  for all using (exists(
    select 1 from deliverables d where d.id = deliverable_id and is_internal_on_project(d.project_id)
  ));

create trigger rider_fulfillment_updated_at
  before update on rider_fulfillment
  for each row execute function update_updated_at();


-- ===== 6. Asset Handoff Tracking (GAP-015) ===============
-- Extends credential_check_ins concept for asset deployment
create table deployment_handoffs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  asset_instance_id uuid references asset_instances(id) on delete set null,
  allocation_id uuid references catalog_item_allocations(id) on delete set null,
  
  -- Who
  handed_to uuid not null references auth.users(id),
  handed_by uuid not null references auth.users(id),
  
  -- What
  description text not null,
  quantity int not null default 1,
  condition_at_handoff text check (condition_at_handoff in ('new', 'good', 'fair', 'damaged')),
  
  -- When
  handed_at timestamptz not null default now(),
  returned_at timestamptz,
  returned_condition text check (returned_condition in ('good', 'fair', 'damaged', 'lost')),
  
  -- Documentation
  photo_document_id uuid references documents(id) on delete set null,
  signature_url text,
  notes text,
  
  created_at timestamptz not null default now()
);

create index idx_handoff_project on deployment_handoffs(project_id);
create index idx_handoff_asset on deployment_handoffs(asset_instance_id);
create index idx_handoff_user on deployment_handoffs(handed_to);

alter table deployment_handoffs enable row level security;

create policy "View deployment handoffs" on deployment_handoffs
  for select using (is_project_member(project_id) or handed_to = auth.uid());

create policy "Manage deployment handoffs" on deployment_handoffs
  for all using (is_internal_on_project(project_id));


-- ===== 7. Briefing Acknowledgment (GAP-016) =============
create table onsite_briefings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  content text,
  document_id uuid references documents(id) on delete set null,
  required_for_roles text[] not null default '{}',
  
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table briefing_acknowledgments (
  id uuid primary key default gen_random_uuid(),
  briefing_id uuid not null references onsite_briefings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  acknowledged_at timestamptz not null default now(),
  ip_address text,
  unique(briefing_id, user_id)
);

create index idx_briefings_project on onsite_briefings(project_id);
create index idx_acks_briefing on briefing_acknowledgments(briefing_id);
create index idx_acks_user on briefing_acknowledgments(user_id);

alter table onsite_briefings enable row level security;
alter table briefing_acknowledgments enable row level security;

create policy "View briefings" on onsite_briefings
  for select using (is_project_member(project_id));
create policy "Manage briefings" on onsite_briefings
  for all using (is_internal_on_project(project_id));
create policy "View own acknowledgments" on briefing_acknowledgments
  for select using (user_id = auth.uid());
create policy "Create acknowledgment" on briefing_acknowledgments
  for insert with check (user_id = auth.uid());
create policy "Internal view acknowledgments" on briefing_acknowledgments
  for select using (exists(
    select 1 from onsite_briefings ob where ob.id = briefing_id and is_internal_on_project(ob.project_id)
  ));


-- ===== 8. Incident Logging (GAP-017) ====================
create type incident_severity as enum ('low', 'medium', 'high', 'critical');
create type incident_status as enum ('open', 'investigating', 'contained', 'resolved', 'closed');

create table incidents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  description text,
  severity incident_severity not null default 'medium',
  status incident_status not null default 'open',
  
  -- Location
  location_id uuid references locations(id) on delete set null,
  location_description text,
  
  -- People
  reporter_id uuid not null references auth.users(id),
  assigned_to uuid references auth.users(id),
  
  -- Resolution
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id),
  resolution_notes text,
  
  -- Documentation
  related_entity_type text,
  related_entity_id uuid,
  
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_incidents_project on incidents(project_id);
create index idx_incidents_severity on incidents(severity);
create index idx_incidents_status on incidents(status);
create index idx_incidents_reporter on incidents(reporter_id);

alter table incidents enable row level security;

create policy "View incidents" on incidents
  for select using (is_project_member(project_id));
create policy "Report incidents" on incidents
  for insert with check (is_project_member(project_id));
create policy "Manage incidents" on incidents
  for all using (is_internal_on_project(project_id));

create trigger incidents_updated_at
  before update on incidents
  for each row execute function update_updated_at();

-- Audit trail
create or replace function audit_incident_change()
returns trigger as $$
begin
  if old.status is distinct from new.status then
    insert into audit_log (project_id, entity_type, entity_id, action, actor_id, old_state, new_state)
    values (new.project_id, 'incident', new.id, 'incident.' || new.status::text,
      coalesce(new.resolved_by, new.assigned_to, new.reporter_id),
      jsonb_build_object('status', old.status::text, 'severity', old.severity::text),
      jsonb_build_object('status', new.status::text, 'severity', new.severity::text));
  end if;
  return new;
end;
$$ language plpgsql;

create trigger audit_incident_status
  after update on incidents
  for each row execute function audit_incident_change();


-- ===== 9. Change Orders (GAP-018) =======================
create type change_order_type as enum ('scope', 'schedule', 'budget', 'personnel', 'technical', 'other');
create type change_order_status as enum ('draft', 'pending', 'approved', 'rejected', 'implemented', 'withdrawn');

create table change_orders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  type change_order_type not null,
  status change_order_status not null default 'draft',
  
  title text not null,
  description text not null,
  justification text,
  
  -- Impact
  impact_amount numeric(12,2),
  impact_schedule_days int,
  impact_description text,
  
  -- Approval
  requested_by uuid not null references auth.users(id),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  
  -- Related entities
  related_entity_type text,
  related_entity_id uuid,
  
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_co_project on change_orders(project_id);
create index idx_co_status on change_orders(status);
create index idx_co_type on change_orders(type);

alter table change_orders enable row level security;

create policy "View change orders" on change_orders
  for select using (is_project_member(project_id));
create policy "Request change orders" on change_orders
  for insert with check (is_project_member(project_id));
create policy "Manage change orders" on change_orders
  for all using (is_internal_on_project(project_id));

create trigger change_orders_updated_at
  before update on change_orders
  for each row execute function update_updated_at();


-- ===== 10. Damage Assessment (GAP-019) ==================
-- Extend allocations with damage documentation
alter table catalog_item_allocations
  add column if not exists damage_photo_id uuid references documents(id) on delete set null,
  add column if not exists damage_cost_estimate numeric(10,2),
  add column if not exists insurance_claim_filed boolean not null default false,
  add column if not exists damage_notes text;


-- ===== 11. Classification Codes (GAP-031) ===============
alter table advance_items
  add column if not exists unspsc_code text,
  add column if not exists nigp_code text,
  add column if not exists naics_code text;

create index if not exists idx_items_unspsc on advance_items(unspsc_code) where unspsc_code is not null;
create index if not exists idx_items_nigp on advance_items(nigp_code) where nigp_code is not null;


-- ===== 12. Lifecycle Transition History (GAP-035) ========
create table lifecycle_transition_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  from_stage role_lifecycle_stage not null,
  to_stage role_lifecycle_stage not null,
  transitioned_by uuid references auth.users(id),
  transition_notes text,
  metadata jsonb not null default '{}',
  transitioned_at timestamptz not null default now()
);

create index idx_ltl_project on lifecycle_transition_log(project_id);
create index idx_ltl_user on lifecycle_transition_log(user_id);
create index idx_ltl_stages on lifecycle_transition_log(from_stage, to_stage);
create index idx_ltl_at on lifecycle_transition_log(transitioned_at desc);

alter table lifecycle_transition_log enable row level security;

create policy "Users can view own transitions" on lifecycle_transition_log
  for select using (user_id = auth.uid());
create policy "Project members can view transitions" on lifecycle_transition_log
  for select using (is_project_member(project_id));
create policy "Internal can manage transitions" on lifecycle_transition_log
  for all using (is_internal_on_project(project_id));

-- Trigger to auto-log every lifecycle transition
create or replace function log_lifecycle_transition()
returns trigger as $$
begin
  if old.stage is distinct from new.stage then
    insert into lifecycle_transition_log (
      project_id, user_id, from_stage, to_stage,
      transitioned_by, transition_notes
    ) values (
      new.project_id, new.user_id, old.stage, new.stage,
      auth.uid(), new.transition_notes
    );
  end if;
  return new;
end;
$$ language plpgsql;

create trigger log_lifecycle_stage_transition
  after update of stage on project_member_lifecycles
  for each row execute function log_lifecycle_transition();
