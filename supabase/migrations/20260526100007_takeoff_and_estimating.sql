-- Round 42 — Quantity takeoff + estimating
--
-- Per construction-pm-parity Wave 2.3 + 2.4 (gaps G-008, G-009).
-- Without takeoff, we have no precon story for commercial work.
-- Without an estimating engine, takeoff is decorative. Two-layer schema:
--   - takeoffs / takeoff_items  → measurement geometry pinned to drawings
--   - cost_databases / cost_database_items  → unit cost library (RSMeans or
--     org-custom). Items reference cost codes for budget rollup.
--   - estimates / estimate_lines → join takeoff quantities to cost-database
--     unit costs, with markup and waste-factor rules. Exports to budgets +
--     proposal SOV.

BEGIN;

-- =============================================================================
-- 1. ENUMS
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE public.takeoff_geometry_kind AS ENUM (
    'point',        -- count (one per click)
    'polyline',     -- linear feet
    'polygon',      -- area (sf, sy, m²)
    'volume',       -- 3D volume — height × area
    'callout'       -- annotated marker; quantity entered manually
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.estimate_state AS ENUM (
    'draft',
    'in_review',
    'submitted',
    'won',
    'lost',
    'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- 2. cost_databases — unit-cost library (RSMeans-style or org-custom)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.cost_databases (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  name            text NOT NULL,
  source          text NOT NULL DEFAULT 'org_custom'
                    CHECK (source IN ('rs_means','org_custom','partner_import')),
  version         text,
  region_factor   numeric(6,4) NOT NULL DEFAULT 1.0000,
  is_master_library boolean NOT NULL DEFAULT false,
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  UNIQUE (org_id, name, version)
);

CREATE INDEX IF NOT EXISTS cost_databases_org_idx
  ON public.cost_databases (org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS cost_databases_master_idx
  ON public.cost_databases (is_master_library) WHERE is_master_library = true;
CREATE INDEX IF NOT EXISTS cost_databases_created_by_idx ON public.cost_databases (created_by);

COMMENT ON TABLE public.cost_databases IS
  'Org-scoped library of unit-cost items. Multiple versions support seasonal/regional updates; region_factor multiplies all item costs at view time.';

-- =============================================================================
-- 3. cost_database_items — the unit-cost rows
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.cost_database_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  cost_database_id uuid NOT NULL REFERENCES public.cost_databases(id) ON DELETE CASCADE,
  cost_code_id    uuid REFERENCES public.cost_codes(id) ON DELETE SET NULL,
  -- e.g. "03 30 53.40 0050" (CSI/RSMeans line number)
  item_code       text NOT NULL,
  description     text NOT NULL,
  unit            text NOT NULL,             -- 'ea', 'lf', 'sf', 'sy', 'cy', 'lb', 'ton', 'hr', ...
  material_cost   numeric(14,4) NOT NULL DEFAULT 0,
  labor_cost      numeric(14,4) NOT NULL DEFAULT 0,
  equipment_cost  numeric(14,4) NOT NULL DEFAULT 0,
  sub_cost        numeric(14,4) NOT NULL DEFAULT 0,
  total_cost      numeric(14,4) NOT NULL DEFAULT 0,
  productivity_per_day numeric(12,4),
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cost_database_id, item_code)
);

CREATE INDEX IF NOT EXISTS cost_database_items_db_idx ON public.cost_database_items (cost_database_id);
CREATE INDEX IF NOT EXISTS cost_database_items_org_idx ON public.cost_database_items (org_id);
CREATE INDEX IF NOT EXISTS cost_database_items_cost_code_idx
  ON public.cost_database_items (cost_code_id) WHERE cost_code_id IS NOT NULL;

COMMENT ON TABLE public.cost_database_items IS
  'Unit-cost rows. total_cost = material + labor + equipment + sub (stored, not derived, so partial updates do not require recompute).';

-- =============================================================================
-- 4. takeoffs — measurement headers pinned to a drawing sheet
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.takeoffs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  project_id      uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  -- Optional — for "freehand" takeoffs without a sheet reference.
  site_plan_id    uuid REFERENCES public.site_plans(id) ON DELETE SET NULL,
  cost_code_id    uuid REFERENCES public.cost_codes(id) ON DELETE SET NULL,
  name            text NOT NULL,
  unit            text NOT NULL,
  -- Calibration: drawing scale stored as inches-per-foot (e.g. 0.125 for
  -- 1/8" = 1'). Forwarded by the markup engine to ensure consistent
  -- measurement across reopens.
  calibration_in_per_ft numeric(8,4),
  -- Bulk-computed sum across items (denormalized for table-level summary).
  total_quantity  numeric(14,4) NOT NULL DEFAULT 0,
  notes           text,
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);

CREATE INDEX IF NOT EXISTS takeoffs_org_idx ON public.takeoffs (org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS takeoffs_project_idx ON public.takeoffs (project_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS takeoffs_site_plan_idx ON public.takeoffs (site_plan_id) WHERE site_plan_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS takeoffs_cost_code_idx ON public.takeoffs (cost_code_id) WHERE cost_code_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS takeoffs_created_by_idx ON public.takeoffs (created_by);

COMMENT ON TABLE public.takeoffs IS
  'Measurement header. Pinned to a drawing sheet for visual reference + calibration; items hold the geometry.';

-- =============================================================================
-- 5. takeoff_items — individual measurement shapes
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.takeoff_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  takeoff_id      uuid NOT NULL REFERENCES public.takeoffs(id) ON DELETE CASCADE,
  geometry_kind   public.takeoff_geometry_kind NOT NULL,
  -- GeoJSON-flavored coordinate array. The markup engine writes; the
  -- viewer reads. Storage is opaque to the DB.
  geometry        jsonb,
  measured_quantity numeric(14,4) NOT NULL DEFAULT 0,
  label           text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS takeoff_items_takeoff_idx ON public.takeoff_items (takeoff_id);
CREATE INDEX IF NOT EXISTS takeoff_items_org_idx ON public.takeoff_items (org_id);

COMMENT ON TABLE public.takeoff_items IS
  'Per-measurement rows. geometry is JSONB (lightweight) — full GeoJSON validation deferred to the markup engine.';

-- =============================================================================
-- 6. estimates — header
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.estimates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  project_id      uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name            text NOT NULL,
  estimate_state  public.estimate_state NOT NULL DEFAULT 'draft',
  cost_database_id uuid REFERENCES public.cost_databases(id) ON DELETE SET NULL,
  -- Global markup rules. Per-line overrides go on the line.
  default_markup_pct  numeric(7,4) NOT NULL DEFAULT 0,
  default_waste_factor numeric(7,4) NOT NULL DEFAULT 0,
  -- Rollup denormalization for the list view.
  subtotal_cost   numeric(14,2) NOT NULL DEFAULT 0,
  total_with_markup numeric(14,2) NOT NULL DEFAULT 0,
  baseline_at     timestamptz,
  submitted_at    timestamptz,
  notes           text,
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  UNIQUE (project_id, name)
);

CREATE INDEX IF NOT EXISTS estimates_org_idx ON public.estimates (org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS estimates_project_idx ON public.estimates (project_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS estimates_state_idx
  ON public.estimates (estimate_state) WHERE estimate_state IN ('draft','in_review','submitted');
CREATE INDEX IF NOT EXISTS estimates_cost_database_idx ON public.estimates (cost_database_id) WHERE cost_database_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS estimates_created_by_idx ON public.estimates (created_by);

COMMENT ON TABLE public.estimates IS
  'Header for a proposal-grade estimate. Joins takeoff quantities to cost-database items with markup; exports to budgets + proposal SOV.';

-- =============================================================================
-- 7. estimate_lines — the line items
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.estimate_lines (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  estimate_id       uuid NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  takeoff_item_id   uuid REFERENCES public.takeoff_items(id) ON DELETE SET NULL,
  cost_database_item_id uuid REFERENCES public.cost_database_items(id) ON DELETE SET NULL,
  cost_code_id      uuid REFERENCES public.cost_codes(id) ON DELETE SET NULL,
  description       text NOT NULL,
  quantity          numeric(14,4) NOT NULL DEFAULT 0,
  unit              text NOT NULL,
  unit_cost         numeric(14,4) NOT NULL DEFAULT 0,
  markup_pct        numeric(7,4) NOT NULL DEFAULT 0,
  waste_factor      numeric(7,4) NOT NULL DEFAULT 0,
  -- Convention: line_total = quantity * (1 + waste_factor) * unit_cost * (1 + markup_pct)
  line_total        numeric(14,2) NOT NULL DEFAULT 0,
  ordinal           int NOT NULL DEFAULT 0,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS estimate_lines_estimate_idx ON public.estimate_lines (estimate_id);
CREATE INDEX IF NOT EXISTS estimate_lines_org_idx ON public.estimate_lines (org_id);
CREATE INDEX IF NOT EXISTS estimate_lines_takeoff_idx ON public.estimate_lines (takeoff_item_id) WHERE takeoff_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS estimate_lines_db_item_idx
  ON public.estimate_lines (cost_database_item_id) WHERE cost_database_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS estimate_lines_cost_code_idx ON public.estimate_lines (cost_code_id) WHERE cost_code_id IS NOT NULL;

COMMENT ON TABLE public.estimate_lines IS
  'Estimate line items. line_total denormalized so partial updates do not require recompute. Sum of line_total rolls up into estimates.subtotal_cost / total_with_markup.';

-- =============================================================================
-- 8. updated_at triggers
-- =============================================================================

CREATE OR REPLACE FUNCTION public.touch_estimate_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_estimates_touch ON public.estimates;
CREATE TRIGGER trg_estimates_touch BEFORE UPDATE ON public.estimates
  FOR EACH ROW EXECUTE FUNCTION public.touch_estimate_updated_at();

DROP TRIGGER IF EXISTS trg_estimate_lines_touch ON public.estimate_lines;
CREATE TRIGGER trg_estimate_lines_touch BEFORE UPDATE ON public.estimate_lines
  FOR EACH ROW EXECUTE FUNCTION public.touch_estimate_updated_at();

DROP TRIGGER IF EXISTS trg_takeoffs_touch ON public.takeoffs;
CREATE TRIGGER trg_takeoffs_touch BEFORE UPDATE ON public.takeoffs
  FOR EACH ROW EXECUTE FUNCTION public.touch_estimate_updated_at();

DROP TRIGGER IF EXISTS trg_cost_databases_touch ON public.cost_databases;
CREATE TRIGGER trg_cost_databases_touch BEFORE UPDATE ON public.cost_databases
  FOR EACH ROW EXECUTE FUNCTION public.touch_estimate_updated_at();

DROP TRIGGER IF EXISTS trg_cost_database_items_touch ON public.cost_database_items;
CREATE TRIGGER trg_cost_database_items_touch BEFORE UPDATE ON public.cost_database_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_estimate_updated_at();

-- =============================================================================
-- 9. RLS
-- =============================================================================

ALTER TABLE public.cost_databases       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_database_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.takeoffs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.takeoff_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimates            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_lines       ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cost_databases_org_select ON public.cost_databases;
CREATE POLICY cost_databases_org_select ON public.cost_databases FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS cost_databases_org_write ON public.cost_databases;
CREATE POLICY cost_databases_org_write ON public.cost_databases FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

DROP POLICY IF EXISTS cost_database_items_org_select ON public.cost_database_items;
CREATE POLICY cost_database_items_org_select ON public.cost_database_items FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS cost_database_items_org_write ON public.cost_database_items;
CREATE POLICY cost_database_items_org_write ON public.cost_database_items FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

DROP POLICY IF EXISTS takeoffs_org_select ON public.takeoffs;
CREATE POLICY takeoffs_org_select ON public.takeoffs FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS takeoffs_org_write ON public.takeoffs;
CREATE POLICY takeoffs_org_write ON public.takeoffs FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

DROP POLICY IF EXISTS takeoff_items_org_select ON public.takeoff_items;
CREATE POLICY takeoff_items_org_select ON public.takeoff_items FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS takeoff_items_org_write ON public.takeoff_items;
CREATE POLICY takeoff_items_org_write ON public.takeoff_items FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

DROP POLICY IF EXISTS estimates_org_select ON public.estimates;
CREATE POLICY estimates_org_select ON public.estimates FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS estimates_org_write ON public.estimates;
CREATE POLICY estimates_org_write ON public.estimates FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

DROP POLICY IF EXISTS estimate_lines_org_select ON public.estimate_lines;
CREATE POLICY estimate_lines_org_select ON public.estimate_lines FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS estimate_lines_org_write ON public.estimate_lines;
CREATE POLICY estimate_lines_org_write ON public.estimate_lines FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

COMMIT;
