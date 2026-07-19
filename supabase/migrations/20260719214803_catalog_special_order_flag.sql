-- First-class provenance flag for field-minted special orders on the master
-- catalog, replacing the `SPECIAL-` code-prefix heuristic used by the COMPVSS
-- advance intake + the /studio/settings/catalog "Pending Approval" lens.
--
-- Provenance, not lifecycle: `is_special_order` records HOW a SKU entered the
-- catalog (a field crew requested it for an item not yet stocked) and stays
-- true after approval. Approval remains the existing `active` gate, so:
--   pending approval  =  is_special_order AND NOT active
-- (Not an LDP `*_state`/`*_phase` column — it's a boolean classification like
--  vendors.is_public_profile, not an operational lifecycle.)

alter table public.master_catalog_items
  add column if not exists is_special_order boolean not null default false;

comment on column public.master_catalog_items.is_special_order is
  'True when this SKU was minted by a field special-order request (COMPVSS advance intake) for an item not in the catalog. Pending approval = is_special_order AND NOT active; approving sets active=true and the flag stays as provenance.';

-- Backfill rows minted under the pre-column `SPECIAL-` code convention.
update public.master_catalog_items
   set is_special_order = true
 where is_special_order = false
   and code like 'SPECIAL-%';

-- Fast lens: pending special orders per org.
create index if not exists master_catalog_items_pending_special_order_idx
  on public.master_catalog_items (org_id)
  where is_special_order and not active and deleted_at is null;
