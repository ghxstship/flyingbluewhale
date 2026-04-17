-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 025: Purchase Orders
-- Inbound procurement lifecycle with approval workflow
-- ═══════════════════════════════════════════════════════

create type po_status as enum ('draft','submitted','acknowledged','partially_received','received','closed','cancelled');

create table purchase_orders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  vendor_id uuid references vendors(id) on delete set null,
  po_number text not null,
  status po_status not null default 'draft',
  order_date date not null default current_date,
  expected_delivery date,
  shipping_address_id uuid references locations(id) on delete set null,
  currency text not null default 'USD',
  subtotal numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  shipping_cost numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  payment_terms text,
  notes text,
  internal_notes text,
  created_by uuid not null references auth.users(id),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  submitted_at timestamptz,
  cancelled_at timestamptz,
  cancelled_by uuid references auth.users(id),
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_po_project on purchase_orders(project_id);
create index idx_po_vendor on purchase_orders(vendor_id);
create index idx_po_status on purchase_orders(status);
create index idx_po_number on purchase_orders(po_number);

create table purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  po_id uuid not null references purchase_orders(id) on delete cascade,
  item_id uuid references advance_items(id) on delete set null,
  line_number int not null default 1,
  description text not null,
  sku text,
  quantity_ordered int not null,
  quantity_received int not null default 0,
  unit_cost numeric(10,2) not null default 0,
  line_total numeric(12,2) generated always as (quantity_ordered * unit_cost) stored,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_poi_po on purchase_order_items(po_id);
create index idx_poi_item on purchase_order_items(item_id);

-- Auto-calculate PO totals
create or replace function update_po_totals()
returns trigger as $$
begin
  update purchase_orders set
    subtotal = (select coalesce(sum(quantity_ordered * unit_cost), 0) from purchase_order_items where po_id = coalesce(new.po_id, old.po_id)),
    total = (select coalesce(sum(quantity_ordered * unit_cost), 0) from purchase_order_items where po_id = coalesce(new.po_id, old.po_id)) + coalesce((select tax from purchase_orders where id = coalesce(new.po_id, old.po_id)), 0) + coalesce((select shipping_cost from purchase_orders where id = coalesce(new.po_id, old.po_id)), 0),
    updated_at = now()
  where id = coalesce(new.po_id, old.po_id);
  return coalesce(new, old);
end;
$$ language plpgsql;

create trigger po_items_totals
  after insert or update or delete on purchase_order_items
  for each row execute function update_po_totals();

-- PO status transition validation
create or replace function validate_po_transition()
returns trigger as $$
declare valid boolean;
begin
  if old.status = new.status then return new; end if;

  valid := case old.status
    when 'draft' then new.status in ('submitted', 'cancelled')
    when 'submitted' then new.status in ('acknowledged', 'cancelled', 'draft')
    when 'acknowledged' then new.status in ('partially_received', 'received', 'cancelled')
    when 'partially_received' then new.status in ('received', 'cancelled')
    when 'received' then new.status in ('closed')
    when 'closed' then false
    when 'cancelled' then new.status in ('draft')
    else false
  end;

  if not valid then
    raise exception 'Invalid PO status transition: % -> %', old.status, new.status;
  end if;

  if new.status = 'submitted' then new.submitted_at = coalesce(new.submitted_at, now()); end if;
  if new.status = 'cancelled' then new.cancelled_at = coalesce(new.cancelled_at, now()); end if;

  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger check_po_transition
  before update of status on purchase_orders
  for each row execute function validate_po_transition();

-- Audit trail
create or replace function audit_po_change()
returns trigger as $$
begin
  if old.status is distinct from new.status then
    insert into audit_log (project_id, entity_type, entity_id, action, actor_id, old_state, new_state)
    values (new.project_id, 'purchase_order', new.id, 'purchase_order.' || new.status, coalesce(new.approved_by, new.created_by), jsonb_build_object('status', old.status::text), jsonb_build_object('status', new.status::text, 'total', new.total, 'po_number', new.po_number));
  end if;
  return new;
end;
$$ language plpgsql;

create trigger audit_po_status
  after update on purchase_orders
  for each row execute function audit_po_change();

create trigger po_updated_at
  before update on purchase_orders
  for each row execute function update_updated_at();

-- RLS
alter table purchase_orders enable row level security;
alter table purchase_order_items enable row level security;

create policy "View purchase orders" on purchase_orders for select using (is_project_member(project_id));
create policy "Manage purchase orders" on purchase_orders for all using (is_internal_on_project(project_id));
create policy "View PO items" on purchase_order_items for select using (exists(select 1 from purchase_orders po where po.id = po_id and is_project_member(po.project_id)));
create policy "Manage PO items" on purchase_order_items for all using (exists(select 1 from purchase_orders po where po.id = po_id and is_internal_on_project(po.project_id)));
