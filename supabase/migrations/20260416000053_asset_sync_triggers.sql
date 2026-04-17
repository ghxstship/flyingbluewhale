-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 053: Entity-Asset Sync Triggers
-- Automates 3NF state consistency between entity asset
-- links and their underlying UAC allocations.
-- ═══════════════════════════════════════════════════════

-- 1. Sync allocation state from asset link changes
create or replace function sync_asset_link_to_allocation()
returns trigger as $$
begin
  if new.link_type = 'returned' and old.link_type != 'returned' then
    -- If an asset link is marked returned, update the underlying allocation
    if new.allocation_id is not null then
      update catalog_item_allocations
      set state = 'returned'
      where id = new.allocation_id and state not in ('returned', 'maintenance');
    end if;
  elsif new.link_type = 'checked_out' and old.link_type != 'checked_out' then
    -- Mark allocation as on_site if a guest/crew checks it out
    if new.allocation_id is not null then
      update catalog_item_allocations
      set state = 'on_site'
      where id = new.allocation_id and state not in ('on_site', 'lost', 'stolen', 'destroyed');
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_sync_asset_link_to_allocation
  after update of link_type on entity_asset_links
  for each row execute function sync_asset_link_to_allocation();

-- 2. Revoke asset links when credential is revoked
create or replace function revoke_asset_links_on_credential_revoke()
returns trigger as $$
begin
  if new.status = 'revoked' and old.status != 'revoked' then
    -- Unlink all active asset links where this credential order is the source
    update entity_asset_links
    set unlinked_at = now(),
        unlinked_by = new.revoked_by,
        link_type = 'returned'
    where source_type = 'credential_order' 
      and source_id = new.id
      and unlinked_at is null;
      
      -- Note: Trigger trg_sync_asset_link_to_allocation will cascade this to allocations
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_revoke_asset_links_on_credential_revoke
  after update of status on credential_orders
  for each row execute function revoke_asset_links_on_credential_revoke();
