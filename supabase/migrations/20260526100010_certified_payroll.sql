-- Round 45 — Certified payroll + wage determinations
--
-- Per construction-pm-parity Wave 3.7 (gap G-010). Federal Davis-Bacon
-- jobs and state-prevailing-wage jobs are unwinnable without certified
-- payroll. Sage 100/300 + Foundation own this market because of it.
--
-- Four tables:
--   - wage_determinations: per-project classification rate table.
--   - union_local_rates: org-wide library of union-local rates (fringe
--     breakdown stored as JSONB).
--   - payroll_runs: per-pay-period header with agency report type
--     (WH-347 for federal Davis-Bacon, plus state variants).
--   - payroll_run_lines: per-employee, per-classification time-and-cost
--     row backing the certified-payroll output.
--
-- Phase 1 (this round): schema + admin views + CSV export hooks.
-- Phase 2 (separate ticket): native WH-347 PDF generator.

BEGIN;

DO $$ BEGIN
  CREATE TYPE public.payroll_agency_report AS ENUM (
    'wh_347',          -- federal Davis-Bacon (US DOL form WH-347)
    'ca_dir',          -- California DIR XML
    'ny_pwa',          -- New York Prevailing Wage XML
    'wa_lni',          -- Washington L&I
    'state_other',
    'none'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payroll_run_state AS ENUM (
    'draft',
    'in_review',
    'submitted',
    'accepted',
    'rejected',
    'voided'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- 1. wage_determinations — per-project rate table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.wage_determinations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  -- Often per-project (federal/state jobs publish a determination per contract).
  project_id      uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  -- 'federal' (Davis-Bacon) | 'state' | 'local'.
  agency          text NOT NULL,
  -- e.g. "CA20240001" or "WD-2024-VA-007".
  determination_number text,
  classification  text NOT NULL,
  -- Hourly base rate excluding fringes.
  base_rate       numeric(8,4) NOT NULL,
  fringe_rate     numeric(8,4) NOT NULL DEFAULT 0,
  effective_at    date NOT NULL,
  expires_at      date,
  source_url      text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wage_determinations_org_idx ON public.wage_determinations (org_id);
CREATE INDEX IF NOT EXISTS wage_determinations_project_idx
  ON public.wage_determinations (project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS wage_determinations_classification_idx
  ON public.wage_determinations (classification);
CREATE INDEX IF NOT EXISTS wage_determinations_active_idx
  ON public.wage_determinations (effective_at, expires_at);

COMMENT ON TABLE public.wage_determinations IS
  'Classification → (base_rate, fringe_rate) rows per project + agency. Davis-Bacon (federal), CA DIR, NY PWA, WA L&I supported via agency enum.';

-- =============================================================================
-- 2. union_local_rates — org-wide library
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.union_local_rates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  -- Local identifier (e.g. "IBEW Local 11" / "UA Local 250").
  local_name      text NOT NULL,
  classification  text NOT NULL,
  base_rate       numeric(8,4) NOT NULL,
  -- Fringe breakdown: {"health":4.50,"pension":3.75,"training":0.50,"vacation":2.00}.
  fringe_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Working rules: overtime multiplier, doubletime threshold, etc.
  work_rules      jsonb NOT NULL DEFAULT '{}'::jsonb,
  effective_at    date NOT NULL,
  expires_at      date,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, local_name, classification, effective_at)
);

CREATE INDEX IF NOT EXISTS union_local_rates_org_idx ON public.union_local_rates (org_id);
CREATE INDEX IF NOT EXISTS union_local_rates_local_idx ON public.union_local_rates (local_name);

COMMENT ON TABLE public.union_local_rates IS
  'Org-wide library of union-local rate schedules. Fringe breakdown + work_rules as JSONB to absorb local-specific quirks without schema churn.';

-- =============================================================================
-- 3. payroll_runs — per-pay-period header
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.payroll_runs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  project_id            uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  -- Sequence number per project, e.g. "Week 12" or "0042".
  week_ending           date NOT NULL,
  pay_period_start      date NOT NULL,
  pay_period_end        date NOT NULL,
  state_code            text,
  agency_report_type    public.payroll_agency_report NOT NULL DEFAULT 'none',
  run_state             public.payroll_run_state NOT NULL DEFAULT 'draft',
  certified_at          timestamptz,
  certified_by          uuid REFERENCES auth.users(id),
  submitted_at          timestamptz,
  agency_reference      text,                  -- ticket # / transmittal ID from the agency
  total_hours           numeric(12,2) NOT NULL DEFAULT 0,
  total_gross           numeric(14,2) NOT NULL DEFAULT 0,
  total_fringes         numeric(14,2) NOT NULL DEFAULT 0,
  notes                 text,
  created_by            uuid REFERENCES auth.users(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  deleted_at            timestamptz,
  UNIQUE (project_id, week_ending)
);

CREATE INDEX IF NOT EXISTS payroll_runs_org_idx ON public.payroll_runs (org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS payroll_runs_project_idx ON public.payroll_runs (project_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS payroll_runs_state_idx
  ON public.payroll_runs (run_state) WHERE run_state IN ('draft','in_review','submitted');
CREATE INDEX IF NOT EXISTS payroll_runs_week_idx ON public.payroll_runs (week_ending DESC);
CREATE INDEX IF NOT EXISTS payroll_runs_certified_by_idx ON public.payroll_runs (certified_by);
CREATE INDEX IF NOT EXISTS payroll_runs_created_by_idx ON public.payroll_runs (created_by);

COMMENT ON TABLE public.payroll_runs IS
  'Per-pay-period header. agency_report_type drives the certified-payroll output format (WH-347, CA DIR XML, etc.).';

-- =============================================================================
-- 4. payroll_run_lines — per-employee, per-classification rows
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.payroll_run_lines (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id             uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  payroll_run_id     uuid NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
  -- Either an org user (W-2 employee) or a free-text name (subcontractor's
  -- worker on a cert-payroll job).
  user_id            uuid REFERENCES public.users(id) ON DELETE SET NULL,
  worker_name        text,
  -- Identifying fields required on WH-347.
  ssn_last_4         text,
  classification     text NOT NULL,
  wage_determination_id uuid REFERENCES public.wage_determinations(id) ON DELETE SET NULL,
  -- Per-day hours; sum equals weekly total.
  hours_by_day       numeric(5,2)[] NOT NULL DEFAULT '{0,0,0,0,0,0,0}'::numeric[],
  hours_st           numeric(7,2) NOT NULL DEFAULT 0,
  hours_ot           numeric(7,2) NOT NULL DEFAULT 0,
  hours_dt           numeric(7,2) NOT NULL DEFAULT 0,
  rate_st            numeric(8,4) NOT NULL DEFAULT 0,
  rate_ot            numeric(8,4) NOT NULL DEFAULT 0,
  rate_dt            numeric(8,4) NOT NULL DEFAULT 0,
  gross              numeric(14,2) NOT NULL DEFAULT 0,
  fringes_cash       numeric(14,2) NOT NULL DEFAULT 0,
  fringes_to_plans   numeric(14,2) NOT NULL DEFAULT 0,
  deductions         jsonb NOT NULL DEFAULT '{}'::jsonb,
  net               numeric(14,2) NOT NULL DEFAULT 0,
  notes              text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payroll_run_line_has_worker CHECK (
    user_id IS NOT NULL OR worker_name IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS payroll_run_lines_run_idx ON public.payroll_run_lines (payroll_run_id);
CREATE INDEX IF NOT EXISTS payroll_run_lines_org_idx ON public.payroll_run_lines (org_id);
CREATE INDEX IF NOT EXISTS payroll_run_lines_user_idx ON public.payroll_run_lines (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS payroll_run_lines_wd_idx
  ON public.payroll_run_lines (wage_determination_id) WHERE wage_determination_id IS NOT NULL;

COMMENT ON TABLE public.payroll_run_lines IS
  'Per-employee certified-payroll detail. hours_by_day[] is Sun..Sat (7 elements). gross = ST*rate_st + OT*rate_ot + DT*rate_dt; net = gross - sum(deductions).';

-- =============================================================================
-- 5. updated_at triggers
-- =============================================================================

CREATE OR REPLACE FUNCTION public.touch_payroll_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_wage_determinations_touch ON public.wage_determinations;
CREATE TRIGGER trg_wage_determinations_touch BEFORE UPDATE ON public.wage_determinations
  FOR EACH ROW EXECUTE FUNCTION public.touch_payroll_updated_at();

DROP TRIGGER IF EXISTS trg_union_local_rates_touch ON public.union_local_rates;
CREATE TRIGGER trg_union_local_rates_touch BEFORE UPDATE ON public.union_local_rates
  FOR EACH ROW EXECUTE FUNCTION public.touch_payroll_updated_at();

DROP TRIGGER IF EXISTS trg_payroll_runs_touch ON public.payroll_runs;
CREATE TRIGGER trg_payroll_runs_touch BEFORE UPDATE ON public.payroll_runs
  FOR EACH ROW EXECUTE FUNCTION public.touch_payroll_updated_at();

DROP TRIGGER IF EXISTS trg_payroll_run_lines_touch ON public.payroll_run_lines;
CREATE TRIGGER trg_payroll_run_lines_touch BEFORE UPDATE ON public.payroll_run_lines
  FOR EACH ROW EXECUTE FUNCTION public.touch_payroll_updated_at();

-- =============================================================================
-- 6. RLS
-- =============================================================================

ALTER TABLE public.wage_determinations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.union_local_rates    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_runs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_run_lines    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS wage_determinations_org_select ON public.wage_determinations;
CREATE POLICY wage_determinations_org_select ON public.wage_determinations
  FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS wage_determinations_org_write ON public.wage_determinations;
CREATE POLICY wage_determinations_org_write ON public.wage_determinations
  FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

DROP POLICY IF EXISTS union_local_rates_org_select ON public.union_local_rates;
CREATE POLICY union_local_rates_org_select ON public.union_local_rates
  FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS union_local_rates_org_write ON public.union_local_rates;
CREATE POLICY union_local_rates_org_write ON public.union_local_rates
  FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

DROP POLICY IF EXISTS payroll_runs_org_select ON public.payroll_runs;
CREATE POLICY payroll_runs_org_select ON public.payroll_runs
  FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS payroll_runs_org_write ON public.payroll_runs;
CREATE POLICY payroll_runs_org_write ON public.payroll_runs
  FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

DROP POLICY IF EXISTS payroll_run_lines_org_select ON public.payroll_run_lines;
CREATE POLICY payroll_run_lines_org_select ON public.payroll_run_lines
  FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS payroll_run_lines_org_write ON public.payroll_run_lines;
CREATE POLICY payroll_run_lines_org_write ON public.payroll_run_lines
  FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

COMMIT;
