-- ============================================================================
-- M1  Data canonicalization — dirty-value fixes (casing collapse)
-- APPLIED 2026-07-18 (ledger version 20260718124749). No schema change; pure data.
-- Exactly reversible via the DOWN block below.
-- Source crosswalk: docs/schema/enum-normalization-2026-07-18.variant-map.csv
-- ============================================================================

-- ===== UP =====================================================================

-- budgets.category: 'production' (1 row) is a casing dup of 'Production'.
update public.budgets
   set category = 'Production'
 where id = '4f3fa44f-b088-4a55-9cd7-d1c3b444bab2'
   and category = 'production';

-- vendors.category: 'scenic' (1 row) lowercase against Title-Case peers.
update public.vendors
   set category = 'Scenic'
 where id = '969f0db3-d61e-4c9b-be93-56684bb4db2d'
   and category = 'scenic';

-- ===== DOWN (rollback) ========================================================
-- Restores the exact pre-image of the two affected rows (id-scoped, so
-- legitimately-'Production'/'Scenic' rows are untouched).
--
-- update public.budgets
--    set category = 'production'
--  where id = '4f3fa44f-b088-4a55-9cd7-d1c3b444bab2'
--    and category = 'Production';
--
-- update public.vendors
--    set category = 'scenic'
--  where id = '969f0db3-d61e-4c9b-be93-56684bb4db2d'
--    and category = 'Scenic';
