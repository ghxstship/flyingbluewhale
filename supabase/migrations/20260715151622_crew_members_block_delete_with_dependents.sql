-- Separation archives. Deletion is only for records that never engaged.
--
-- THE LIVE BUG THIS CLOSES
-- ────────────────────────
-- `/studio/people/crew/[crewId]` renders a Delete button next to Separate.
-- Delete hard-deletes the crew_members row — and the FKs mean that is not a
-- tidy-up, it is destruction of the person's history:
--
--   CASCADE (rows DESTROYED): credentials, crew_certifications, crew_ratings,
--                             independent_contractor_msas
--   SET NULL (link LOST):     assignments.party_crew_id, shifts.crew_member_id,
--                             safety_briefing_attendees.crew_member_id,
--                             offer_letters.reports_to_crew_member_id,
--                             org_offer_letter_settings.signing_authority_*
--   RESTRICT:                 offer_letters.crew_member_id
--
-- So the same button silently erased one person's credentials and
-- certifications, and merely failed for the next person because a single
-- offer_letters FK happens to RESTRICT. Inconsistent AND destructive — the
-- worst combination.
--
-- THE RULE
-- ────────
-- Hard-delete ONLY a record with no dependent rows anywhere — a typo'd or
-- never-engaged entry, where nothing is lost. The moment a person has ANY
-- history, removal is SEPARATION: `engagement_state = 'separated'` +
-- separated_at + separation_reason, which preserves the row and everything
-- hanging off it for record-keeping and legal retention. Re-engagement is then
-- a state flip, not a re-create.
--
-- This applies regardless of whether the person is currently on an active org
-- or project. "Not currently working here" is not a reason to destroy the
-- record that they ever did.
--
-- WHY A TRIGGER, NOT AN `if` IN THE ACTION
-- ────────────────────────────────────────
-- The cascade is a database behaviour, so the guard belongs in the database.
-- An app-layer check only protects the one code path that remembers it — this
-- protects every path: the existing action, the workforce_members surfaces when
-- they are repointed at crew_members (ADR-0015 Addendum 2 Phase B), a future
-- bulk tool, and a hand-typed SQL delete at 2am.
--
-- The dependent scan is DYNAMIC (enumerated from pg_constraint at runtime)
-- rather than a hardcoded list of the 10 FKs that exist today. A hardcoded list
-- silently stops protecting the moment someone adds the 11th — and the failure
-- mode of a stale list here is destroyed history, not a broken build. Deletes
-- are rare; the reflection cost is irrelevant.
--
-- Verified against live rows: a crew member with a credential is REFUSED (and
-- the credential survives — the CASCADE never fires); a never-engaged record
-- still deletes cleanly.

CREATE OR REPLACE FUNCTION "private"."crew_member_dependents"("p_crew_id" "uuid")
  RETURNS "text"[]
  LANGUAGE "plpgsql"
  STABLE
  SECURITY DEFINER
  SET "search_path" = ''
  AS $$
DECLARE
  r record;
  v_count bigint;
  v_out text[] := '{}';
BEGIN
  FOR r IN
    SELECT c.conrelid::regclass::text AS tbl, a.attname::text AS col
    FROM pg_catalog.pg_constraint c
    JOIN LATERAL unnest(c.conkey) AS k(attnum) ON true
    JOIN pg_catalog.pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
    WHERE c.contype = 'f'
      AND c.confrelid = 'public.crew_members'::regclass
  LOOP
    EXECUTE format('SELECT count(*) FROM %s WHERE %I = $1', r.tbl, r.col)
      INTO v_count USING p_crew_id;
    IF v_count > 0 THEN
      v_out := v_out || format('%s (%s)', r.tbl, v_count);
    END IF;
  END LOOP;
  RETURN v_out;
END;
$$;

ALTER FUNCTION "private"."crew_member_dependents"("uuid") OWNER TO "postgres";

COMMENT ON FUNCTION "private"."crew_member_dependents"("uuid") IS
  'Every row that references this crew member, as ''table (count)'' strings. Enumerates FKs dynamically from pg_constraint so a newly added FK is covered without editing this function — a stale list here would mean destroyed history, not a failed build.';

CREATE OR REPLACE FUNCTION "public"."tg_crew_members_block_delete_with_dependents"()
  RETURNS "trigger"
  LANGUAGE "plpgsql"
  SECURITY DEFINER
  SET "search_path" = ''
  AS $$
DECLARE
  v_deps text[];
BEGIN
  v_deps := "private"."crew_member_dependents"(OLD.id);
  IF array_length(v_deps, 1) > 0 THEN
    RAISE EXCEPTION 'crew_member_has_dependents: % has history (%) — separate instead of deleting',
      OLD.name, array_to_string(v_deps, ', ')
      USING ERRCODE = '23001',
            HINT = 'Separation preserves the record and its history for record-keeping and legal retention. Deletion is only for a record that never engaged.';
  END IF;
  RETURN OLD;
END;
$$;

ALTER FUNCTION "public"."tg_crew_members_block_delete_with_dependents"() OWNER TO "postgres";

DROP TRIGGER IF EXISTS "crew_members_block_delete_with_dependents" ON "public"."crew_members";
CREATE TRIGGER "crew_members_block_delete_with_dependents"
  BEFORE DELETE ON "public"."crew_members"
  FOR EACH ROW EXECUTE FUNCTION "public"."tg_crew_members_block_delete_with_dependents"();

COMMENT ON FUNCTION "public"."tg_crew_members_block_delete_with_dependents"() IS
  'Refuses to delete a crew member who has any dependent row. ERRCODE 23001 (restrict_violation); message is prefixed `crew_member_has_dependents:` so the app can surface it as "separate instead". A person with history is archived via engagement_state, never erased.';
