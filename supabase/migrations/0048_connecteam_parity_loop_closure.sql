-- Connecteam parity — loop-closure migrations that tie the canonical
-- tables added in 0046/0047 to the workflow side-effects users expect:
--
--   1. courses.completion_badge_id — optional badge auto-awarded when an
--      assignee passes the course quiz. Closes the recognition loop so
--      "Pass Site Safety 101 → earn the Safety Badge" works end-to-end.
--
--   2. announcement_reads → trigger that maintains a denormalised
--      `read_count` on announcements. The admin detail view was running
--      a count(*) on every render; a column makes the list scan cheap
--      and surfaces unread-vs-read tallies in a single query.
--
--   3. time_off_balances reconciliation helper. When an admin approves a
--      time_off_request, we want `used_ytd_hours` to increment and
--      `balance_hours` to decrement atomically. We add a SECURITY DEFINER
--      function callable from the approval action so the bookkeeping
--      survives RLS without needing a service_role round-trip.

-- ============================================================
-- 1. courses.completion_badge_id
-- ============================================================

ALTER TABLE "public"."courses"
    ADD COLUMN IF NOT EXISTS "completion_badge_id" uuid REFERENCES "public"."badges"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_courses_completion_badge_id ON "public"."courses"(completion_badge_id) WHERE completion_badge_id IS NOT NULL;

COMMENT ON COLUMN "public"."courses"."completion_badge_id" IS
  'Optional badge to award when the assignee passes the course quiz. Wired in src/app/(mobile)/m/learning/actions.ts (submitQuiz).';

-- ============================================================
-- 2. announcements.read_count + trigger
-- ============================================================

ALTER TABLE "public"."announcements"
    ADD COLUMN IF NOT EXISTS "read_count" integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.tg_bump_announcement_read_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.announcements SET read_count = read_count + 1 WHERE id = NEW.announcement_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.announcements SET read_count = GREATEST(read_count - 1, 0) WHERE id = OLD.announcement_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER announcement_reads_bump_count
    AFTER INSERT OR DELETE ON public.announcement_reads
    FOR EACH ROW EXECUTE FUNCTION public.tg_bump_announcement_read_count();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Backfill read_count for existing rows.
UPDATE public.announcements a
SET read_count = COALESCE(c.cnt, 0)
FROM (
  SELECT announcement_id, count(*) AS cnt
  FROM public.announcement_reads
  GROUP BY announcement_id
) c
WHERE c.announcement_id = a.id AND a.read_count <> c.cnt;

-- ============================================================
-- 3. time_off approval reconciliation
-- ============================================================

CREATE OR REPLACE FUNCTION public.approve_time_off_request(p_request_id uuid, p_decider_id uuid, p_decision_note text DEFAULT NULL)
RETURNS public.time_off_requests
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_req public.time_off_requests%ROWTYPE;
  v_year int;
BEGIN
  -- Caller must be a member of the request's org. We re-check rather
  -- than rely on RLS because SECURITY DEFINER bypasses it.
  SELECT * INTO v_req FROM public.time_off_requests WHERE id = p_request_id AND request_state = 'pending';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'time_off_request % not pending or not found', p_request_id;
  END IF;
  IF NOT private.is_org_member(v_req.org_id) THEN
    RAISE EXCEPTION 'caller not a member of org %', v_req.org_id;
  END IF;

  v_year := EXTRACT(YEAR FROM v_req.starts_on)::int;

  -- Decrement balance + bump used_ytd. Use UPSERT so first-approval-of-year
  -- creates the balance row if it didn't exist.
  INSERT INTO public.time_off_balances (org_id, user_id, policy_id, year, balance_hours, accrued_ytd_hours, used_ytd_hours)
  VALUES (v_req.org_id, v_req.user_id, v_req.policy_id, v_year, -v_req.hours_requested, 0, v_req.hours_requested)
  ON CONFLICT (user_id, policy_id, year)
  DO UPDATE SET
    balance_hours = public.time_off_balances.balance_hours - v_req.hours_requested,
    used_ytd_hours = public.time_off_balances.used_ytd_hours + v_req.hours_requested,
    updated_at = now();

  UPDATE public.time_off_requests
  SET request_state = 'approved',
      decided_by = p_decider_id,
      decided_at = now(),
      decision_note = p_decision_note
  WHERE id = p_request_id AND request_state = 'pending'
  RETURNING * INTO v_req;

  RETURN v_req;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.approve_time_off_request(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_time_off_request(uuid, uuid, text) TO authenticated;

COMMENT ON FUNCTION public.approve_time_off_request(uuid, uuid, text) IS
  'Approve a pending time_off_request + decrement the matching balance. Called from console/workforce/time-off/actions.ts. SECURITY DEFINER but checks private.is_org_member before mutating.';
