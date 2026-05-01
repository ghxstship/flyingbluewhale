-- Venue lifecycle artefacts: design specs, build log, VOP sections, handover
-- and closeout items. Each table is org-scoped, RLS-bound, and references
-- venues(id) on delete cascade so a venue tear-down also clears the artefacts.
--
-- These are deliberately thin tables — the lifecycle UIs render them as
-- checklists / item lists. Photos and detailed evidence go to storage and
-- are referenced via the file_path column.

------------------------------------------------------------------
-- 1. venue_design_specs — overlay specs, revisions, BOM linkage
------------------------------------------------------------------
create table if not exists venue_design_specs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  venue_id uuid not null references venues(id) on delete cascade,
  title text not null,
  discipline text not null check (discipline in (
    'overlay','seating','signage','broadcast','lighting','rigging','power','it','flooring','perimeter','other'
  )),
  revision text not null default 'A',
  status text not null check (status in ('draft','in_review','approved','archived')) default 'draft',
  notes text,
  file_path text,
  bom_requisition_id uuid references requisitions(id) on delete set null,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_venue_design_specs_venue on venue_design_specs (venue_id);
alter table venue_design_specs enable row level security;
create policy venue_design_specs_select on venue_design_specs for select using (is_org_member(org_id));
create policy venue_design_specs_insert on venue_design_specs for insert with check (has_org_role(org_id, array['owner','admin','controller','collaborator']));
create policy venue_design_specs_update on venue_design_specs for update using (has_org_role(org_id, array['owner','admin','controller','collaborator']));
create policy venue_design_specs_delete on venue_design_specs for delete using (has_org_role(org_id, array['owner','admin']));

------------------------------------------------------------------
-- 2. venue_build_log — construction / fit-out daily entries
------------------------------------------------------------------
create table if not exists venue_build_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  venue_id uuid not null references venues(id) on delete cascade,
  log_date date not null,
  summary text not null,
  trades_onsite int default 0,
  blockers text,
  photos jsonb not null default '[]'::jsonb,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (org_id, venue_id, log_date)
);
create index if not exists idx_venue_build_log_venue_date on venue_build_log (venue_id, log_date desc);
alter table venue_build_log enable row level security;
create policy venue_build_log_select on venue_build_log for select using (is_org_member(org_id));
create policy venue_build_log_insert on venue_build_log for insert with check (has_org_role(org_id, array['owner','admin','controller','collaborator','crew']));
create policy venue_build_log_update on venue_build_log for update using (has_org_role(org_id, array['owner','admin','controller','collaborator','crew']));
create policy venue_build_log_delete on venue_build_log for delete using (has_org_role(org_id, array['owner','admin']));

------------------------------------------------------------------
-- 3. venue_vop_sections — Venue Operating Plan sections
------------------------------------------------------------------
create table if not exists venue_vop_sections (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  venue_id uuid not null references venues(id) on delete cascade,
  section_key text not null check (section_key in (
    'overview','organisation','schedule','arrivals_departures',
    'safety_security','medical','transport','catering',
    'accreditation','communications','sustainability','annexes'
  )),
  title text not null,
  body text,
  status text not null check (status in ('draft','in_review','approved','published')) default 'draft',
  approved_by uuid references users(id) on delete set null,
  approved_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (org_id, venue_id, section_key)
);
create index if not exists idx_venue_vop_venue on venue_vop_sections (venue_id);
alter table venue_vop_sections enable row level security;
create policy venue_vop_select on venue_vop_sections for select using (is_org_member(org_id));
create policy venue_vop_insert on venue_vop_sections for insert with check (has_org_role(org_id, array['owner','admin','controller','collaborator']));
create policy venue_vop_update on venue_vop_sections for update using (has_org_role(org_id, array['owner','admin','controller','collaborator']));
create policy venue_vop_delete on venue_vop_sections for delete using (has_org_role(org_id, array['owner','admin']));

------------------------------------------------------------------
-- 4. venue_handover_items — commissioning checklist
------------------------------------------------------------------
create table if not exists venue_handover_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  venue_id uuid not null references venues(id) on delete cascade,
  category text not null check (category in (
    'overlay','mep','it','signage','seating','broadcast','catering','medical','security','operations','other'
  )),
  description text not null,
  status text not null check (status in ('open','in_progress','blocked','passed','failed','waived')) default 'open',
  assignee_id uuid references users(id) on delete set null,
  due_at timestamptz,
  resolved_at timestamptz,
  notes text,
  file_path text,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_venue_handover_venue on venue_handover_items (venue_id, status);
alter table venue_handover_items enable row level security;
create policy venue_handover_select on venue_handover_items for select using (is_org_member(org_id));
create policy venue_handover_insert on venue_handover_items for insert with check (has_org_role(org_id, array['owner','admin','controller','collaborator','crew']));
create policy venue_handover_update on venue_handover_items for update using (has_org_role(org_id, array['owner','admin','controller','collaborator','crew']));
create policy venue_handover_delete on venue_handover_items for delete using (has_org_role(org_id, array['owner','admin']));

------------------------------------------------------------------
-- 5. venue_closeout_items — demob / reinstatement checklist
------------------------------------------------------------------
create table if not exists venue_closeout_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  venue_id uuid not null references venues(id) on delete cascade,
  category text not null check (category in (
    'demob','reinstatement','asset_return','damage','waste','documentation','financial','other'
  )),
  description text not null,
  status text not null check (status in ('open','in_progress','blocked','complete','waived')) default 'open',
  assignee_id uuid references users(id) on delete set null,
  due_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_venue_closeout_venue on venue_closeout_items (venue_id, status);
alter table venue_closeout_items enable row level security;
create policy venue_closeout_select on venue_closeout_items for select using (is_org_member(org_id));
create policy venue_closeout_insert on venue_closeout_items for insert with check (has_org_role(org_id, array['owner','admin','controller','collaborator','crew']));
create policy venue_closeout_update on venue_closeout_items for update using (has_org_role(org_id, array['owner','admin','controller','collaborator','crew']));
create policy venue_closeout_delete on venue_closeout_items for delete using (has_org_role(org_id, array['owner','admin']));
