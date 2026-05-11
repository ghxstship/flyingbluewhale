-- Crew advancing = per-individual deliverables across the catalog
-- (credentials, catering, radios, tools, equipment, uniforms, travel,
-- lodging, vehicles, plus the existing rider/plan kinds). One lifecycle,
-- one table — advancing → fulfillment → tracking is just the
-- `deliverable_state` arc applied to per-person line items.
--
-- "Advances" in this project means production advancing only. The
-- finance/cash-advance concept lives on the `advances` table from the
-- 0001 snapshot — auto-scaffold debris, never queried from the
-- advancing surfaces.
--
-- This migration:
--   1. Adds `assignee_id` to deliverables so a row can be owned by an
--      individual (the existing column set is project-document oriented).
--   2. Extends `deliverable_type` with the per-individual catalog kinds.
--   3. Composite index on (org_id, assignee_id) to back the
--      /p/[slug]/crew/advances + /m/m advances + /console individual
--      views without table scans.

-- ============================================================
-- 1. assignee_id
-- ============================================================

ALTER TABLE "public"."deliverables"
    ADD COLUMN IF NOT EXISTS "assignee_id" uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_deliverables_assignee_id
    ON "public"."deliverables"(org_id, assignee_id) WHERE assignee_id IS NOT NULL AND deleted_at IS NULL;

COMMENT ON COLUMN "public"."deliverables"."assignee_id" IS
  'Per-individual assignment for catalog deliverables (credentials, catering, radios, tools, equipment, uniforms, travel, lodging, vehicles). NULL for project-document deliverables (riders, plans, lists) which scope to the project, not a person.';

-- ============================================================
-- 2. Catalog deliverable types
-- These reuse the existing deliverable_state lifecycle: briefed → draft
-- → submitted → in_review → approved → delivered.
-- ============================================================

DO $$ BEGIN ALTER TYPE "public"."deliverable_type" ADD VALUE IF NOT EXISTS 'credential_assignment'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "public"."deliverable_type" ADD VALUE IF NOT EXISTS 'catering_assignment'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "public"."deliverable_type" ADD VALUE IF NOT EXISTS 'radio_assignment'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "public"."deliverable_type" ADD VALUE IF NOT EXISTS 'tool_assignment'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "public"."deliverable_type" ADD VALUE IF NOT EXISTS 'equipment_assignment'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "public"."deliverable_type" ADD VALUE IF NOT EXISTS 'uniform_assignment'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "public"."deliverable_type" ADD VALUE IF NOT EXISTS 'travel_assignment'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "public"."deliverable_type" ADD VALUE IF NOT EXISTS 'lodging_assignment'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "public"."deliverable_type" ADD VALUE IF NOT EXISTS 'vehicle_assignment'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
