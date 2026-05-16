-- Clock Alert Settings: per-org grace period configuration for late clock-out detection.
-- Competitive parity: Connecteam "Need to clock out" + "Late clock out" widgets (2026).
--
-- When a crew member has an open time_entry (ended_at IS NULL) that has been
-- running longer than the org's grace period, they appear in the console
-- "Needs Clock-Out" alert widget and receive a push notification.
--
-- Also adds `alert_grace_minutes` to time_clock_zones for zone-level overrides.

-- ============================================================
-- 1. Per-org clock alert settings
-- ============================================================
CREATE TABLE IF NOT EXISTS "public"."clock_alert_settings" (
    "id"             uuid        DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "org_id"         uuid        NOT NULL UNIQUE REFERENCES public.orgs(id) ON DELETE CASCADE,
    "grace_minutes"  integer     NOT NULL DEFAULT 30 CHECK (grace_minutes >= 5),
    "enabled"        boolean     NOT NULL DEFAULT true,
    "created_at"     timestamptz NOT NULL DEFAULT now(),
    "updated_at"     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "public"."clock_alert_settings" OWNER TO "postgres";

COMMENT ON TABLE "public"."clock_alert_settings" IS
  'Per-org grace period for late clock-out detection. Competitive parity: Connecteam "Need to clock out" widget.';
COMMENT ON COLUMN "public"."clock_alert_settings"."grace_minutes" IS
  'Minutes after shift end (or after clock-in) before an overdue alert fires. Min 5.';

-- ============================================================
-- 2. Zone-level grace override on time_clock_zones
-- ============================================================
ALTER TABLE "public"."time_clock_zones"
    ADD COLUMN IF NOT EXISTS "alert_grace_minutes" integer
        CHECK (alert_grace_minutes IS NULL OR alert_grace_minutes >= 5);

COMMENT ON COLUMN "public"."time_clock_zones"."alert_grace_minutes" IS
  'Zone-level override for clock-alert grace. NULL = use org default from clock_alert_settings.';

-- ============================================================
-- 3. RLS
-- ============================================================
ALTER TABLE "public"."clock_alert_settings" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clock_alert_settings_org_member_select" ON "public"."clock_alert_settings"
    FOR SELECT TO authenticated
    USING (private.is_org_member(org_id));

CREATE POLICY "clock_alert_settings_admin_all" ON "public"."clock_alert_settings"
    FOR ALL TO authenticated
    USING (private.has_org_role(org_id, ARRAY['owner','admin']))
    WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin']));

-- ============================================================
-- 4. get_overdue_clock_ins(org_id) — used by the console widget and
--    the automation cron at /api/v1/internal/automations/clock-alerts.
--    Returns open time_entries older than the org's grace period.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_overdue_clock_ins(p_org_id uuid)
RETURNS TABLE(
    entry_id      uuid,
    user_id       uuid,
    started_at    timestamptz,
    hours_elapsed numeric
) LANGUAGE sql SECURITY DEFINER
SET search_path = public, private AS $$
    SELECT
        te.id                                                             AS entry_id,
        te.user_id,
        te.started_at,
        ROUND(EXTRACT(EPOCH FROM (now() - te.started_at)) / 3600.0, 1)   AS hours_elapsed
    FROM public.time_entries te
    JOIN public.clock_alert_settings cas
         ON cas.org_id = p_org_id AND cas.enabled = true
    WHERE te.org_id    = p_org_id
      AND te.ended_at  IS NULL
      AND te.started_at < now() - (COALESCE(cas.grace_minutes, 30) || ' minutes')::interval
    ORDER BY te.started_at;
$$;

GRANT EXECUTE ON FUNCTION public.get_overdue_clock_ins(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_overdue_clock_ins(uuid) IS
  'Returns open time_entries older than the org grace period. Used by the console Clock-Alert widget and the automation cron.';

-- ============================================================
-- 5. updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.tg_clock_alert_settings_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER clock_alert_settings_updated_at
    BEFORE UPDATE ON public.clock_alert_settings
    FOR EACH ROW EXECUTE FUNCTION public.tg_clock_alert_settings_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
