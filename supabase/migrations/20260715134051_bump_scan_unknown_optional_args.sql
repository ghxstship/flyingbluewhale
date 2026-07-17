-- Make the genuinely-optional params optional in the signature.
-- A miss may be typed (no format) or arrive from a client that predates the
-- format field, so p_format/p_mode/p_actor are all legitimately absent. Adding
-- DEFAULT NULL is also what makes the generated TS Args mark them `?:`
-- (cf. approve_time_off_request.p_decision_note) instead of forcing callers to
-- cast a null through a non-nullable `string`.

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
        "format" = COALESCE("public"."scan_unknowns"."format", "p_format"),
        "mode" = COALESCE("public"."scan_unknowns"."mode", "p_mode");
$$;
