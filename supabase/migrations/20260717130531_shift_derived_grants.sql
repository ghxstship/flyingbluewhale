-- Shift-derived capability grants — SCANNING_RBAC_BACKLOG P2.5, unblocked.
--
-- The capability-grants migration (20260715142506) recorded the intent on
-- role_capability_grants.shift_derivable but deliberately did not build the
-- resolver: at the time, 0 shifts carried a role and 0 carried a person, so
-- there was nothing to derive from. Phase C gave `shifts` a writer —
-- shifts.crew_member_id and shifts.role now carry real data (verified
-- end-to-end from the roster surfaces) — so this migration adds the third
-- UNION branch to effective_capabilities():
--
--   a crew member rostered on an ACTIVE shift derives the capabilities of the
--   ROLE THE SHIFT NAMES, for grant rows the org marked shift_derivable.
--
-- Semantics, each deliberate:
--   * The SHIFT's role, not the member's own crew_role_id. The member's own
--     role already resolves through branch 1; the point of shift derivation
--     is covering a role you don't normally hold ("Bob has the warehouse
--     tonight"). Roles resolve shift.role (free text) -> slugify_role() ->
--     crew_roles.slug, the same normalization the catalog backfill used.
--   * Active means starts_at <= now() < ends_at AND attendance is one of
--     scheduled / checked_in / on_break. A no_show derives nothing; a
--     checked_out worker's derivation ends when their shift does, even if the
--     scheduled window hasn't. Server now() only — a client clock never
--     decides whether a grant is live.
--   * Per-(role, capability) opt-in: only rows with shift_derivable = true
--     derive. The flag makes the SCHEDULER an authorization surface — whoever
--     can roster Bob onto a warehouse shift hands him that role's derivable
--     capabilities — which is the intended ergonomics for gear and stock.
--   * scan:credential is derivation-EXCLUDED, hard-coded, even if a grant row
--     is (mis)flagged shift_derivable. Gate access requires a deliberate,
--     attributable grant (user_capability_grants), never a rostering side
--     effect. TS mirror: SHIFT_DERIVATION_EXCLUDED in src/lib/rbac/
--     capabilities.ts; the grant admin action refuses to set the flag on an
--     excluded capability so a dead flag can't be configured.
--   * A separated crew member derives nothing (cm.separated_at IS NULL) — a
--     stale roster row must not outlive the person's engagement.
--
-- Branches 1 and 2 are reproduced verbatim from 20260715142553.

CREATE OR REPLACE FUNCTION "public"."effective_capabilities"("p_org_id" "uuid")
  RETURNS SETOF "text"
  LANGUAGE "sql"
  STABLE
  SECURITY DEFINER
  SET "search_path" = ''
  AS $$
  -- Role-derived: the crew member's catalogued role, and what it grants.
  SELECT rcg."capability"
  FROM "public"."crew_members" cm
  JOIN "public"."role_capability_grants" rcg
    ON rcg."crew_role_id" = cm."crew_role_id"
   AND rcg."org_id" = cm."org_id"
  WHERE cm."user_id" = "auth"."uid"()
    AND cm."org_id" = "p_org_id"
    AND cm."crew_role_id" IS NOT NULL

  UNION

  -- Individual, including the time-boxed cover-shift case. NULL bounds mean
  -- "no bound": valid_from NULL = already live, valid_until NULL = indefinite.
  SELECT ucg."capability"
  FROM "public"."user_capability_grants" ucg
  WHERE ucg."user_id" = "auth"."uid"()
    AND ucg."org_id" = "p_org_id"
    AND ucg."revoked_at" IS NULL
    AND (ucg."valid_from" IS NULL OR ucg."valid_from" <= "now"())
    AND (ucg."valid_until" IS NULL OR ucg."valid_until" > "now"())

  UNION

  -- Shift-derived: rostered on an active shift, the shift's role confers its
  -- shift_derivable grants for the duration. scan:credential never derives.
  SELECT rcg."capability"
  FROM "public"."crew_members" cm
  JOIN "public"."shifts" s
    ON s."crew_member_id" = cm."id"
   AND s."org_id" = cm."org_id"
  JOIN "public"."crew_roles" cr
    ON cr."org_id" = s."org_id"
   AND cr."slug" = "public"."slugify_role"(s."role")
   AND cr."deleted_at" IS NULL
  JOIN "public"."role_capability_grants" rcg
    ON rcg."crew_role_id" = cr."id"
   AND rcg."org_id" = s."org_id"
  WHERE cm."user_id" = "auth"."uid"()
    AND cm."org_id" = "p_org_id"
    AND cm."separated_at" IS NULL
    AND s."role" IS NOT NULL
    AND s."starts_at" <= "now"()
    AND s."ends_at" > "now"()
    AND s."attendance" IN ('scheduled', 'checked_in', 'on_break')
    AND rcg."shift_derivable" = true
    -- Derivation exclusion, defense in depth: honored even if a grant row is
    -- flagged shift_derivable. Mirror of SHIFT_DERIVATION_EXCLUDED (TS).
    AND rcg."capability" <> 'scan:credential';
$$;

ALTER FUNCTION "public"."effective_capabilities"("uuid") OWNER TO "postgres";

COMMENT ON FUNCTION "public"."effective_capabilities"("uuid") IS
  'Data-sourced capability grants (role + individual + shift-derived, time-boxed) for auth.uid() in an org. SECURITY DEFINER but takes no user_id — it can only answer for the caller, so it is not an enumeration primitive. Shift derivation honors role_capability_grants.shift_derivable per row and hard-excludes scan:credential.';

GRANT EXECUTE ON FUNCTION "public"."effective_capabilities"("uuid") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."effective_capabilities"("uuid") TO "service_role";
REVOKE EXECUTE ON FUNCTION "public"."effective_capabilities"("uuid") FROM "anon";

-- The shift-derivation lookup: "this person, live shifts, right now". Partial
-- on the columns the branch filters; starts_at/ends_at stay in the index so
-- the window test is index-only for the common no-active-shift case.
CREATE INDEX IF NOT EXISTS "shifts_crew_member_window_idx"
  ON "public"."shifts" ("crew_member_id", "starts_at", "ends_at")
  WHERE "crew_member_id" IS NOT NULL AND "role" IS NOT NULL;
