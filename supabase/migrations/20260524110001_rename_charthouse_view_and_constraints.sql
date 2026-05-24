-- R26.1 continued — rename v_charthouse_sheet_acceptance view and all 44
-- constraints that still carry the charthouse_ prefix.

BEGIN;

-- ── View ────────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS public.v_charthouse_sheet_acceptance;

CREATE VIEW public.v_siteplan_sheet_acceptance AS
SELECT
  id AS sheet_id, org_id, atom_id, document_state,
  atom_id IS NOT NULL AS has_atom_id,
  sheet_type IS NOT NULL AS has_sheet_type,
  primary_class IS NOT NULL AS has_primary_class,
  tier_primary IS NOT NULL AS has_tier_primary,
  shell_type IS NOT NULL AND shell_dimensions IS NOT NULL AS has_shell,
  (SELECT count(*) FROM siteplan_zone_region z WHERE z.sheet_id = sp.id AND z.deleted_at IS NULL) > 0 AS has_region,
  (SELECT count(*) FROM siteplan_band b WHERE b.sheet_id = sp.id AND b.deleted_at IS NULL) > 0 AS has_band,
  (SELECT count(*) FROM siteplan_placement p WHERE p.sheet_id = sp.id AND p.deleted_at IS NULL) > 0 AS has_placement,
  (SELECT count(*) FROM siteplan_utility u WHERE u.sheet_id = sp.id AND u.deleted_at IS NULL) > 0 AS has_utility,
  (SELECT count(*) FROM siteplan_adjacency a WHERE a.sheet_id = sp.id AND a.deleted_at IS NULL) >= 4 AS has_all_four_edges,
  approved_at IS NOT NULL AS has_approval_signoff
FROM site_plans sp
WHERE deleted_at IS NULL;

-- ── Rename constraints (PKs + FKs + unique keys + check constraints) ────
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conname LIKE 'charthouse_%' AND connamespace = 'public'::regnamespace
  LOOP
    EXECUTE format('ALTER TABLE public.%I RENAME CONSTRAINT %I TO %I',
      (SELECT conrelid::regclass::text FROM pg_constraint WHERE conname = r.conname LIMIT 1),
      r.conname,
      replace(r.conname, 'charthouse_', 'siteplan_'));
  END LOOP;
END $$;

-- ── Rename indexes that still carry charthouse_ prefix ──────────────────
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT indexname FROM pg_indexes
    WHERE schemaname = 'public' AND indexname LIKE 'charthouse_%'
  LOOP
    EXECUTE format('ALTER INDEX public.%I RENAME TO %I',
      r.indexname,
      replace(r.indexname, 'charthouse_', 'siteplan_'));
  END LOOP;
END $$;

COMMIT;
