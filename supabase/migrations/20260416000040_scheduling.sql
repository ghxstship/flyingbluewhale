-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 029: Logistics Scheduling
-- Pickups, deliveries, transfers, dock management, driver assignment
-- ═══════════════════════════════════════════════════════

create type schedule_type as enum ('pickup','delivery','transfer','vendor_return','will_call');
create type schedule_status as enum ('requested','scheduled','confirmed','in_progress','completed','cancelled','no_show');

create table logistics_schedules (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  type schedule_type not null,
  status schedule_status not null default 'requested',
  reference_number text not null,
  fulfillment_order_id uuid references fulfillment_orders(id) on delete set null,
  shipment_id uuid references shipments(id) on delete set null,

  -- What
  title text not null,
  description text,
  item_summary text,
  item_count int,

  -- Where
  origin_location_id uuid references locations(id) on delete set null,
  destination_location_id uuid references locations(id) on delete set null,
  dock_assignment text,
  gate_code text,

  -- When
  scheduled_window_start timestamptz not null,
  scheduled_window_end timestamptz not null,
  actual_start timestamptz,
  actual_end timestamptz,

  -- Who
  requested_by uuid not null references auth.users(id),
  assigned_to uuid references auth.users(id),
  driver_name text,
  driver_phone text,
  driver_company text,
  vehicle_description text,
  vehicle_plate text,

  -- Verification
  verified_by uuid references auth.users(id),
  verified_at timestamptz,
  signature_url text,
  pod_notes text,

  notes text,
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  metadata jsonb not null default '{}',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_schedule_project on logistics_schedules(project_id);
create index idx_schedule_type on logistics_schedules(type);
create index idx_schedule_status on logistics_schedules(status);
create index idx_schedule_ref on logistics_schedules(reference_number);
create index idx_schedule_window on logistics_schedules(scheduled_window_start, scheduled_window_end);
create index idx_schedule_assigned on logistics_schedules(assigned_to);
create index idx_schedule_fulfillment on logistics_schedules(fulfillment_order_id);
create index idx_schedule_shipment on logistics_schedules(shipment_id);
create index idx_schedule_priority on logistics_schedules(priority);

-- Schedule items (what's being picked up / delivered)
create table logistics_schedule_items (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references logistics_schedules(id) on delete cascade,
  item_id uuid references advance_items(id) on delete set null,
  asset_instance_id uuid references asset_instances(id) on delete set null,
  allocation_id uuid references catalog_item_allocations(id) on delete set null,
  description text not null,
  quantity int not null default 1,
  picked_up boolean not null default false,
  picked_up_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_schedule_items_schedule on logistics_schedule_items(schedule_id);
create index idx_schedule_items_asset on logistics_schedule_items(asset_instance_id);

-- Status transition validation
create or replace function validate_schedule_transition()
returns trigger as $$
declare valid boolean;
begin
  if old.status = new.status then return new; end if;

  valid := case old.status
    when 'requested' then new.status in ('scheduled', 'cancelled')
    when 'scheduled' then new.status in ('confirmed', 'cancelled', 'requested')
    when 'confirmed' then new.status in ('in_progress', 'cancelled', 'no_show')
    when 'in_progress' then new.status in ('completed', 'cancelled')
    when 'completed' then false
    when 'cancelled' then new.status in ('requested')
    when 'no_show' then new.status in ('requested', 'scheduled')
    else false
  end;

  if not valid then
    raise exception 'Invalid schedule transition: % -> %', old.status, new.status;
  end if;

  if new.status = 'in_progress' then new.actual_start = coalesce(new.actual_start, now()); end if;
  if new.status = 'completed' then new.actual_end = coalesce(new.actual_end, now()); end if;

  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger check_schedule_transition
  before update of status on logistics_schedules
  for each row execute function validate_schedule_transition();

-- Dock conflict detection
create or replace function check_dock_availability()
returns trigger as $$
declare conflicting_count int;
begin
  if new.dock_assignment is null then return new; end if;

  select count(*) into conflicting_count
  from logistics_schedules
  where project_id = new.project_id
    and dock_assignment = new.dock_assignment
    and status not in ('cancelled', 'completed', 'no_show')
    and id != new.id
    and tstzrange(scheduled_window_start, scheduled_window_end, '[]') &&
        tstzrange(new.scheduled_window_start, new.scheduled_window_end, '[]');

  if conflicting_count > 0 then
    raise exception 'Dock % is already reserved during this time window', new.dock_assignment;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger check_dock_conflict
  before insert or update on logistics_schedules
  for each row execute function check_dock_availability();

-- Audit trail
create or replace function audit_schedule_change()
returns trigger as $$
begin
  if old.status is distinct from new.status then
    insert into audit_log (project_id, entity_type, entity_id, action, actor_id, old_state, new_state)
    values (new.project_id, 'logistics_schedule', new.id, 'schedule.' || new.status, coalesce(new.assigned_to, new.created_by),
      jsonb_build_object('status', old.status::text),
      jsonb_build_object('status', new.status::text, 'type', new.type::text, 'title', new.title, 'priority', new.priority));
  end if;
  return new;
end;
$$ language plpgsql;

create trigger audit_schedule_status
  after update on logistics_schedules
  for each row execute function audit_schedule_change();

create trigger schedules_updated_at
  before update on logistics_schedules
  for each row execute function update_updated_at();

-- RLS
alter table logistics_schedules enable row level security;
alter table logistics_schedule_items enable row level security;

create policy "View schedules" on logistics_schedules for select using (is_project_member(project_id));
create policy "Manage schedules" on logistics_schedules for all using (is_internal_on_project(project_id));
create policy "View schedule items" on logistics_schedule_items for select using (exists(select 1 from logistics_schedules ls where ls.id = schedule_id and is_project_member(ls.project_id)));
create policy "Manage schedule items" on logistics_schedule_items for all using (exists(select 1 from logistics_schedules ls where ls.id = schedule_id and is_internal_on_project(ls.project_id)));
