-- effective_capabilities(org) — the union of every DATA-sourced grant for the
-- CALLING user in one round trip. The static base (auth.ts) layers on top.
--
-- Takes no user_id ON PURPOSE: it reads auth.uid() internally, so it is not an
-- enumeration primitive — a caller can only ask about themselves. That is what
-- makes SECURITY DEFINER safe here; it must read crew_members and the grant
-- tables regardless of the caller's row visibility, but can never answer for
-- anybody else.
--
-- Time-boxing is evaluated against server now(). A client clock must never
-- decide whether a grant is live.

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
    AND (ucg."valid_until" IS NULL OR ucg."valid_until" > "now"());
$$;

ALTER FUNCTION "public"."effective_capabilities"("uuid") OWNER TO "postgres";

COMMENT ON FUNCTION "public"."effective_capabilities"("uuid") IS
  'Data-sourced capability grants (role + individual, time-boxed) for auth.uid() in an org. SECURITY DEFINER but takes no user_id — it can only answer for the caller, so it is not an enumeration primitive.';

GRANT EXECUTE ON FUNCTION "public"."effective_capabilities"("uuid") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."effective_capabilities"("uuid") TO "service_role";
REVOKE EXECUTE ON FUNCTION "public"."effective_capabilities"("uuid") FROM "anon";
