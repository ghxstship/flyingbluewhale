-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 031: Schema Extensions (Zero-Regression)
-- Additive-only column additions to existing tables
-- ═══════════════════════════════════════════════════════

-- ═══ catalog_item_inventory: location FK + reorder thresholds ═══
alter table catalog_item_inventory
  add column if not exists location_id uuid references locations(id) on delete set null,
  add column if not exists reorder_point int default 0,
  add column if not exists reorder_quantity int default 0,
  add column if not exists bin_location text,
  add column if not exists last_count_at timestamptz,
  add column if not exists last_count_by uuid references auth.users(id);

create index if not exists idx_inventory_location on catalog_item_inventory(location_id);

-- ═══ fulfillment_orders: shipment + location FKs ═══
alter table fulfillment_orders
  add column if not exists shipment_id uuid references shipments(id) on delete set null,
  add column if not exists origin_location_id uuid references locations(id) on delete set null,
  add column if not exists destination_location_id uuid references locations(id) on delete set null;

create index if not exists idx_fulfillment_shipment on fulfillment_orders(shipment_id);

-- ═══ catalog_item_allocations: asset instance + location FKs ═══
alter table catalog_item_allocations
  add column if not exists asset_instance_id uuid references asset_instances(id) on delete set null,
  add column if not exists location_id uuid references locations(id) on delete set null;

create index if not exists idx_allocations_asset on catalog_item_allocations(asset_instance_id);
create index if not exists idx_allocations_location on catalog_item_allocations(location_id);

-- ═══ Add 'fulfillment_order' and 'purchase_order' to approval_actions entity_type check ═══
-- Drop and recreate the check constraint to include new entity types
alter table approval_actions drop constraint if exists approval_actions_entity_type_check;
alter table approval_actions add constraint approval_actions_entity_type_check
  check (entity_type in ('deliverable', 'credential_order', 'allocation', 'fulfillment_order', 'purchase_order', 'logistics_schedule', 'lost_found'));

-- ═══ Low-stock alert trigger ═══
create or replace function check_inventory_reorder_point()
returns trigger as $$
begin
  if new.reorder_point > 0 and new.quantity_available <= new.reorder_point and
     (old.quantity_available is null or old.quantity_available > old.reorder_point) then
    -- Insert an audit log entry as a reorder alert
    insert into audit_log (entity_type, entity_id, action, metadata)
    values ('catalog_item_inventory', new.id, 'inventory.low_stock_alert',
      jsonb_build_object('item_id', new.item_id, 'quantity_available', new.quantity_available, 'reorder_point', new.reorder_point, 'reorder_quantity', new.reorder_quantity));
  end if;
  return new;
end;
$$ language plpgsql;

create trigger check_reorder_point
  after update of quantity_available on catalog_item_inventory
  for each row execute function check_inventory_reorder_point();
