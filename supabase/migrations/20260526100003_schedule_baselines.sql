-- Round 38 — Schedule baselines + CPM activities (Gantt data model)
--
-- Per construction-pm-parity Wave 2.1 (gap G-001). Five new tables to back
-- a proper CPM scheduler: schedule_baselines (named snapshots), activities,
-- dependencies, actuals, and calendars. The CPM forward/backward-pass logic
-- runs in TS (src/lib/schedule/cpm.ts) — the schema is just storage.
--
-- P6 / MS Project / Asta XML import maps cleanly onto these tables.

BEGIN;

-- =============================================================================
-- 1. ENUMS
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE public.schedule_dep_type AS ENUM (
    'fs',  -- finish-to-start (the default)
    'ss',  -- start-to-start
    'ff',  -- finish-to-finish
    'sf'   -- start-to-finish (rare)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.schedule_constraint_type AS ENUM (
    'none',
    'start_no_earlier_than',
    'start_no_later_than',
    'finish_no_earlier_than',
    'finish_no_later_than',
    'must_start_on',
    'must_finish_on',
    'as_soon_as_possible',
    'as_late_as_possible'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.schedule_baseline_state AS ENUM (
    'draft',
    'active',
    'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- 2. schedule_calendars — work-day + holiday model
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.schedule_calendars (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  project_id    uuid REFERENCES public.projects(id) ON DELETE CASCADE,  -- null = org-default
  name          text NOT NULL,
  -- Bitmask of work days: Sun=1, Mon=2, Tue=4, Wed=8, Thu=16, Fri=32, Sat=64.
  -- M-F default = 2+4+8+16+32 = 62.
  work_days_mask int NOT NULL DEFAULT 62,
  -- ISO 8601 dates the schedule treats as non-working.
  holidays      date[] NOT NULL DEFAULT '{}',
  hours_per_day numeric(4,2) NOT NULL DEFAULT 8.00,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, project_id, name)
);

CREATE INDEX IF NOT EXISTS schedule_calendars_org_idx ON public.schedule_calendars (org_id);
CREATE INDEX IF NOT EXISTS schedule_calendars_project_idx
  ON public.schedule_calendars (project_id) WHERE project_id IS NOT NULL;

COMMENT ON TABLE public.schedule_calendars IS
  'Work-day + holiday model. Activities reference one calendar to compute realistic durations excluding non-working days.';

-- =============================================================================
-- 3. schedule_baselines — named snapshots per project
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.schedule_baselines (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  project_id      uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name            text NOT NULL,
  description     text,
  baseline_state  public.schedule_baseline_state NOT NULL DEFAULT 'draft',
  -- Source schedule file the baseline imports from (or null for native).
  imported_from   text,                  -- 'p6_xer' | 'p6_xml' | 'msp_xml' | 'asta' | null
  imported_at     timestamptz,
  imported_by     uuid REFERENCES auth.users(id),
  snapshot_at     timestamptz,
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  UNIQUE (project_id, name)
);

CREATE INDEX IF NOT EXISTS schedule_baselines_org_idx
  ON public.schedule_baselines (org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS schedule_baselines_project_idx
  ON public.schedule_baselines (project_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS schedule_baselines_state_idx
  ON public.schedule_baselines (baseline_state) WHERE baseline_state = 'active';
CREATE INDEX IF NOT EXISTS schedule_baselines_imported_by_idx ON public.schedule_baselines (imported_by);
CREATE INDEX IF NOT EXISTS schedule_baselines_created_by_idx ON public.schedule_baselines (created_by);

-- Project can have at most one ACTIVE baseline at a time. Partial unique
-- index enforces this without blocking multiple drafts/archives.
CREATE UNIQUE INDEX IF NOT EXISTS schedule_baselines_one_active_per_project
  ON public.schedule_baselines (project_id)
  WHERE baseline_state = 'active' AND deleted_at IS NULL;

COMMENT ON TABLE public.schedule_baselines IS
  'A named schedule snapshot. Only one row per project may be active at a time; baselines flip active→archived on a new baseline.';

-- =============================================================================
-- 4. schedule_activities — the line-items
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.schedule_activities (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  baseline_id       uuid NOT NULL REFERENCES public.schedule_baselines(id) ON DELETE CASCADE,
  -- e.g. "A1010" (P6 activity code). Free text; unique within baseline.
  code              text NOT NULL,
  name              text NOT NULL,
  wbs_path          text,                   -- breadcrumb e.g. "01.02.03"
  parent_id         uuid REFERENCES public.schedule_activities(id) ON DELETE CASCADE,
  calendar_id       uuid REFERENCES public.schedule_calendars(id) ON DELETE SET NULL,
  -- Planned dates (CPM forward pass output, or imported from P6).
  start_planned     timestamptz NOT NULL,
  finish_planned    timestamptz NOT NULL,
  duration_days     numeric(8,2) NOT NULL,
  -- CPM-computed columns. Filled by the scheduler; not user-edited.
  early_start       timestamptz,
  early_finish      timestamptz,
  late_start        timestamptz,
  late_finish       timestamptz,
  total_float_days  numeric(8,2),
  free_float_days   numeric(8,2),
  is_critical       boolean NOT NULL DEFAULT false,
  -- Constraint slot (one per activity).
  constraint_type   public.schedule_constraint_type NOT NULL DEFAULT 'none',
  constraint_date   timestamptz,
  -- Progress.
  percent_complete  numeric(5,2) NOT NULL DEFAULT 0.00,
  -- Resource estimate (light-weight; full resourcing comes later if needed).
  budgeted_units    numeric(12,2),
  budgeted_cost     numeric(14,2),
  notes_md          text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (baseline_id, code)
);

CREATE INDEX IF NOT EXISTS schedule_activities_baseline_idx ON public.schedule_activities (baseline_id);
CREATE INDEX IF NOT EXISTS schedule_activities_org_idx ON public.schedule_activities (org_id);
CREATE INDEX IF NOT EXISTS schedule_activities_parent_idx ON public.schedule_activities (parent_id);
CREATE INDEX IF NOT EXISTS schedule_activities_calendar_idx ON public.schedule_activities (calendar_id);
CREATE INDEX IF NOT EXISTS schedule_activities_critical_idx
  ON public.schedule_activities (baseline_id, is_critical) WHERE is_critical = true;
CREATE INDEX IF NOT EXISTS schedule_activities_lookahead_idx
  ON public.schedule_activities (start_planned, finish_planned);

COMMENT ON TABLE public.schedule_activities IS
  'Individual schedule activities. CPM-computed columns (early_*, late_*, *_float_days, is_critical) are derived; do not edit by hand.';

-- =============================================================================
-- 5. schedule_activity_dependencies — predecessor/successor edges
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.schedule_activity_dependencies (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  baseline_id     uuid NOT NULL REFERENCES public.schedule_baselines(id) ON DELETE CASCADE,
  predecessor_id  uuid NOT NULL REFERENCES public.schedule_activities(id) ON DELETE CASCADE,
  successor_id    uuid NOT NULL REFERENCES public.schedule_activities(id) ON DELETE CASCADE,
  dep_type        public.schedule_dep_type NOT NULL DEFAULT 'fs',
  lag_days        numeric(8,2) NOT NULL DEFAULT 0,
  CHECK (predecessor_id <> successor_id),
  UNIQUE (predecessor_id, successor_id, dep_type)
);

CREATE INDEX IF NOT EXISTS schedule_deps_predecessor_idx
  ON public.schedule_activity_dependencies (predecessor_id);
CREATE INDEX IF NOT EXISTS schedule_deps_successor_idx
  ON public.schedule_activity_dependencies (successor_id);
CREATE INDEX IF NOT EXISTS schedule_deps_baseline_idx
  ON public.schedule_activity_dependencies (baseline_id);
CREATE INDEX IF NOT EXISTS schedule_deps_org_idx ON public.schedule_activity_dependencies (org_id);

COMMENT ON TABLE public.schedule_activity_dependencies IS
  'Predecessor/successor edges. FS/SS/FF/SF + lag_days mirror P6 + MSP semantics.';

-- =============================================================================
-- 6. schedule_activity_actuals — measured progress
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.schedule_activity_actuals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  activity_id     uuid NOT NULL REFERENCES public.schedule_activities(id) ON DELETE CASCADE,
  start_actual    timestamptz,
  finish_actual   timestamptz,
  percent_complete numeric(5,2) NOT NULL DEFAULT 0.00,
  units_worked    numeric(12,2),
  cost_incurred   numeric(14,2),
  recorded_at     timestamptz NOT NULL DEFAULT now(),
  recorded_by     uuid REFERENCES auth.users(id),
  notes           text
);

CREATE INDEX IF NOT EXISTS schedule_actuals_activity_idx ON public.schedule_activity_actuals (activity_id);
CREATE INDEX IF NOT EXISTS schedule_actuals_org_idx ON public.schedule_activity_actuals (org_id);
CREATE INDEX IF NOT EXISTS schedule_actuals_recorded_by_idx ON public.schedule_activity_actuals (recorded_by);

COMMENT ON TABLE public.schedule_activity_actuals IS
  'Append-only progress records. The latest row per activity drives baseline-vs-actual variance reporting.';

-- =============================================================================
-- 7. updated_at triggers
-- =============================================================================

CREATE OR REPLACE FUNCTION public.touch_schedule_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_schedule_baselines_touch ON public.schedule_baselines;
CREATE TRIGGER trg_schedule_baselines_touch
  BEFORE UPDATE ON public.schedule_baselines
  FOR EACH ROW EXECUTE FUNCTION public.touch_schedule_updated_at();

DROP TRIGGER IF EXISTS trg_schedule_calendars_touch ON public.schedule_calendars;
CREATE TRIGGER trg_schedule_calendars_touch
  BEFORE UPDATE ON public.schedule_calendars
  FOR EACH ROW EXECUTE FUNCTION public.touch_schedule_updated_at();

DROP TRIGGER IF EXISTS trg_schedule_activities_touch ON public.schedule_activities;
CREATE TRIGGER trg_schedule_activities_touch
  BEFORE UPDATE ON public.schedule_activities
  FOR EACH ROW EXECUTE FUNCTION public.touch_schedule_updated_at();

-- =============================================================================
-- 8. RLS
-- =============================================================================

ALTER TABLE public.schedule_calendars               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_baselines               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_activities              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_activity_dependencies   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_activity_actuals        ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS schedule_calendars_org_select ON public.schedule_calendars;
CREATE POLICY schedule_calendars_org_select ON public.schedule_calendars
  FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS schedule_calendars_org_write ON public.schedule_calendars;
CREATE POLICY schedule_calendars_org_write ON public.schedule_calendars
  FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

DROP POLICY IF EXISTS schedule_baselines_org_select ON public.schedule_baselines;
CREATE POLICY schedule_baselines_org_select ON public.schedule_baselines
  FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS schedule_baselines_org_write ON public.schedule_baselines;
CREATE POLICY schedule_baselines_org_write ON public.schedule_baselines
  FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

DROP POLICY IF EXISTS schedule_activities_org_select ON public.schedule_activities;
CREATE POLICY schedule_activities_org_select ON public.schedule_activities
  FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS schedule_activities_org_write ON public.schedule_activities;
CREATE POLICY schedule_activities_org_write ON public.schedule_activities
  FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

DROP POLICY IF EXISTS schedule_deps_org_select ON public.schedule_activity_dependencies;
CREATE POLICY schedule_deps_org_select ON public.schedule_activity_dependencies
  FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS schedule_deps_org_write ON public.schedule_activity_dependencies;
CREATE POLICY schedule_deps_org_write ON public.schedule_activity_dependencies
  FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

DROP POLICY IF EXISTS schedule_actuals_org_select ON public.schedule_activity_actuals;
CREATE POLICY schedule_actuals_org_select ON public.schedule_activity_actuals
  FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS schedule_actuals_org_write ON public.schedule_activity_actuals;
CREATE POLICY schedule_actuals_org_write ON public.schedule_activity_actuals
  FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

COMMIT;
