-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 026: Receiving Records
-- Inbound receipt verification, variance tracking, inventory sync
-- ═══════════════════════════════════════════════════════

create type receiving_status as enum ('scheduled','in_progress','completed','disputed');

create table receiving_records (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  po_id uuid references purchase_orders(id) on delete set null,
  location_id uuid not null references locations(id),
  reference_number text not null,
  status receiving_status not null default 'scheduled',
  source text not null default 'purchase_order' check (source in ('purchase_order','amazon','vendor_delivery','walk_in','transfer','other')),
  vendor_id uuid references vendors(id) on delete set null,
  carrier_name text,
  tracking_number text,
  received_by uuid references auth.users(id),
  received_at timestamptz,
  inspected_by uuid references auth.users(id),
  inspected_at timestamptz,
  notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_receiving_project on receiving_records(project_id);
create index idx_receiving_po on receiving_records(po_id);
create index idx_receiving_status on receiving_records(status);
create index idx_receiving_location on receiving_records(location_id);
create index idx_receiving_ref on receiving_records(reference_number);

create table receiving_record_items (
  id uuid primary key default gen_random_uuid(),
  receiving_id uuid not null references receiving_records(id) on delete cascade,
  po_item_id uuid references purchase_order_items(id) on delete set null,
  item_id uuid references advance_items(id) on delete set null,
  description text not null,
  quantity_expected int not null default 0,
  quantity_received int not null default 0,
  quantity_damaged int not null default 0,
  quantity_missing int not null default 0,
  condition text not null default 'good' check (condition in ('new','good','damaged','defective')),
  notes text,
  inspected_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index idx_rri_receiving on receiving_record_items(receiving_id);
create index idx_rri_po_item on receiving_record_items(po_item_id);
create index idx_rri_item on receiving_record_items(item_id);

-- On receiving completion: sync inventory + update PO received quantities
create or replace function sync_inventory_on_receiving()
returns trigger as $$
begin
  if new.status = 'completed' and old.status != 'completed' then
    -- Update inventory for each received item
    update catalog_item_inventory ci set
      quantity_owned = ci.quantity_owned + rri.quantity_received,
      quantity_available = ci.quantity_available + rri.quantity_received,
      updated_at = now()
    from receiving_record_items rri
    where rri.receiving_id = new.id
      and rri.item_id is not null
      and ci.item_id = rri.item_id;

    -- Insert inventory rows for items that don't have one yet
    insert into catalog_item_inventory (item_id, quantity_owned, quantity_available)
    select rri.item_id, rri.quantity_received, rri.quantity_received
    from receiving_record_items rri
    where rri.receiving_id = new.id
      and rri.item_id is not null
      and not exists (select 1 from catalog_item_inventory ci where ci.item_id = rri.item_id)
      and rri.quantity_received > 0
    on conflict (item_id) do update set
      quantity_owned = catalog_item_inventory.quantity_owned + excluded.quantity_owned,
      quantity_available = catalog_item_inventory.quantity_available + excluded.quantity_available,
      updated_at = now();

    -- Update PO item received quantities
    update purchase_order_items poi set
      quantity_received = poi.quantity_received + rri.quantity_received
    from receiving_record_items rri
    where rri.receiving_id = new.id
      and rri.po_item_id is not null
      and poi.id = rri.po_item_id;

    -- PO status cascade handled by cascade_po_status_on_receiving trigger

    new.received_at = coalesce(new.received_at, now());
  end if;

  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger inventory_sync_on_receiving
  before update of status on receiving_records
  for each row execute function sync_inventory_on_receiving();

-- Simpler PO status cascade (works more reliably than the CTE approach above)
create or replace function cascade_po_status_on_receiving()
returns trigger as $$
declare
  total_ordered int;
  total_received int;
begin
  if new.status = 'completed' and old.status != 'completed' and new.po_id is not null then
    select coalesce(sum(quantity_ordered), 0), coalesce(sum(quantity_received), 0)
    into total_ordered, total_received
    from purchase_order_items where po_id = new.po_id;

    if total_received >= total_ordered and total_ordered > 0 then
      update purchase_orders set status = 'received', updated_at = now() where id = new.po_id and status not in ('received', 'closed', 'cancelled');
    elsif total_received > 0 then
      update purchase_orders set status = 'partially_received', updated_at = now() where id = new.po_id and status not in ('partially_received', 'received', 'closed', 'cancelled');
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger cascade_po_on_receiving
  after update of status on receiving_records
  for each row execute function cascade_po_status_on_receiving();

-- Audit trail
create or replace function audit_receiving_change()
returns trigger as $$
begin
  if old.status is distinct from new.status then
    insert into audit_log (project_id, entity_type, entity_id, action, actor_id, old_state, new_state)
    values (new.project_id, 'receiving_record', new.id, 'receiving.' || new.status, coalesce(new.received_by, new.created_by),
      jsonb_build_object('status', old.status::text),
      jsonb_build_object('status', new.status::text, 'reference_number', new.reference_number, 'source', new.source));
  end if;
  return new;
end;
$$ language plpgsql;

create trigger audit_receiving_status
  after update on receiving_records
  for each row execute function audit_receiving_change();

create trigger receiving_updated_at
  before update on receiving_records
  for each row execute function update_updated_at();

-- RLS
alter table receiving_records enable row level security;
alter table receiving_record_items enable row level security;

create policy "View receiving records" on receiving_records for select using (is_project_member(project_id));
create policy "Manage receiving records" on receiving_records for all using (is_internal_on_project(project_id));
create policy "View receiving items" on receiving_record_items for select using (exists(select 1 from receiving_records rr where rr.id = receiving_id and is_project_member(rr.project_id)));
create policy "Manage receiving items" on receiving_record_items for all using (exists(select 1 from receiving_records rr where rr.id = receiving_id and is_internal_on_project(rr.project_id)));
