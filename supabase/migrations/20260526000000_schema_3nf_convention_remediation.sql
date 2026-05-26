-- =============================================================================
-- Schema 3NF + convention remediation (2026-05-26)
-- =============================================================================
-- 1. account_manager_assignments — add missing updated_at + trigger
-- 2. time_off_balances — add missing created_at + convert balance_hours to a
--    GENERATED ALWAYS AS column (3NF: balance = accrued - used, transitive dep)
-- 3. approve_time_off_request RPC — remove explicit balance_hours update, rely
--    on the generated column
-- 4. Drop deprecated tables: financial_periods + period_state_transitions
--    (flagged DEPRECATED in 0060; 0 app refs confirmed)
-- =============================================================================

-- ─── 1. account_manager_assignments ─────────────────────────────────────────

ALTER TABLE "public"."account_manager_assignments"
  ADD COLUMN IF NOT EXISTS "updated_at" timestamptz NOT NULL DEFAULT now();

-- Backfill: set updated_at = created_at for existing rows
UPDATE "public"."account_manager_assignments"
  SET "updated_at" = "created_at"
  WHERE "updated_at" = now() AND "created_at" < now() - interval '1 second';

CREATE OR REPLACE TRIGGER tg_account_manager_assignments_updated_at
  BEFORE UPDATE ON "public"."account_manager_assignments"
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ─── 2. time_off_balances — add created_at ───────────────────────────────────

ALTER TABLE "public"."time_off_balances"
  ADD COLUMN IF NOT EXISTS "created_at" timestamptz NOT NULL DEFAULT now();

UPDATE "public"."time_off_balances"
  SET "created_at" = "updated_at"
  WHERE "created_at" = now() AND "updated_at" < now() - interval '1 second';

-- ─── 3. time_off_balances — convert balance_hours to generated column ────────
--
-- balance_hours is a transitive dependency: it is always accrued_ytd_hours
-- minus used_ytd_hours. Storing it as a regular column violates 3NF because
-- any direct UPDATE to balance_hours (without touching the component columns)
-- silently breaks the invariant. A GENERATED ALWAYS AS column enforces it.

-- Must drop column then recreate as generated (ALTER COLUMN … GENERATED is
-- not supported in PostgreSQL <17).
ALTER TABLE "public"."time_off_balances"
  DROP COLUMN IF EXISTS "balance_hours";

ALTER TABLE "public"."time_off_balances"
  ADD COLUMN "balance_hours" numeric(8,2)
    GENERATED ALWAYS AS (accrued_ytd_hours - used_ytd_hours) STORED;

-- ─── 4. Update approve_time_off_request RPC ───────────────────────────────────
--
-- Remove the explicit balance_hours write; the generated column computes it
-- from used_ytd_hours (which we still update explicitly).

CREATE OR REPLACE FUNCTION public.approve_time_off_request(
  p_request_id uuid,
  p_decider_id uuid,
  p_decision_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  v_req  record;
  v_year integer;
BEGIN
  SELECT r.*, pol.org_id AS org_id
  INTO v_req
  FROM public.time_off_requests r
  JOIN public.time_off_policies pol ON pol.id = r.policy_id
  WHERE r.id = p_request_id
    AND r.request_state = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or not pending: %', p_request_id;
  END IF;

  IF NOT private.is_org_member(v_req.org_id) THEN
    RAISE EXCEPTION 'Not authorized for org: %', v_req.org_id;
  END IF;

  v_year := EXTRACT(YEAR FROM v_req.start_date)::integer;

  -- Increment used_ytd; balance_hours is now GENERATED (accrued - used).
  -- UPSERT creates the balance row on first approval of the year.
  INSERT INTO public.time_off_balances (org_id, user_id, policy_id, year, accrued_ytd_hours, used_ytd_hours)
  VALUES (v_req.org_id, v_req.user_id, v_req.policy_id, v_year, 0, v_req.hours_requested)
  ON CONFLICT (user_id, policy_id, year)
  DO UPDATE SET
    used_ytd_hours = public.time_off_balances.used_ytd_hours + v_req.hours_requested,
    updated_at = now();

  UPDATE public.time_off_requests
  SET request_state = 'approved',
      decided_by    = p_decider_id,
      decided_at    = now(),
      decision_note = p_decision_note
  WHERE id = p_request_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.approve_time_off_request(uuid, uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.approve_time_off_request(uuid, uuid, text) TO authenticated;

COMMENT ON FUNCTION public.approve_time_off_request(uuid, uuid, text) IS
  'SECURITY DEFINER approval gate for time-off requests. Increments used_ytd_hours; '
  'balance_hours is a GENERATED column (accrued_ytd_hours - used_ytd_hours). '
  'Revised 2026-05-26 to remove the now-redundant balance_hours write.';

-- ─── 5. Drop deprecated tables ────────────────────────────────────────────────
--
-- financial_periods and period_state_transitions were flagged DEPRECATED in
-- migration 0060. Zero app references confirmed. The canonical replacements
-- (accounting_periods, accounting_period_state_transitions) are in use.

DROP TABLE IF EXISTS "public"."period_state_transitions";
DROP TABLE IF EXISTS "public"."financial_periods";
