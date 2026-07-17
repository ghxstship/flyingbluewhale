-- submit_timesheet — let a worker submit their own timesheet.
--
-- The timesheet lifecycle was unreachable from its own initial state. RLS on
-- `timesheets` is:
--
--   utt_ts_party_write  INSERT  party is mine
--   utt_ts_party        SELECT  org admin OR party is mine
--   utt_ts_admin_update UPDATE  owner/admin/manager ONLY
--
-- A worker can create a timesheet and read it back, and can never change it.
-- Submitting is `open → submitted`, which is an UPDATE, so the worker could
-- not submit. `SUBMITTABLE_STATES`, `canSubmit()` and the whole `open` branch
-- of the FSM in src/lib/db/timesheets.ts were consequently dead code — its own
-- docblock says so: "Until Phase 3 nothing submitted, which is what made the
-- lifecycle unreachable from its own initial state."
--
-- Why an RPC rather than widening the UPDATE policy to the party:
--
-- A per-party UPDATE policy CAN express the state move (USING sees the old
-- row, WITH CHECK the new one). What it cannot express is *which columns*
-- changed. The same UPDATE that flips state to 'submitted' could also rewrite
-- total_minutes, billable_minutes, or total_amount_minor — so "let workers
-- submit" would silently become "let workers write their own pay". Postgres
-- has no column-level predicate in a row policy, so the safe version is a
-- SECURITY DEFINER function that touches exactly one column.
--
-- Mirrors `approve_time_off_request`, the established shape for "a narrow,
-- attributable state flip the caller's RLS band cannot perform directly".

CREATE OR REPLACE FUNCTION "public"."submit_timesheet"("p_timesheet_id" "uuid")
RETURNS "public"."timesheets"
LANGUAGE "plpgsql"
SECURITY DEFINER
SET "search_path" = 'public', 'pg_temp'
AS $$
DECLARE
  v_row public.timesheets;
BEGIN
  -- Lock the row so two taps on a bad connection can't both pass the state
  -- check. The field is exactly where that happens.
  SELECT * INTO v_row
  FROM public.timesheets
  WHERE id = p_timesheet_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Timesheet not found' USING ERRCODE = 'no_data_found';
  END IF;

  -- Ownership. SECURITY DEFINER bypasses RLS, so this is the ONLY thing
  -- standing between a caller and someone else's timesheet — it is not a
  -- convenience check.
  IF NOT EXISTS (
    SELECT 1 FROM public.parties p
    WHERE p.id = v_row.party_id
      AND p.auth_user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'You can only submit your own timesheet' USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- SUBMITTABLE_STATES in src/lib/db/timesheets.ts. `rejected` is included on
  -- purpose: a rejected sheet the worker has since corrected must be
  -- re-submittable, or the rejection is a dead end for them.
  IF v_row.state NOT IN ('open', 'rejected') THEN
    RAISE EXCEPTION 'This timesheet is already %', v_row.state USING ERRCODE = 'check_violation';
  END IF;

  -- Exactly one column. The point of the whole function.
  UPDATE public.timesheets
  SET state = 'submitted'
  WHERE id = p_timesheet_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

ALTER FUNCTION "public"."submit_timesheet"("uuid") OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."submit_timesheet"("uuid") FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."submit_timesheet"("uuid") TO "authenticated";

COMMENT ON FUNCTION "public"."submit_timesheet"("uuid") IS
  'Worker-submits-own-timesheet (open|rejected → submitted). SECURITY DEFINER because utt_ts_admin_update reserves UPDATE for the manager band; a per-party UPDATE policy could not stop the same statement from also rewriting total_minutes. Touches state only.';
