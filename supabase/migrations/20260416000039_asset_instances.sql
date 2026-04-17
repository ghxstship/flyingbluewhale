-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 028: Asset Instances (Per-Unit Tracking)
-- Individual serial/barcode tracking, possession chain, condition log
-- ═══════════════════════════════════════════════════════

create type asset_status as enum ('available','allocated','checked_out','in_transit','maintenance','lost','retired');

create table asset_instances (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references advance_items(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  serial_number text,
  barcode text,
  rfid text,
  asset_tag text not null,
  status asset_status not null default 'available',
  condition text not null default 'good' check (condition in ('new','good','fair','damaged','defective')),
  location_id uuid references locations(id) on delete set null,
  current_holder_id uuid references auth.users(id) on delete set null,
  current_project_id uuid references projects(id) on delete set null,
  purchase_date date,
  purchase_price numeric(10,2),
  purchase_order_id uuid references purchase_orders(id) on delete set null,
  warranty_expires date,
  last_maintenance_at timestamptz,
  next_maintenance_at timestamptz,
  retirement_date date,
  retirement_reason text,
  notes text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index idx_asset_barcode on asset_instances(barcode) where barcode is not null;
create unique index idx_asset_serial on asset_instances(organization_id, serial_number) where serial_number is not null;
create unique index idx_asset_rfid on asset_instances(rfid) where rfid is not null;
create index idx_asset_item on asset_instances(item_id);
create index idx_asset_org on asset_instances(organization_id);
create index idx_asset_status on asset_instances(status);
create index idx_asset_location on asset_instances(location_id);
create index idx_asset_tag on asset_instances(asset_tag);
create index idx_asset_holder on asset_instances(current_holder_id);
create index idx_asset_project on asset_instances(current_project_id);
create index idx_asset_condition on asset_instances(condition);

-- Per-unit history (possession chain, condition changes, maintenance)
create table asset_events (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references asset_instances(id) on delete cascade,
  event_type text not null check (event_type in (
    'created','received','allocated','checked_out','returned',
    'transferred','condition_change','maintenance_start','maintenance_end',
    'lost','found','retired','unretired','note_added'
  )),
  project_id uuid references projects(id) on delete set null,
  from_location_id uuid references locations(id),
  to_location_id uuid references locations(id),
  from_holder_id uuid references auth.users(id),
  to_holder_id uuid references auth.users(id),
  allocation_id uuid references catalog_item_allocations(id) on delete set null,
  condition_before text,
  condition_after text,
  notes text,
  metadata jsonb not null default '{}',
  recorded_by uuid not null references auth.users(id),
  recorded_at timestamptz not null default now()
);

create index idx_asset_events_asset on asset_events(asset_id);
create index idx_asset_events_type on asset_events(event_type);
create index idx_asset_events_project on asset_events(project_id);
create index idx_asset_events_recorded on asset_events(recorded_at desc);

-- Auto-log asset events on status change
create or replace function log_asset_status_change()
returns trigger as $$
begin
  if old.status is distinct from new.status then
    insert into asset_events (asset_id, event_type, project_id, from_location_id, to_location_id, from_holder_id, to_holder_id, condition_before, condition_after, recorded_by)
    values (
      new.id,
      case new.status
        when 'allocated' then 'allocated'
        when 'checked_out' then 'checked_out'
        when 'available' then case old.status when 'checked_out' then 'returned' when 'maintenance' then 'maintenance_end' when 'lost' then 'found' when 'retired' then 'unretired' else 'returned' end
        when 'in_transit' then 'transferred'
        when 'maintenance' then 'maintenance_start'
        when 'lost' then 'lost'
        when 'retired' then 'retired'
        else 'note_added'
      end,
      new.current_project_id,
      old.location_id,
      new.location_id,
      old.current_holder_id,
      new.current_holder_id,
      old.condition,
      new.condition,
      coalesce(auth.uid(), new.current_holder_id, old.current_holder_id)
    );
  end if;

  -- Also log condition changes even without status change
  if old.condition is distinct from new.condition and old.status = new.status then
    insert into asset_events (asset_id, event_type, project_id, condition_before, condition_after, notes, recorded_by)
    values (new.id, 'condition_change', new.current_project_id, old.condition, new.condition, new.notes, coalesce(auth.uid(), new.current_holder_id));
  end if;

  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger auto_log_asset_event
  before update on asset_instances
  for each row execute function log_asset_status_change();

-- Audit trail integration
create or replace function audit_asset_change()
returns trigger as $$
begin
  if old.status is distinct from new.status then
    insert into audit_log (organization_id, project_id, entity_type, entity_id, action, actor_id, old_state, new_state)
    values (new.organization_id, new.current_project_id, 'asset_instance', new.id, 'asset.' || new.status,
      coalesce(auth.uid(), new.current_holder_id),
      jsonb_build_object('status', old.status::text, 'condition', old.condition),
      jsonb_build_object('status', new.status::text, 'condition', new.condition, 'asset_tag', new.asset_tag, 'location_id', new.location_id::text));
  end if;
  return new;
end;
$$ language plpgsql;

create trigger audit_asset_status
  after update on asset_instances
  for each row execute function audit_asset_change();

create trigger assets_updated_at
  before update on asset_instances
  for each row execute function update_updated_at();

-- RLS
alter table asset_instances enable row level security;
alter table asset_events enable row level security;

create policy "View org assets" on asset_instances for select
  using (exists(select 1 from organization_members om where om.organization_id = asset_instances.organization_id and om.user_id = auth.uid()));

create policy "Manage org assets" on asset_instances for all
  using (exists(select 1 from organization_members om where om.organization_id = asset_instances.organization_id and om.user_id = auth.uid() and om.role in ('developer','owner','admin','team_member')));

create policy "View asset events" on asset_events for select
  using (exists(select 1 from asset_instances ai join organization_members om on om.organization_id = ai.organization_id where ai.id = asset_id and om.user_id = auth.uid()));

create policy "Create asset events" on asset_events for insert
  with check (exists(select 1 from asset_instances ai join organization_members om on om.organization_id = ai.organization_id where ai.id = asset_id and om.user_id = auth.uid()));
