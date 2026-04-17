-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 048: Atomic Production System
-- 6-Level Hierarchy: Project → Event → Zone → Activation → Component → Item
-- Integrated with Universal Advance Seed Catalog
-- ═══════════════════════════════════════════════════════

-- ═══ 1. Enums ═══════════════════════════════════════════

-- Unified lifecycle for all hierarchy levels (L1–L6)
create type production_level_status as enum (
  'draft', 'advancing', 'confirmed', 'locked', 'complete', 'archived'
);

-- Zone types (L3)
create type zone_type as enum (
  'stage', 'vip', 'ga', 'perimeter', 'foh', 'boh',
  'entrance', 'food_court', 'merch', 'medical',
  'production_compound', 'parking', 'custom'
);

-- Activation types (L4)
create type activation_type as enum (
  'performance', 'sampling', 'photo_op', 'installation',
  'service', 'retail', 'registration', 'lounge',
  'dining', 'bar', 'custom'
);

-- Component types (L5)
create type component_type as enum (
  'buildable', 'scenic', 'technical', 'service',
  'furniture', 'signage', 'infrastructure', 'custom'
);

-- Task status
create type task_status as enum (
  'pending', 'in_progress', 'completed', 'blocked', 'cancelled'
);

-- ═══ 2. Project Enhancements ════════════════════════════

alter table projects
  add column if not exists budget_overhead numeric(12,2) not null default 0,
  add column if not exists client_id uuid references organizations(id) on delete set null;

create index if not exists idx_projects_client on projects(client_id);

-- ═══ 3. Catalog Enhancements ════════════════════════════

alter table advance_category_groups
  add column if not exists color text;

-- ═══ 4. L2 — Events ═════════════════════════════════════

create table events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  status production_level_status not null default 'draft',
  start_date date,
  end_date date,
  load_in_date date,
  strike_date date,
  venue_id uuid references locations(id) on delete set null,
  budget_overhead numeric(12,2) not null default 0,
  sort_order int not null default 0,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique(project_id, slug)
);

create index idx_events_project on events(project_id);
create index idx_events_org on events(organization_id);
create index idx_events_status on events(status);
create index idx_events_venue on events(venue_id);
create index idx_events_dates on events(start_date, end_date);

-- ═══ 5. L3 — Zones ═════════════════════════════════════

create table zones (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  type zone_type not null default 'custom',
  status production_level_status not null default 'draft',
  location_id uuid references locations(id) on delete set null,
  capacity int,
  budget_overhead numeric(12,2) not null default 0,
  sort_order int not null default 0,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique(event_id, slug)
);

create index idx_zones_event on zones(event_id);
create index idx_zones_org on zones(organization_id);
create index idx_zones_status on zones(status);
create index idx_zones_location on zones(location_id);
create index idx_zones_type on zones(type);

-- ═══ 6. L4 — Activations ════════════════════════════════

create table activations (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references zones(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  type activation_type not null default 'custom',
  status production_level_status not null default 'draft',
  budget_overhead numeric(12,2) not null default 0,
  sort_order int not null default 0,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique(zone_id, slug)
);

create index idx_activations_zone on activations(zone_id);
create index idx_activations_org on activations(organization_id);
create index idx_activations_status on activations(status);
create index idx_activations_type on activations(type);

-- ═══ 7. L5 — Components ═════════════════════════════════

create table components (
  id uuid primary key default gen_random_uuid(),
  activation_id uuid not null references activations(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  type component_type not null default 'custom',
  status production_level_status not null default 'draft',
  budget_overhead numeric(12,2) not null default 0,
  sort_order int not null default 0,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique(activation_id, slug)
);

create index idx_components_activation on components(activation_id);
create index idx_components_org on components(organization_id);
create index idx_components_status on components(status);
create index idx_components_type on components(type);

-- ═══ 8. L6 Bridge — Component ↔ Catalog Items ══════════

create table component_items (
  id uuid primary key default gen_random_uuid(),
  component_id uuid not null references components(id) on delete cascade,
  item_id uuid not null references advance_items(id) on delete cascade,
  quantity int not null default 1 check (quantity > 0),
  unit_cost numeric(12,2),
  notes text,
  status production_level_status not null default 'draft',
  assigned_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique(component_id, item_id)
);

create index idx_component_items_component on component_items(component_id);
create index idx_component_items_item on component_items(item_id);
create index idx_component_items_status on component_items(status);

-- ═══ 9. Cart ↔ Hierarchy Bridge ═════════════════════════

-- Add component_id to existing allocations for hierarchy linking
alter table catalog_item_allocations
  add column if not exists component_id uuid references components(id) on delete set null;

create index if not exists idx_allocations_component on catalog_item_allocations(component_id);

-- ═══ 10. Hierarchy Tasks (Checklists) ═══════════════════

create table hierarchy_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  -- Polymorphic parent: exactly one must be non-null
  project_id uuid references projects(id) on delete cascade,
  event_id uuid references events(id) on delete cascade,
  zone_id uuid references zones(id) on delete cascade,
  activation_id uuid references activations(id) on delete cascade,
  component_id uuid references components(id) on delete cascade,
  -- Task fields
  title text not null,
  description text,
  status task_status not null default 'pending',
  priority int not null default 0,
  assigned_to uuid references auth.users(id),
  assigned_by uuid references auth.users(id),
  due_date timestamptz,
  completed_at timestamptz,
  completed_by uuid references auth.users(id),
  is_gate boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  -- Exactly one parent constraint
  constraint one_parent check (
    (case when project_id is not null then 1 else 0 end +
     case when event_id is not null then 1 else 0 end +
     case when zone_id is not null then 1 else 0 end +
     case when activation_id is not null then 1 else 0 end +
     case when component_id is not null then 1 else 0 end) = 1
  )
);

create index idx_htasks_org on hierarchy_tasks(organization_id);
create index idx_htasks_project on hierarchy_tasks(project_id);
create index idx_htasks_event on hierarchy_tasks(event_id);
create index idx_htasks_zone on hierarchy_tasks(zone_id);
create index idx_htasks_activation on hierarchy_tasks(activation_id);
create index idx_htasks_component on hierarchy_tasks(component_id);
create index idx_htasks_status on hierarchy_tasks(status);
create index idx_htasks_assigned on hierarchy_tasks(assigned_to);
create index idx_htasks_due on hierarchy_tasks(due_date);
create index idx_htasks_gate on hierarchy_tasks(is_gate) where is_gate = true;

-- ═══ 11. Acts ↔ Hierarchy Bridge ════════════════════════

-- Link existing acts to the new hierarchy via activation_id
alter table acts
  add column if not exists activation_id uuid references activations(id) on delete set null,
  add column if not exists event_id uuid references events(id) on delete set null;

create index if not exists idx_acts_activation on acts(activation_id);
create index if not exists idx_acts_event on acts(event_id);

-- ═══ 12. Updated-at Triggers ════════════════════════════

create trigger events_updated_at
  before update on events
  for each row execute function update_updated_at();

create trigger zones_updated_at
  before update on zones
  for each row execute function update_updated_at();

create trigger activations_updated_at
  before update on activations
  for each row execute function update_updated_at();

create trigger components_updated_at
  before update on components
  for each row execute function update_updated_at();

create trigger component_items_updated_at
  before update on component_items
  for each row execute function update_updated_at();

create trigger hierarchy_tasks_updated_at
  before update on hierarchy_tasks
  for each row execute function update_updated_at();

-- ═══ 13. Status Transition Validation ═══════════════════

-- Valid transitions: draft→advancing→confirmed→locked→complete→archived
-- Plus: any→archived, locked→confirmed (unlock)
create or replace function validate_hierarchy_status_transition()
returns trigger as $$
declare
  valid boolean;
  incomplete_gates int;
begin
  if old.status = new.status then
    return new;
  end if;

  -- Check valid transitions
  valid := case old.status
    when 'draft' then new.status in ('advancing', 'archived')
    when 'advancing' then new.status in ('confirmed', 'draft', 'archived')
    when 'confirmed' then new.status in ('locked', 'advancing', 'archived')
    when 'locked' then new.status in ('complete', 'confirmed', 'archived')
    when 'complete' then new.status in ('archived', 'locked')
    when 'archived' then new.status = 'draft'
    else false
  end;

  if not valid then
    raise exception 'Invalid hierarchy status transition: % → %', old.status, new.status;
  end if;

  -- Gate task enforcement: block advancing→confirmed if gate tasks are incomplete
  if old.status = 'advancing' and new.status = 'confirmed' then
    -- Determine which parent column to check based on table
    select count(*) into incomplete_gates
    from hierarchy_tasks ht
    where ht.is_gate = true
      and ht.status != 'completed'
      and ht.deleted_at is null
      and (
        (tg_table_name = 'projects' and ht.project_id = new.id) or
        (tg_table_name = 'events' and ht.event_id = new.id) or
        (tg_table_name = 'zones' and ht.zone_id = new.id) or
        (tg_table_name = 'activations' and ht.activation_id = new.id) or
        (tg_table_name = 'components' and ht.component_id = new.id)
      );

    if incomplete_gates > 0 then
      raise exception 'Cannot confirm %: % incomplete gate task(s)', tg_table_name, incomplete_gates;
    end if;
  end if;

  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply transition validation to each hierarchy level
create trigger check_event_status
  before update of status on events
  for each row execute function validate_hierarchy_status_transition();

create trigger check_zone_status
  before update of status on zones
  for each row execute function validate_hierarchy_status_transition();

create trigger check_activation_status
  before update of status on activations
  for each row execute function validate_hierarchy_status_transition();

create trigger check_component_status
  before update of status on components
  for each row execute function validate_hierarchy_status_transition();

-- ═══ 14. Budget Rollup Function ═════════════════════════

-- Computes total budget from L6→L1, returning a row per hierarchy level
create or replace function budget_rollup(p_project_id uuid)
returns table (
  level text,
  level_id uuid,
  level_name text,
  parent_id uuid,
  item_cost numeric,
  overhead numeric,
  total_cost numeric
) as $$
begin
  return query

  -- L5 Components: sum of their items + own overhead
  with component_costs as (
    select
      c.id,
      c.name,
      c.activation_id as parent_id,
      coalesce(sum(ci.unit_cost * ci.quantity), 0) as item_cost,
      c.budget_overhead as overhead
    from components c
    left join component_items ci on ci.component_id = c.id and ci.deleted_at is null
    join activations a on c.activation_id = a.id
    join zones z on a.zone_id = z.id
    join events e on z.event_id = e.id
    where e.project_id = p_project_id
      and c.deleted_at is null
    group by c.id, c.name, c.activation_id, c.budget_overhead
  ),
  -- L4 Activations: sum of components + own overhead
  activation_costs as (
    select
      a.id,
      a.name,
      a.zone_id as parent_id,
      coalesce(sum(cc.item_cost + cc.overhead), 0) as item_cost,
      a.budget_overhead as overhead
    from activations a
    left join component_costs cc on cc.parent_id = a.id
    join zones z on a.zone_id = z.id
    join events e on z.event_id = e.id
    where e.project_id = p_project_id
      and a.deleted_at is null
    group by a.id, a.name, a.zone_id, a.budget_overhead
  ),
  -- L3 Zones: sum of activations + own overhead
  zone_costs as (
    select
      z.id,
      z.name,
      z.event_id as parent_id,
      coalesce(sum(ac.item_cost + ac.overhead), 0) as item_cost,
      z.budget_overhead as overhead
    from zones z
    left join activation_costs ac on ac.parent_id = z.id
    join events e on z.event_id = e.id
    where e.project_id = p_project_id
      and z.deleted_at is null
    group by z.id, z.name, z.event_id, z.budget_overhead
  ),
  -- L2 Events: sum of zones + own overhead
  event_costs as (
    select
      e.id,
      e.name,
      e.project_id as parent_id,
      coalesce(sum(zc.item_cost + zc.overhead), 0) as item_cost,
      e.budget_overhead as overhead
    from events e
    left join zone_costs zc on zc.parent_id = e.id
    where e.project_id = p_project_id
      and e.deleted_at is null
    group by e.id, e.name, e.project_id, e.budget_overhead
  )

  -- Union all levels
  select 'component'::text, cc.id, cc.name, cc.parent_id, cc.item_cost, cc.overhead, cc.item_cost + cc.overhead from component_costs cc
  union all
  select 'activation'::text, ac.id, ac.name, ac.parent_id, ac.item_cost, ac.overhead, ac.item_cost + ac.overhead from activation_costs ac
  union all
  select 'zone'::text, zc.id, zc.name, zc.parent_id, zc.item_cost, zc.overhead, zc.item_cost + zc.overhead from zone_costs zc
  union all
  select 'event'::text, ec.id, ec.name, ec.parent_id, ec.item_cost, ec.overhead, ec.item_cost + ec.overhead from event_costs ec
  union all
  select 'project'::text, p.id, p.name, null::uuid,
    coalesce(sum(ec.item_cost + ec.overhead), 0),
    p.budget_overhead,
    coalesce(sum(ec.item_cost + ec.overhead), 0) + p.budget_overhead
  from projects p
  left join event_costs ec on ec.parent_id = p.id
  where p.id = p_project_id
  group by p.id, p.name, p.budget_overhead;

end;
$$ language plpgsql stable;

-- ═══ 15. Cross-Cutting Catalog View ═════════════════════

-- Flattened view: every component_item joined through the full hierarchy
-- back to the catalog taxonomy. Enables WHERE-clause filtering on any
-- catalog dimension (group, category, subcategory) at any hierarchy level.
create or replace view hierarchy_item_catalog_view as
select
  -- Hierarchy path
  p.id as project_id,
  p.name as project_name,
  e.id as event_id,
  e.name as event_name,
  z.id as zone_id,
  z.name as zone_name,
  z.type as zone_type,
  a.id as activation_id,
  a.name as activation_name,
  a.type as activation_type,
  c.id as component_id,
  c.name as component_name,
  c.type as component_type,
  -- Item assignment
  ci.id as component_item_id,
  ci.quantity,
  ci.unit_cost,
  ci.quantity * coalesce(ci.unit_cost, 0) as line_total,
  ci.status as item_status,
  -- Catalog taxonomy
  ai.id as catalog_item_id,
  ai.name as item_name,
  ai.slug as item_slug,
  ai.manufacturer,
  ai.model,
  ai.unit,
  asub.id as subcategory_id,
  asub.name as subcategory_name,
  asub.slug as subcategory_slug,
  ac.id as category_id,
  ac.name as category_name,
  ac.slug as category_slug,
  acg.id as group_id,
  acg.name as group_name,
  acg.slug as group_slug,
  acg.color as group_color,
  -- Organization / tenant
  p.organization_id
from component_items ci
join components c on ci.component_id = c.id and c.deleted_at is null
join activations a on c.activation_id = a.id and a.deleted_at is null
join zones z on a.zone_id = z.id and z.deleted_at is null
join events e on z.event_id = e.id and e.deleted_at is null
join projects p on e.project_id = p.id
join advance_items ai on ci.item_id = ai.id
join advance_subcategories asub on ai.subcategory_id = asub.id
join advance_categories ac on asub.category_id = ac.id
join advance_category_groups acg on ac.group_id = acg.id
where ci.deleted_at is null;

-- ═══ 16. Audit Trail ════════════════════════════════════

-- Expand approval_actions entity_type to include hierarchy levels
alter table approval_actions drop constraint if exists approval_actions_entity_type_check;
alter table approval_actions add constraint approval_actions_entity_type_check
  check (entity_type in (
    'deliverable', 'credential_order', 'allocation', 'fulfillment_order',
    'purchase_order', 'logistics_schedule', 'lost_found',
    'event', 'zone', 'activation', 'component', 'component_item', 'hierarchy_task'
  ));

-- Generic hierarchy audit trigger
create or replace function audit_hierarchy_status_change()
returns trigger as $$
declare
  v_project_id uuid;
  v_org_id uuid;
begin
  if old.status is distinct from new.status then
    -- Resolve project_id + org_id based on table
    case tg_table_name
      when 'events' then
        v_project_id := new.project_id;
        v_org_id := new.organization_id;
      when 'zones' then
        select e.project_id, e.organization_id into v_project_id, v_org_id
        from events e where e.id = new.event_id;
      when 'activations' then
        select e.project_id, e.organization_id into v_project_id, v_org_id
        from zones z join events e on z.event_id = e.id where z.id = new.zone_id;
      when 'components' then
        select e.project_id, e.organization_id into v_project_id, v_org_id
        from activations a join zones z on a.zone_id = z.id join events e on z.event_id = e.id
        where a.id = new.activation_id;
    end case;

    insert into audit_log (
      project_id, organization_id, entity_type, entity_id,
      action, actor_id, old_state, new_state
    ) values (
      v_project_id, v_org_id, tg_table_name, new.id,
      tg_table_name || '.status_changed', auth.uid(),
      jsonb_build_object('status', old.status::text),
      jsonb_build_object('status', new.status::text)
    );
  end if;
  return new;
end;
$$ language plpgsql;

create trigger audit_event_status
  after update of status on events
  for each row execute function audit_hierarchy_status_change();

create trigger audit_zone_status
  after update of status on zones
  for each row execute function audit_hierarchy_status_change();

create trigger audit_activation_status
  after update of status on activations
  for each row execute function audit_hierarchy_status_change();

create trigger audit_component_status
  after update of status on components
  for each row execute function audit_hierarchy_status_change();

-- ═══ 17. Row-Level Security ═════════════════════════════

alter table events enable row level security;
alter table zones enable row level security;
alter table activations enable row level security;
alter table components enable row level security;
alter table component_items enable row level security;
alter table hierarchy_tasks enable row level security;

-- ─── Helper: get project_id from any hierarchy entity ───

create or replace function event_project_id(eid uuid)
returns uuid as $$
  select project_id from events where id = eid;
$$ language sql security definer stable;

create or replace function zone_project_id(zid uuid)
returns uuid as $$
  select e.project_id from zones z join events e on z.event_id = e.id where z.id = zid;
$$ language sql security definer stable;

create or replace function activation_project_id(aid uuid)
returns uuid as $$
  select e.project_id
  from activations a join zones z on a.zone_id = z.id join events e on z.event_id = e.id
  where a.id = aid;
$$ language sql security definer stable;

create or replace function component_project_id(cid uuid)
returns uuid as $$
  select e.project_id
  from components c
  join activations a on c.activation_id = a.id
  join zones z on a.zone_id = z.id
  join events e on z.event_id = e.id
  where c.id = cid;
$$ language sql security definer stable;

-- ─── Events RLS ─────────────────────────────────────────

create policy "Project members can view events"
  on events for select using (is_project_member(project_id));

create policy "Internal can manage events"
  on events for all using (is_internal_on_project(project_id));

-- ─── Zones RLS ──────────────────────────────────────────

create policy "Project members can view zones"
  on zones for select using (is_project_member(event_project_id(event_id)));

create policy "Internal can manage zones"
  on zones for all using (is_internal_on_project(event_project_id(event_id)));

-- ─── Activations RLS ────────────────────────────────────

create policy "Project members can view activations"
  on activations for select using (is_project_member(zone_project_id(zone_id)));

create policy "Internal can manage activations"
  on activations for all using (is_internal_on_project(zone_project_id(zone_id)));

-- ─── Components RLS ─────────────────────────────────────

create policy "Project members can view components"
  on components for select using (is_project_member(activation_project_id(activation_id)));

create policy "Internal can manage components"
  on components for all using (is_internal_on_project(activation_project_id(activation_id)));

-- ─── Component Items RLS ────────────────────────────────

create policy "Project members can view component items"
  on component_items for select using (is_project_member(component_project_id(component_id)));

create policy "Internal can manage component items"
  on component_items for all using (is_internal_on_project(component_project_id(component_id)));

-- ─── Hierarchy Tasks RLS ────────────────────────────────

create policy "Project members can view hierarchy tasks"
  on hierarchy_tasks for select using (
    (project_id is not null and is_project_member(project_id))
    or (event_id is not null and is_project_member(event_project_id(event_id)))
    or (zone_id is not null and is_project_member(zone_project_id(zone_id)))
    or (activation_id is not null and is_project_member(activation_project_id(activation_id)))
    or (component_id is not null and is_project_member(component_project_id(component_id)))
  );

create policy "Internal can manage hierarchy tasks"
  on hierarchy_tasks for all using (
    (project_id is not null and is_internal_on_project(project_id))
    or (event_id is not null and is_internal_on_project(event_project_id(event_id)))
    or (zone_id is not null and is_internal_on_project(zone_project_id(zone_id)))
    or (activation_id is not null and is_internal_on_project(activation_project_id(activation_id)))
    or (component_id is not null and is_internal_on_project(component_project_id(component_id)))
  );
