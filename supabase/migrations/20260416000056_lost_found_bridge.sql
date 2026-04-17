-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 056: Lost & Found Entity Custody
-- Transfers checked out assets directly into the L&F
-- report catalog if they are marked as lost by a crew.
-- ═══════════════════════════════════════════════════════

-- Add 'lost' to entity_asset_links link_type check constraint
alter table entity_asset_links drop constraint if exists entity_asset_links_link_type_check;
alter table entity_asset_links add constraint entity_asset_links_link_type_check
  check (link_type in ('entitlement', 'assigned', 'checked_out', 'returned', 'lost'));

create or replace function transfer_lost_asset_to_lost_found()
returns trigger as $$
declare
  v_ref_number text;
begin
  if new.link_type = 'lost' and old.link_type != 'lost' then
    -- Generate reference number: LF-ASSET-{8chars}
    v_ref_number := 'LF-ASSET-' || upper(substr(gen_random_uuid()::text, 1, 8));
    
    insert into lost_found_reports (
      project_id,
      type,
      status,
      reference_number,
      category,
      item_description,
      asset_instance_id,
      allocation_id,
      created_by
    ) values (
      new.project_id,
      'lost',
      'reported',
      v_ref_number,
      'equipment',
      'Asset reported lost via Entity Asset Link ' || new.id,
      new.asset_instance_id,
      new.allocation_id,
      coalesce(new.unlinked_by, new.linked_by, new.project_id) -- Fallback to project_id generic system id if needed
    );
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_transfer_lost_asset
  after update of link_type on entity_asset_links
  for each row execute function transfer_lost_asset_to_lost_found();
