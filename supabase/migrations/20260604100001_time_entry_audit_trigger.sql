-- ============================================================
-- Time-Entry Audit Trigger (competitive: Connecteam timesheet audit logs)
-- ============================================================
-- Attaches the existing tg_audit_log function to time_entries so every
-- INSERT / UPDATE / DELETE is captured with before/after state in
-- audit_log. Enables the per-row audit trail UI shipped alongside this
-- migration.
-- ============================================================

-- Guard: only create if not already attached (idempotent re-run).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'audit_time_entries'
          AND tgrelid = 'public.time_entries'::regclass
    ) THEN
        CREATE TRIGGER "audit_time_entries"
            AFTER INSERT OR UPDATE OR DELETE ON "public"."time_entries"
            FOR EACH ROW EXECUTE FUNCTION "public"."tg_audit_log"();
    END IF;
END$$;

-- Expose a fast helper for the API: returns the full audit trail for
-- a single time-entry row ordered newest-first.
CREATE OR REPLACE FUNCTION "public"."time_entry_audit"(p_entry_id uuid, p_org_id uuid)
RETURNS TABLE (
    "id"          uuid,
    "action"      text,
    "operation"   text,
    "actor_email" text,
    "before"      jsonb,
    "after"       jsonb,
    "at"          timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        al.id,
        al.action,
        al.operation,
        al.actor_email,
        al.before,
        al.after,
        al.at
    FROM audit_log al
    WHERE al.target_table = 'time_entries'
      AND al.target_id    = p_entry_id
      AND al.org_id       = p_org_id
    ORDER BY al.at DESC
    LIMIT 200;
$$;

COMMENT ON FUNCTION "public"."time_entry_audit"(uuid, uuid)
    IS 'Returns the audit trail for a single time_entries row. Called by /api/v1/time-entries/[id]/audit.';
