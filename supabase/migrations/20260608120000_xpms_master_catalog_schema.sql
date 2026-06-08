-- XPMS Master Catalog — schema + cleanup (migration 1 of 2)
-- Adds XPMS classification axes to master_catalog_items, extends catalog_kind
-- with 'labor', and soft-deletes the duplicated external_example Casa rows.

ALTER TYPE public.catalog_kind ADD VALUE IF NOT EXISTS 'labor';

ALTER TABLE public.master_catalog_items
  ADD COLUMN IF NOT EXISTS urid            text,
  ADD COLUMN IF NOT EXISTS xpms_department text,
  ADD COLUMN IF NOT EXISTS discipline      text,
  ADD COLUMN IF NOT EXISTS default_tier    text,
  ADD COLUMN IF NOT EXISTS default_phase   text,
  ADD COLUMN IF NOT EXISTS xyz             text;

COMMENT ON COLUMN public.master_catalog_items.urid IS
  'Canonical XPMS URID DEPT.TEAM.SECTION (maps to public.xpms_registry).';

CREATE INDEX IF NOT EXISTS idx_master_catalog_items_urid
  ON public.master_catalog_items (urid) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_master_catalog_items_department
  ON public.master_catalog_items (xpms_department) WHERE deleted_at IS NULL;

-- Purge duplicated demo seed rows (reversible soft-delete).
UPDATE public.master_catalog_items
   SET deleted_at = now(), active = false
 WHERE org_id = '68672cc3-0667-4234-ad77-49325e173175' AND scope = 'external_example' AND deleted_at IS NULL;
