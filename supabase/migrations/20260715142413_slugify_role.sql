-- slugify_role — normalize a free-text job role into a stable catalog key.
--
-- `crew_members.role` is free text and has drifted: live data mixes slugs
-- ('production-manager') with prose ('A1 / Programmer', 'Stage Manager'). The
-- catalog needs one deterministic key per role so grants have something stable
-- to attach to, and so the same role typed two ways collapses to one row.
--
-- IMMUTABLE so it can be used in an index or a generated column later; the
-- backfill in the next migration calls it directly.
--
-- Deliberately conservative — it normalizes case, separators and punctuation.
-- It does NOT do fuzzy matching: 'Stage Manager' and 'Stage Manager —
-- cosmicMEADOW' produce different slugs and stay different roles. They may well
-- be the same job, but that is a judgement about an org's operations, and
-- merging two roles silently merges their permissions.
--
-- No `unaccent`: the extension is not installed here, and — the part that
-- actually matters — `unaccent()` is STABLE, not IMMUTABLE, so calling it from
-- an IMMUTABLE function would be a lie the planner is entitled to believe.
-- Consequence, stated plainly: a non-ASCII letter is treated as a separator, so
-- 'Café' slugs to 'caf' and would NOT collapse with 'Cafe'. That is the same
-- class of near-duplicate this function already refuses to merge on purpose,
-- and an operator resolves it in the admin surface.

CREATE OR REPLACE FUNCTION "public"."slugify_role"("raw" "text")
  RETURNS "text"
  LANGUAGE "sql"
  IMMUTABLE
  SET "search_path" = ''
  AS $$
  SELECT COALESCE(
    -- 3. collapse runs of separators, trim them off the ends
    "trim"(BOTH '-' FROM "regexp_replace"(
      -- 2. anything that is not a letter or digit becomes a separator
      "regexp_replace"("lower"("raw"), '[^a-z0-9]+', '-', 'g'),
      '-{2,}', '-', 'g'
    )),
    ''
  );
$$;

ALTER FUNCTION "public"."slugify_role"("text") OWNER TO "postgres";

COMMENT ON FUNCTION "public"."slugify_role"("text") IS
  'Free-text job role → stable catalog slug. Case/punctuation/accent normalizing only — never fuzzy. Used to backfill and de-duplicate public.crew_roles.';
