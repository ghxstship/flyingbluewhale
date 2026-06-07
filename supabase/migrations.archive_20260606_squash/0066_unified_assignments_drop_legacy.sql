-- Unified Assignment Domain — Step 6/7
-- Drop the legacy tables, columns, and enum values that the unified
-- model replaces. Per the "zero legacy references or backwards
-- compatibility" directive — no compat shims, no parallel-read views.
--
-- Dropped:
--   - public.tickets             (replaced by assignments + ticket_assignment_details)
--   - public.ticket_scans        (replaced by assignment_events)
--   - public.ticket_types        (replaced by master_catalog_items WHERE kind='ticket')
--   - public.asset_links         (replaced by assignment_scan_codes)
--   - public.ticket_status enum  (replaced by fulfillment_state)
--   - public.deliverables.assignee_id     (per-individual rows moved)
--   - public.deliverables.catalog_item_id (per-individual rows moved)
--   - 9 catalog values from deliverable_type enum
--     (credential_assignment, catering_assignment, radio_assignment,
--      tool_assignment, equipment_assignment, uniform_assignment,
--      travel_assignment, lodging_assignment, vehicle_assignment)
--
-- Retained:
--   - public.credentials         (crew certification/license metadata —
--                                 different concept from per-project
--                                 credential issuance)
--   - public.deliverables        (project documents only — riders, plots,
--                                 lists, plans, grids)

-- ============================================================
-- 1. Drop legacy tables (RLS policies + indexes cascade)
-- ============================================================

DROP TABLE IF EXISTS public.asset_links CASCADE;
DROP TABLE IF EXISTS public.ticket_scans CASCADE;
DROP TABLE IF EXISTS public.tickets CASCADE;
DROP TABLE IF EXISTS public.ticket_types CASCADE;

-- ============================================================
-- 2. Drop legacy enum
-- ============================================================

DROP TYPE IF EXISTS public.ticket_status;

-- ============================================================
-- 3. Drop deliverables columns (per-individual rows moved by 0063)
-- ============================================================
-- Sanity assertion — should be zero after 0063.
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.deliverables WHERE assignee_id IS NOT NULL;
  IF n > 0 THEN
    RAISE EXCEPTION 'Refusing to drop deliverables.assignee_id: % rows still per-individual. Re-run 0063 first.', n;
  END IF;
END $$;

DROP INDEX IF EXISTS public.idx_deliverables_assignee_id;
DROP INDEX IF EXISTS public.idx_deliverables_catalog_item_id;
ALTER TABLE public.deliverables DROP COLUMN IF EXISTS assignee_id;
ALTER TABLE public.deliverables DROP COLUMN IF EXISTS catalog_item_id;

-- ============================================================
-- 4. Recreate deliverable_type without the 9 catalog values
-- ============================================================
-- ALTER TYPE DROP VALUE is unsupported, so we recreate the type and
-- swap columns. The view v_xpms_atom_rollup doesn't reference the type
-- (only the fulfillment_state). RLS policies on deliverables don't
-- reference type. So no view/policy DROP needed here.

CREATE TYPE public.deliverable_type_new AS ENUM (
  'technical_rider','hospitality_rider','input_list','stage_plot','crew_list','guest_list',
  'equipment_pull_list','power_plan','rigging_plan','site_plan','build_schedule',
  'vendor_package','safety_compliance','comms_plan','signage_grid','custom'
);

ALTER TABLE public.deliverables
  ALTER COLUMN type TYPE public.deliverable_type_new USING type::text::public.deliverable_type_new;
ALTER TABLE public.deliverable_templates
  ALTER COLUMN type TYPE public.deliverable_type_new USING type::text::public.deliverable_type_new;

DROP TYPE public.deliverable_type;
ALTER TYPE public.deliverable_type_new RENAME TO deliverable_type;

COMMENT ON TYPE public.deliverable_type IS
  'Project-document kinds only — riders, plots, lists, plans, grids. Per-individual catalog assignments use master_catalog_items.kind via assignments.catalog_item_id.';

COMMENT ON TABLE public.deliverables IS
  'Project documents (riders, plots, equipment pull lists, signage grids, build schedules). Per-individual entitlements (tickets, credentials, lodging, travel, vehicles, uniforms, catering, radios, tools, equipment) live in public.assignments. Migration 0066 split the per-individual rows out.';
