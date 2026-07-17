-- bump_scan_unknown — atomic upsert-or-increment for the miss queue.
--
-- The increment is why this is an RPC and not a PostgREST upsert: recording a
-- repeat miss means `seen_count = seen_count + 1`, which needs
-- `ON CONFLICT DO UPDATE SET ... = <table>.<col> + 1`. PostgREST's upsert can
-- only overwrite with the values you send, so doing this client-side would
-- need a read-then-write — racy under exactly the condition this table exists
-- to measure (a gate scanning the same unknown code repeatedly, fast).
--
-- p_format/p_mode/p_actor take DEFAULT NULL because they are genuinely
-- optional (a typed miss has no symbology; an older client sends no format) —
-- and because a defaulted arg is what makes the generated TS Args mark them
-- `?:` rather than forcing callers to cast null through a non-nullable string
-- (cf. approve_time_off_request.p_decision_note).
--
-- SECURITY INVOKER on purpose: RLS still applies, so a caller can only bump a
-- miss for an org they belong to. There is nothing here that needs to bypass
-- the row policies, and a SECURITY DEFINER function that writes an org-scoped
-- row from a user-supplied org_id would be a cross-tenant write primitive.

CREATE OR REPLACE FUNCTION "public"."bump_scan_unknown"(
  "p_org_id" "uuid",
  "p_code" "text",
  "p_format" "text" DEFAULT NULL,
  "p_mode" "text" DEFAULT NULL,
  "p_actor" "uuid" DEFAULT NULL
) RETURNS void
  LANGUAGE "sql"
  SECURITY INVOKER
  SET "search_path" = ''
  AS $$
  INSERT INTO "public"."scan_unknowns" ("org_id", "code", "format", "mode", "last_actor_user_id")
  VALUES ("p_org_id", "p_code", "p_format", "p_mode", "p_actor")
  ON CONFLICT ("org_id", "code") DO UPDATE
    SET "seen_count" = "public"."scan_unknowns"."seen_count" + 1,
        "last_seen" = "now"(),
        "last_actor_user_id" = "p_actor",
        -- Late-arriving detail: an early miss may have been typed (no format);
        -- keep the first non-null we learn rather than clobbering with null.
        "format" = COALESCE("public"."scan_unknowns"."format", "p_format"),
        "mode" = COALESCE("public"."scan_unknowns"."mode", "p_mode");
$$;

ALTER FUNCTION "public"."bump_scan_unknown"("uuid", "text", "text", "text", "uuid") OWNER TO "postgres";

COMMENT ON FUNCTION "public"."bump_scan_unknown"("uuid", "text", "text", "text", "uuid") IS
  'Atomic upsert-or-increment for public.scan_unknowns. SECURITY INVOKER — RLS governs which org a caller may write. Called by the /api/v1/scan resolver chain when every resolver misses.';

GRANT EXECUTE ON FUNCTION "public"."bump_scan_unknown"("uuid", "text", "text", "text", "uuid") TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."bump_scan_unknown"("uuid", "text", "text", "text", "uuid") TO "service_role";
REVOKE EXECUTE ON FUNCTION "public"."bump_scan_unknown"("uuid", "text", "text", "text", "uuid") FROM "anon";
