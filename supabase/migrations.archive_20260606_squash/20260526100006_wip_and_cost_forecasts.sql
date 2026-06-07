-- Round 41 — WIP snapshots + EAC cost forecasts
--
-- Per construction-pm-parity Wave 3.3 + 3.4 (gaps G-011, G-012).
-- WIP (work-in-progress) reports are statutory for any bonded GC — sureties
-- require monthly snapshots of contract value, costs to date, % complete,
-- earned revenue, billed amount, and over/under-billing position.
-- EAC (estimate at completion) is the formal "forecast cost to complete +
-- incurred to date" rollup, broken down by cost code.

BEGIN;

-- =============================================================================
-- 1. wip_snapshots
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.wip_snapshots (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                  uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  project_id              uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  -- Snapshot anchor. Conventionally the last day of the accounting period.
  snapshot_date           date NOT NULL,
  -- Contract economics.
  contract_amount         numeric(14,2) NOT NULL DEFAULT 0,
  approved_change_orders  numeric(14,2) NOT NULL DEFAULT 0,
  -- Derived = contract_amount + approved_change_orders. Stored so the row
  -- is self-describing for surety review.
  revised_contract_amount numeric(14,2) NOT NULL DEFAULT 0,
  -- Cost / earnings position.
  costs_to_date           numeric(14,2) NOT NULL DEFAULT 0,
  estimated_cost_to_complete numeric(14,2) NOT NULL DEFAULT 0,
  estimated_at_completion numeric(14,2) NOT NULL DEFAULT 0,
  percent_complete        numeric(5,2)  NOT NULL DEFAULT 0,    -- by-cost method
  earned_revenue          numeric(14,2) NOT NULL DEFAULT 0,
  billed_to_date          numeric(14,2) NOT NULL DEFAULT 0,
  -- Positive = over-billed, negative = under-billed.
  over_under_billed       numeric(14,2) NOT NULL DEFAULT 0,
  -- Backstop for surety report rollups; not denormalized through the rest
  -- of the schema.
  bonded                  boolean NOT NULL DEFAULT false,
  surety_carrier          text,
  -- Generated_at != snapshot_date — we may regenerate snapshots later.
  generated_at            timestamptz NOT NULL DEFAULT now(),
  generated_by            uuid REFERENCES auth.users(id),
  notes                   text,
  UNIQUE (project_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS wip_snapshots_org_idx ON public.wip_snapshots (org_id);
CREATE INDEX IF NOT EXISTS wip_snapshots_project_idx ON public.wip_snapshots (project_id);
CREATE INDEX IF NOT EXISTS wip_snapshots_date_idx ON public.wip_snapshots (snapshot_date DESC);
CREATE INDEX IF NOT EXISTS wip_snapshots_over_under_idx ON public.wip_snapshots (over_under_billed);
CREATE INDEX IF NOT EXISTS wip_snapshots_generated_by_idx ON public.wip_snapshots (generated_by);

COMMENT ON TABLE public.wip_snapshots IS
  'Monthly WIP report rows for surety / bonding review. One row per project per snapshot_date; over/under-billed = earned_revenue − billed_to_date.';

-- =============================================================================
-- 2. cost_forecasts — the EAC header
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.cost_forecasts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  project_id      uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  -- Free text, e.g. "March close 2026" — uniqueness is per project.
  name            text NOT NULL,
  forecast_at     timestamptz NOT NULL DEFAULT now(),
  -- 'earned_value' = use earned-value calculation against schedule activities.
  -- 'manual'       = forecast_to_complete entered per-line by the PM.
  -- 'automatic'    = run rate × remaining duration.
  methodology     text NOT NULL DEFAULT 'manual'
                    CHECK (methodology IN ('earned_value','manual','automatic')),
  notes           text,
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  UNIQUE (project_id, name)
);

CREATE INDEX IF NOT EXISTS cost_forecasts_org_idx
  ON public.cost_forecasts (org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS cost_forecasts_project_idx
  ON public.cost_forecasts (project_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS cost_forecasts_created_by_idx ON public.cost_forecasts (created_by);

COMMENT ON TABLE public.cost_forecasts IS
  'EAC (estimate at completion) header. Per-cost-code lines live in cost_forecast_lines; the header rolls them up.';

-- =============================================================================
-- 3. cost_forecast_lines — per-cost-code rows
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.cost_forecast_lines (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  cost_forecast_id     uuid NOT NULL REFERENCES public.cost_forecasts(id) ON DELETE CASCADE,
  cost_code_id         uuid REFERENCES public.cost_codes(id) ON DELETE SET NULL,
  -- For when the forecast line doesn't map to a cost_code row (rare).
  cost_code_label      text,
  original_budget      numeric(14,2) NOT NULL DEFAULT 0,
  approved_changes     numeric(14,2) NOT NULL DEFAULT 0,
  pending_changes      numeric(14,2) NOT NULL DEFAULT 0,
  committed            numeric(14,2) NOT NULL DEFAULT 0,
  incurred             numeric(14,2) NOT NULL DEFAULT 0,
  forecast_to_complete numeric(14,2) NOT NULL DEFAULT 0,
  -- Convention: EAC = incurred + forecast_to_complete. Stored so the row is
  -- self-describing for finance review.
  estimated_at_completion numeric(14,2) NOT NULL DEFAULT 0,
  -- variance = EAC − (original_budget + approved_changes). Positive = over.
  variance             numeric(14,2) NOT NULL DEFAULT 0,
  notes                text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  -- Either cost_code_id OR cost_code_label must be set.
  CONSTRAINT cost_forecast_line_has_cost_code CHECK (
    cost_code_id IS NOT NULL OR cost_code_label IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS cost_forecast_lines_forecast_idx ON public.cost_forecast_lines (cost_forecast_id);
CREATE INDEX IF NOT EXISTS cost_forecast_lines_cost_code_idx ON public.cost_forecast_lines (cost_code_id) WHERE cost_code_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS cost_forecast_lines_org_idx ON public.cost_forecast_lines (org_id);

COMMENT ON TABLE public.cost_forecast_lines IS
  'Per-cost-code rows under a cost_forecasts header. Variance = EAC − (original_budget + approved_changes). Red flags are positive variance rows.';

-- =============================================================================
-- 4. updated_at triggers
-- =============================================================================

CREATE OR REPLACE FUNCTION public.touch_cost_forecast_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cost_forecasts_touch ON public.cost_forecasts;
CREATE TRIGGER trg_cost_forecasts_touch
  BEFORE UPDATE ON public.cost_forecasts
  FOR EACH ROW EXECUTE FUNCTION public.touch_cost_forecast_updated_at();

DROP TRIGGER IF EXISTS trg_cost_forecast_lines_touch ON public.cost_forecast_lines;
CREATE TRIGGER trg_cost_forecast_lines_touch
  BEFORE UPDATE ON public.cost_forecast_lines
  FOR EACH ROW EXECUTE FUNCTION public.touch_cost_forecast_updated_at();

-- =============================================================================
-- 5. RLS
-- =============================================================================

ALTER TABLE public.wip_snapshots         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_forecasts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_forecast_lines   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS wip_snapshots_org_select ON public.wip_snapshots;
CREATE POLICY wip_snapshots_org_select ON public.wip_snapshots
  FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS wip_snapshots_org_write ON public.wip_snapshots;
CREATE POLICY wip_snapshots_org_write ON public.wip_snapshots
  FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

DROP POLICY IF EXISTS cost_forecasts_org_select ON public.cost_forecasts;
CREATE POLICY cost_forecasts_org_select ON public.cost_forecasts
  FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS cost_forecasts_org_write ON public.cost_forecasts;
CREATE POLICY cost_forecasts_org_write ON public.cost_forecasts
  FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

DROP POLICY IF EXISTS cost_forecast_lines_org_select ON public.cost_forecast_lines;
CREATE POLICY cost_forecast_lines_org_select ON public.cost_forecast_lines
  FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS cost_forecast_lines_org_write ON public.cost_forecast_lines;
CREATE POLICY cost_forecast_lines_org_write ON public.cost_forecast_lines
  FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

COMMIT;
