-- Competitive parity: GPS breadcrumbs, pre-clockout task gates,
-- ops-alert rule engine, and pipeline kanban support.

-- ─── 1. GPS breadcrumb trail on time_entries ──────────────────────────────
ALTER TABLE public.time_entries
  ADD COLUMN IF NOT EXISTS location_trail jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.time_entries.location_trail IS
  'Ordered array of GPS breadcrumb samples captured ~every 5 minutes during an active shift. '
  'Each element: {lat:number, lng:number, accuracy:number|null, ts:ISO8601}.';

-- ─── 2. Mandatory pre-clockout task flag ──────────────────────────────────
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS required_before_clockout boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.tasks.required_before_clockout IS
  'When true, the assigned user must complete this task (status=done) before they can clock out.';

-- ─── 3. Operational alert rule engine ─────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ops_alert_severity') THEN
    CREATE TYPE public.ops_alert_severity AS ENUM ('info', 'warning', 'critical');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.ops_alert_rules (
  id            uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id        uuid        NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  name          text        NOT NULL,
  description   text,
  rule_kind     text        NOT NULL,
  severity      public.ops_alert_severity NOT NULL DEFAULT 'warning',
  config        jsonb       NOT NULL DEFAULT '{}'::jsonb,
  enabled       boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ops_alert_rules IS
  'Named rules evaluated by the ops-alert engine. rule_kind ∈ '
  '(crew_gap | budget_overrun | overdue_deliverable | task_overdue | equipment_conflict | low_inventory).';

CREATE TABLE IF NOT EXISTS public.ops_alerts (
  id                uuid                      NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id            uuid                      NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  rule_id           uuid                      REFERENCES public.ops_alert_rules(id) ON DELETE SET NULL,
  rule_kind         text                      NOT NULL,
  severity          public.ops_alert_severity NOT NULL DEFAULT 'warning',
  title             text                      NOT NULL,
  body              text                      NOT NULL,
  entity_type       text,
  entity_id         uuid,
  context           jsonb                     NOT NULL DEFAULT '{}'::jsonb,
  fired_at          timestamptz               NOT NULL DEFAULT now(),
  acknowledged_at   timestamptz,
  acknowledged_by   uuid                      REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at       timestamptz,
  created_at        timestamptz               NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ops_alerts IS
  'Fired instances of ops_alert_rules. resolved_at IS NULL = open; '
  'acknowledged_at IS NULL = unread.';

-- RLS
ALTER TABLE public.ops_alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_alerts      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ops_alert_rules_org_member" ON public.ops_alert_rules
  FOR ALL USING (private.is_org_member(org_id));

CREATE POLICY "ops_alerts_org_member" ON public.ops_alerts
  FOR ALL USING (private.is_org_member(org_id));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ops_alert_rules_org_id ON public.ops_alert_rules(org_id);
CREATE INDEX IF NOT EXISTS idx_ops_alerts_org_id       ON public.ops_alerts(org_id);
CREATE INDEX IF NOT EXISTS idx_ops_alerts_fired_at     ON public.ops_alerts(fired_at DESC);
CREATE INDEX IF NOT EXISTS idx_ops_alerts_open         ON public.ops_alerts(org_id, fired_at DESC)
  WHERE resolved_at IS NULL;

-- updated_at trigger for rules
CREATE OR REPLACE TRIGGER tg_ops_alert_rules_updated_at
  BEFORE UPDATE ON public.ops_alert_rules
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ─── 4. GPS breadcrumb append helper ──────────────────────────────────────
-- Appends a single JSON object to time_entries.location_trail without a
-- full read-modify-write cycle. Called from appendBreadcrumbAction every
-- ~5 minutes during an active shift.
CREATE OR REPLACE FUNCTION public.append_time_entry_breadcrumb(
  p_entry_id uuid,
  p_org_id   uuid,
  p_user_id  uuid,
  p_crumb    jsonb
) RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  UPDATE public.time_entries
  SET    location_trail = location_trail || jsonb_build_array(p_crumb)
  WHERE  id      = p_entry_id
    AND  org_id  = p_org_id
    AND  user_id = p_user_id
    AND  ended_at IS NULL;
$$;

COMMENT ON FUNCTION public.append_time_entry_breadcrumb IS
  'Atomically appends a GPS breadcrumb to an open shift. SECURITY INVOKER — '
  'caller must be the entry owner (enforced by the WHERE clause). '
  'No-ops on closed shifts.';

GRANT EXECUTE ON FUNCTION public.append_time_entry_breadcrumb TO authenticated;
