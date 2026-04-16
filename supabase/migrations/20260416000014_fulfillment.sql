-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 014: Fulfillment Pipeline
-- Pick/pack/ship + checkout/return + inventory sync
-- ═══════════════════════════════════════════════════════

-- Extend allocations with fulfillment tracking columns
alter table catalog_item_allocations
  add column if not exists pickup_at timestamptz,
  add column if not exists return_at timestamptz,
  add column if not exists return_condition text check (return_condition in ('good', 'damaged', 'lost')),
  add column if not exists return_notes text,
  add column if not exists checked_out_by uuid references auth.users(id),
  add column if not exists checked_in_by uuid references auth.users(id),
  add column if not exists barcode text;

alter type allocation_state add value if not exists 'checked_out' after 'on_site';

-- Updated transition trigger with checkout/return
create or replace function validate_allocation_transition()
returns trigger as $$
declare
  valid boolean;
begin
  if old.state = new.state then return new; end if;

  valid := case old.state
    when 'reserved' then new.state in ('confirmed', 'reserved')
    when 'confirmed' then new.state in ('in_transit', 'reserved')
    when 'in_transit' then new.state in ('on_site', 'confirmed')
    when 'on_site' then new.state in ('checked_out', 'returned', 'maintenance')
    when 'checked_out' then new.state in ('returned', 'on_site', 'maintenance')
    when 'returned' then new.state in ('reserved', 'maintenance')
    when 'maintenance' then new.state in ('returned', 'reserved')
    else false
  end;

  if not valid then
    raise exception 'Invalid allocation state transition: % -> %', old.state, new.state;
  end if;

  if new.state = 'checked_out' then new.pickup_at = coalesce(new.pickup_at, now()); end if;
  if new.state = 'returned' then new.return_at = coalesce(new.return_at, now()); end if;

  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Fulfillment orders
create table fulfillment_orders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  type text not null default 'delivery' check (type in ('delivery', 'return', 'transfer', 'internal')),
  status text not null default 'pending' check (status in ('pending', 'packing', 'packed', 'in_transit', 'delivered', 'completed', 'cancelled')),
  reference_number text,
  destination text,
  shipping_method text,
  shipping_details jsonb not null default '{}',
  scheduled_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  completed_at timestamptz,
  total_items int not null default 0,
  total_weight_kg numeric(10,2),
  notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_fulfillment_project on fulfillment_orders(project_id);
create index idx_fulfillment_status on fulfillment_orders(status);

-- Fulfillment order line items
create table fulfillment_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references fulfillment_orders(id) on delete cascade,
  allocation_id uuid not null references catalog_item_allocations(id) on delete cascade,
  item_id uuid not null references advance_items(id) on delete cascade,
  quantity int not null default 1,
  packed boolean not null default false,
  packed_at timestamptz,
  packed_by uuid references auth.users(id),
  received boolean not null default false,
  received_at timestamptz,
  received_by uuid references auth.users(id),
  condition_on_receive text check (condition_on_receive in ('good', 'damaged', 'missing')),
  notes text,
  created_at timestamptz not null default now()
);

create index idx_foi_order on fulfillment_order_items(order_id);
create index idx_foi_allocation on fulfillment_order_items(allocation_id);

-- Auto-calculate totals
create or replace function update_fulfillment_totals()
returns trigger as $$
begin
  update fulfillment_orders set
    total_items = (select coalesce(sum(quantity), 0) from fulfillment_order_items where order_id = coalesce(new.order_id, old.order_id)),
    updated_at = now()
  where id = coalesce(new.order_id, old.order_id);
  return coalesce(new, old);
end;
$$ language plpgsql;

create trigger fulfillment_items_totals
  after insert or update or delete on fulfillment_order_items
  for each row execute function update_fulfillment_totals();

-- Inventory auto-sync on allocation state change
create or replace function sync_inventory_on_allocation()
returns trigger as $$
begin
  if old.state = 'reserved' and new.state = 'confirmed' then
    update catalog_item_inventory set quantity_available = greatest(0, quantity_available - new.quantity), updated_at = now() where item_id = new.item_id;
  end if;
  if new.state = 'returned' and old.state in ('on_site', 'checked_out', 'maintenance') then
    if new.return_condition is null or new.return_condition = 'good' then
      update catalog_item_inventory set quantity_available = quantity_available + new.quantity, updated_at = now() where item_id = new.item_id;
    end if;
    if new.return_condition = 'lost' then
      update catalog_item_inventory set quantity_owned = greatest(0, quantity_owned - new.quantity), updated_at = now() where item_id = new.item_id;
    end if;
  end if;
  if old.state = 'confirmed' and new.state = 'reserved' then
    update catalog_item_inventory set quantity_available = quantity_available + new.quantity, updated_at = now() where item_id = new.item_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger inventory_sync_on_allocation
  after update of state on catalog_item_allocations
  for each row execute function sync_inventory_on_allocation();

-- Fulfillment audit trail
create or replace function audit_fulfillment_change()
returns trigger as $$
begin
  if old.status is distinct from new.status then
    insert into audit_log (project_id, entity_type, entity_id, action, actor_id, old_state, new_state)
    values (new.project_id, 'fulfillment_order', new.id, 'fulfillment.' || new.status, new.created_by, jsonb_build_object('status', old.status), jsonb_build_object('status', new.status, 'total_items', new.total_items));
  end if;
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger audit_fulfillment_status
  before update on fulfillment_orders
  for each row execute function audit_fulfillment_change();

-- RLS
alter table fulfillment_orders enable row level security;
alter table fulfillment_order_items enable row level security;

create policy "View fulfillment orders" on fulfillment_orders for select using (is_project_member(project_id));
create policy "Manage fulfillment orders" on fulfillment_orders for all using (is_internal_on_project(project_id));
create policy "View fulfillment items" on fulfillment_order_items for select using (exists(select 1 from fulfillment_orders fo where fo.id = order_id and is_project_member(fo.project_id)));
create policy "Manage fulfillment items" on fulfillment_order_items for all using (exists(select 1 from fulfillment_orders fo where fo.id = order_id and is_internal_on_project(fo.project_id)));
