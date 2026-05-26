-- Round 48 — Predictive risk scoring + cross-project resource planning
--
-- Per construction-pm-parity Wave 4.3 + 4.5 (gaps G-020, G-022). Two
-- analytics spines that compound the rest of the build:
--   - risk_scores + risk_score_inputs: project-level risk model. Procore
--     introduced this in 2024; it is now table-stakes for portfolio dashboards.
--   - resource_forecasts + resource_forecast_lines: cross-project workforce
--     forecasting (Bridgit Bench equivalent). Capacity vs demand, 5-year horizon.
--
-- Both are computed downstream of existing tables; nightly batch jobs (or
-- on-demand recompute) populate the rows. This migration ships the spine
-- so the dashboards have something to render against.

BEGIN;

-- =============================================================================
-- 1. RISK SCORES
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE public.risk_category AS ENUM (
    'schedule',
    'cost',
    'safety',
    'sub_default',
    'quality',
    'cash_flow',
    'overall'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.risk_severity AS ENUM (
    'low',
    'moderate',
    'high',
    'critical'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.risk_scores (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  project_id      uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  scored_at       timestamptz NOT NULL DEFAULT now(),
  category        public.risk_category NOT NULL,
  -- 0..100, higher = riskier. Per-category for clarity at portfolio level.
  score           numeric(5,2) NOT NULL,
  severity        public.risk_severity NOT NULL,
  -- The top-N drivers behind the score, for explanation in the UI.
  drivers         jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommended_action text,
  trend_7d        numeric(6,2),         -- delta vs 7 days ago
  trend_30d       numeric(6,2),
  -- The model + version that produced this score, so we can A/B + audit.
  model_version   text NOT NULL DEFAULT 'rules_v1',
  created_by_run  uuid,                 -- batch-job run id (free-text)
  notes           text,
  UNIQUE (project_id, category, scored_at)
);

CREATE INDEX IF NOT EXISTS risk_scores_org_idx ON public.risk_scores (org_id);
CREATE INDEX IF NOT EXISTS risk_scores_project_idx ON public.risk_scores (project_id);
CREATE INDEX IF NOT EXISTS risk_scores_category_idx ON public.risk_scores (category);
CREATE INDEX IF NOT EXISTS risk_scores_severity_idx
  ON public.risk_scores (severity) WHERE severity IN ('high','critical');
CREATE INDEX IF NOT EXISTS risk_scores_scored_at_idx ON public.risk_scores (scored_at DESC);

COMMENT ON TABLE public.risk_scores IS
  'Predictive risk model output. One row per project + category per scoring batch. drivers JSONB stores the top features that drove the score for UI explanation.';

CREATE TABLE IF NOT EXISTS public.risk_score_inputs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  risk_score_id   uuid NOT NULL REFERENCES public.risk_scores(id) ON DELETE CASCADE,
  -- Feature name (e.g. 'baseline_vs_actual_pct', 'avg_rfi_age_days',
  -- 'incident_rate_7d', 'cost_overrun_pct', 'sub_late_pay_count').
  feature_name    text NOT NULL,
  feature_value   numeric(14,4),
  feature_text    text,
  -- Weight applied by the model to this feature.
  weight          numeric(7,4),
  -- Per-feature contribution to the final score.
  contribution   numeric(7,4),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS risk_score_inputs_score_idx ON public.risk_score_inputs (risk_score_id);
CREATE INDEX IF NOT EXISTS risk_score_inputs_feature_idx ON public.risk_score_inputs (feature_name);
CREATE INDEX IF NOT EXISTS risk_score_inputs_org_idx ON public.risk_score_inputs (org_id);

COMMENT ON TABLE public.risk_score_inputs IS
  'Per-feature breakdown of a risk_scores row. Enables tooltip-on-hover "why is this red?" UX.';

-- =============================================================================
-- 2. RESOURCE FORECASTS (Bridgit Bench equivalent)
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE public.resource_kind AS ENUM (
    'crew_role',        -- e.g. "Electrician Foreman"
    'equipment_class',  -- e.g. "Crane 100T"
    'crew_member',      -- specific named individual
    'subcontractor'     -- specific sub
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.resource_forecast_horizon AS ENUM (
    'thirty_day',
    'ninety_day',
    'one_year',
    'five_year'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.resource_forecasts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  -- Anchor — every forecast row references this header.
  name            text NOT NULL,
  horizon         public.resource_forecast_horizon NOT NULL,
  baseline_at     date NOT NULL DEFAULT current_date,
  generated_by    uuid REFERENCES auth.users(id),
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS resource_forecasts_org_idx ON public.resource_forecasts (org_id);
CREATE INDEX IF NOT EXISTS resource_forecasts_baseline_idx ON public.resource_forecasts (baseline_at DESC);
CREATE INDEX IF NOT EXISTS resource_forecasts_generated_by_idx ON public.resource_forecasts (generated_by);

COMMENT ON TABLE public.resource_forecasts IS
  'Header for a cross-project workforce/equipment forecast. Lines roll up demand vs capacity per resource_kind per period.';

CREATE TABLE IF NOT EXISTS public.resource_forecast_lines (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  resource_forecast_id  uuid NOT NULL REFERENCES public.resource_forecasts(id) ON DELETE CASCADE,
  resource_kind         public.resource_kind NOT NULL,
  resource_key          text NOT NULL,            -- 'electrician_foreman' | 'crane_100t' | user_id::text
  resource_label        text NOT NULL,
  -- Period anchor — typically week-starting or month-starting.
  period_start          date NOT NULL,
  period_end            date NOT NULL,
  -- Capacity vs demand in hours per week (or units for equipment).
  capacity_units        numeric(12,2) NOT NULL DEFAULT 0,
  demand_units          numeric(12,2) NOT NULL DEFAULT 0,
  -- Positive = bench / under-utilization, negative = over-demand.
  surplus_units         numeric(12,2) NOT NULL DEFAULT 0,
  -- Roll-up of projects driving demand.
  contributing_projects uuid[] NOT NULL DEFAULT '{}',
  bench_cost            numeric(14,2),
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (resource_forecast_id, resource_kind, resource_key, period_start)
);

CREATE INDEX IF NOT EXISTS resource_forecast_lines_forecast_idx ON public.resource_forecast_lines (resource_forecast_id);
CREATE INDEX IF NOT EXISTS resource_forecast_lines_org_idx ON public.resource_forecast_lines (org_id);
CREATE INDEX IF NOT EXISTS resource_forecast_lines_resource_idx
  ON public.resource_forecast_lines (resource_kind, resource_key);
CREATE INDEX IF NOT EXISTS resource_forecast_lines_period_idx
  ON public.resource_forecast_lines (period_start, period_end);
CREATE INDEX IF NOT EXISTS resource_forecast_lines_overdemand_idx
  ON public.resource_forecast_lines (surplus_units) WHERE surplus_units < 0;

COMMENT ON TABLE public.resource_forecast_lines IS
  'Per-period, per-resource demand vs capacity. Negative surplus = staffing/equipment gap. contributing_projects[] surfaces what is driving demand.';

-- =============================================================================
-- 3. updated_at triggers
-- =============================================================================

CREATE OR REPLACE FUNCTION public.touch_round48_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_resource_forecasts_touch ON public.resource_forecasts;
CREATE TRIGGER trg_resource_forecasts_touch BEFORE UPDATE ON public.resource_forecasts
  FOR EACH ROW EXECUTE FUNCTION public.touch_round48_updated_at();

DROP TRIGGER IF EXISTS trg_resource_forecast_lines_touch ON public.resource_forecast_lines;
CREATE TRIGGER trg_resource_forecast_lines_touch BEFORE UPDATE ON public.resource_forecast_lines
  FOR EACH ROW EXECUTE FUNCTION public.touch_round48_updated_at();

-- =============================================================================
-- 4. RLS
-- =============================================================================

ALTER TABLE public.risk_scores               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_score_inputs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_forecasts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_forecast_lines   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS risk_scores_org_select ON public.risk_scores;
CREATE POLICY risk_scores_org_select ON public.risk_scores FOR SELECT USING (private.is_org_member(org_id));
-- Writes happen via the batch worker (service role).

DROP POLICY IF EXISTS risk_score_inputs_org_select ON public.risk_score_inputs;
CREATE POLICY risk_score_inputs_org_select ON public.risk_score_inputs FOR SELECT USING (private.is_org_member(org_id));

DROP POLICY IF EXISTS resource_forecasts_org_select ON public.resource_forecasts;
CREATE POLICY resource_forecasts_org_select ON public.resource_forecasts FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS resource_forecasts_org_write ON public.resource_forecasts;
CREATE POLICY resource_forecasts_org_write ON public.resource_forecasts FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

DROP POLICY IF EXISTS resource_forecast_lines_org_select ON public.resource_forecast_lines;
CREATE POLICY resource_forecast_lines_org_select ON public.resource_forecast_lines FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS resource_forecast_lines_org_write ON public.resource_forecast_lines;
CREATE POLICY resource_forecast_lines_org_write ON public.resource_forecast_lines FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

COMMIT;
