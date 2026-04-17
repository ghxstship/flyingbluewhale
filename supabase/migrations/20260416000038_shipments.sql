-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 027: Shipments & Carrier Tracking
-- Inbound/outbound/inter-location shipment lifecycle
-- ═══════════════════════════════════════════════════════

create type shipment_direction as enum ('inbound','outbound','inter_location');
create type shipment_status as enum ('booked','label_created','picked_up','in_transit','out_for_delivery','delivered','exception','cancelled');

create table shipments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  fulfillment_order_id uuid references fulfillment_orders(id) on delete set null,
  po_id uuid references purchase_orders(id) on delete set null,
  direction shipment_direction not null,
  status shipment_status not null default 'booked',
  reference_number text not null,

  -- Carrier
  carrier_id uuid references vendors(id) on delete set null,
  carrier_name text,
  service_level text,
  tracking_number text,
  tracking_url text,
  bol_number text,
  pro_number text,

  -- Locations
  origin_location_id uuid references locations(id) on delete set null,
  destination_location_id uuid references locations(id) on delete set null,
  origin_address jsonb not null default '{}',
  destination_address jsonb not null default '{}',

  -- Schedule
  scheduled_pickup_at timestamptz,
  actual_pickup_at timestamptz,
  scheduled_delivery_at timestamptz,
  actual_delivery_at timestamptz,
  estimated_delivery_at timestamptz,

  -- Load details
  weight_kg numeric(10,2),
  piece_count int,
  pallet_count int,
  dimensions jsonb,
  freight_class text,
  special_instructions text,

  -- Cost
  cost numeric(10,2),
  insurance_value numeric(10,2),

  -- People
  created_by uuid not null references auth.users(id),
  signed_by text,
  signature_url text,

  notes text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_shipments_org on shipments(organization_id);
create index idx_shipments_project on shipments(project_id);
create index idx_shipments_fulfillment on shipments(fulfillment_order_id);
create index idx_shipments_po on shipments(po_id);
create index idx_shipments_status on shipments(status);
create index idx_shipments_tracking on shipments(tracking_number);
create index idx_shipments_ref on shipments(reference_number);
create index idx_shipments_carrier on shipments(carrier_id);

-- Shipment event log (tracking events, manual updates)
create table shipment_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references shipments(id) on delete cascade,
  status shipment_status not null,
  location text,
  city text,
  state text,
  description text,
  source text not null default 'manual' check (source in ('manual','carrier_api','webhook','system')),
  recorded_by uuid references auth.users(id),
  recorded_at timestamptz not null default now()
);

create index idx_shipment_events_shipment on shipment_events(shipment_id);
create index idx_shipment_events_recorded on shipment_events(recorded_at desc);

-- Shipment status transition
create or replace function validate_shipment_transition()
returns trigger as $$
declare valid boolean;
begin
  if old.status = new.status then return new; end if;

  valid := case old.status
    when 'booked' then new.status in ('label_created', 'picked_up', 'cancelled')
    when 'label_created' then new.status in ('picked_up', 'cancelled')
    when 'picked_up' then new.status in ('in_transit', 'exception')
    when 'in_transit' then new.status in ('out_for_delivery', 'delivered', 'exception')
    when 'out_for_delivery' then new.status in ('delivered', 'exception')
    when 'delivered' then false
    when 'exception' then new.status in ('in_transit', 'out_for_delivery', 'delivered', 'cancelled')
    when 'cancelled' then false
    else false
  end;

  if not valid then
    raise exception 'Invalid shipment transition: % -> %', old.status, new.status;
  end if;

  if new.status = 'picked_up' then new.actual_pickup_at = coalesce(new.actual_pickup_at, now()); end if;
  if new.status = 'delivered' then new.actual_delivery_at = coalesce(new.actual_delivery_at, now()); end if;

  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger check_shipment_transition
  before update of status on shipments
  for each row execute function validate_shipment_transition();

-- Auto-log shipment events on status change
create or replace function log_shipment_event_on_status()
returns trigger as $$
begin
  if old.status is distinct from new.status then
    insert into shipment_events (shipment_id, status, description, source, recorded_by)
    values (new.id, new.status, 'Status changed to ' || new.status, 'system', auth.uid());
  end if;
  return new;
end;
$$ language plpgsql;

create trigger auto_log_shipment_event
  after update of status on shipments
  for each row execute function log_shipment_event_on_status();

-- Audit trail
create or replace function audit_shipment_change()
returns trigger as $$
begin
  if old.status is distinct from new.status then
    insert into audit_log (organization_id, project_id, entity_type, entity_id, action, actor_id, old_state, new_state)
    values (new.organization_id, new.project_id, 'shipment', new.id, 'shipment.' || new.status, coalesce(auth.uid(), new.created_by),
      jsonb_build_object('status', old.status::text),
      jsonb_build_object('status', new.status::text, 'tracking_number', new.tracking_number, 'reference_number', new.reference_number));
  end if;
  return new;
end;
$$ language plpgsql;

create trigger audit_shipment_status
  after update on shipments
  for each row execute function audit_shipment_change();

create trigger shipments_updated_at
  before update on shipments
  for each row execute function update_updated_at();

-- RLS
alter table shipments enable row level security;
alter table shipment_events enable row level security;

create policy "View org shipments" on shipments for select
  using (
    exists(select 1 from organization_members om where om.organization_id = shipments.organization_id and om.user_id = auth.uid())
    or (project_id is not null and is_project_member(project_id))
  );

create policy "Manage shipments" on shipments for all
  using (
    exists(select 1 from organization_members om where om.organization_id = shipments.organization_id and om.user_id = auth.uid() and om.role in ('developer','owner','admin','team_member'))
    or (project_id is not null and is_internal_on_project(project_id))
  );

create policy "View shipment events" on shipment_events for select
  using (exists(select 1 from shipments s where s.id = shipment_id and (
    exists(select 1 from organization_members om where om.organization_id = s.organization_id and om.user_id = auth.uid())
    or (s.project_id is not null and is_project_member(s.project_id))
  )));

create policy "Create shipment events" on shipment_events for insert
  with check (exists(select 1 from shipments s where s.id = shipment_id and (
    exists(select 1 from organization_members om where om.organization_id = s.organization_id and om.user_id = auth.uid())
    or (s.project_id is not null and is_internal_on_project(s.project_id))
  )));
