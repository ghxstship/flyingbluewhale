-- scan_unknowns — give an unresolved scan somewhere to land.
--
-- Today a code that resolves against nothing vanishes. `scanAssignment()`
-- returns `{result:'not_found'}` and journals nothing, and it structurally
-- CANNOT journal: `assignment_events.assignment_id` is NOT NULL, so an
-- unknown code has no parent row to hang an event from. The result is that
-- the one question we most need answered — "what are people scanning that we
-- can't resolve?" — has no data behind it at all.
--
-- That gap blocks more than an audit trail. The product decision about
-- whether to license a commercial UPC database (see
-- docs/compvss/SCANNING_UNIVERSAL_CAPTURE_PLAN.md §2.4) can only be answered
-- with a real count of unresolved RETAIL codes. This table is the
-- measurement instrument: build it before buying the data.
--
-- Shape notes:
--   * `code` is stored as scanned (NOT normalized). A misread is data — the
--     whole point is to see what the field actually produces, including the
--     malformed. Normalization happens at read time.
--   * `seen_count` + `last_seen` make the miss list rankable: "scanned 40
--     times this week, still unknown" is a work item; a one-off typo is not.
--   * `resolved_at` closes the loop when someone adds the code to the
--     catalog, so the queue drains instead of growing forever.
--   * NO `status` column — LDP naming discipline. `resolved_at` is a
--     timestamp fact, not a lifecycle.

CREATE TABLE IF NOT EXISTS "public"."scan_unknowns" (
  "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
  "org_id" "uuid" NOT NULL,
  "code" "text" NOT NULL,
  "format" "text",
  "mode" "text",
  "seen_count" integer DEFAULT 1 NOT NULL,
  "first_seen" timestamp with time zone DEFAULT "now"() NOT NULL,
  "last_seen" timestamp with time zone DEFAULT "now"() NOT NULL,
  "last_actor_user_id" "uuid",
  "resolved_at" timestamp with time zone,
  "resolved_by" "uuid"
);

ALTER TABLE "public"."scan_unknowns" OWNER TO "postgres";

ALTER TABLE ONLY "public"."scan_unknowns"
  ADD CONSTRAINT "scan_unknowns_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."scan_unknowns"
  ADD CONSTRAINT "scan_unknowns_org_id_fkey"
  FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."scan_unknowns"
  ADD CONSTRAINT "scan_unknowns_last_actor_user_id_fkey"
  FOREIGN KEY ("last_actor_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."scan_unknowns"
  ADD CONSTRAINT "scan_unknowns_resolved_by_fkey"
  FOREIGN KEY ("resolved_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;

ALTER TABLE ONLY "public"."scan_unknowns"
  ADD CONSTRAINT "scan_unknowns_seen_count_check" CHECK ("seen_count" > 0);

-- One row per (org, code): the upsert target. A repeat scan increments
-- seen_count rather than inserting a duplicate, which is what makes the
-- queue rankable instead of a firehose.
CREATE UNIQUE INDEX IF NOT EXISTS "scan_unknowns_org_code_uniq"
  ON "public"."scan_unknowns" USING "btree" ("org_id", "code");

-- The console lens: open misses for an org, most-seen first.
CREATE INDEX IF NOT EXISTS "scan_unknowns_org_open_idx"
  ON "public"."scan_unknowns" USING "btree" ("org_id", "seen_count" DESC)
  WHERE "resolved_at" IS NULL;

CREATE INDEX IF NOT EXISTS "scan_unknowns_last_actor_idx"
  ON "public"."scan_unknowns" USING "btree" ("last_actor_user_id")
  WHERE "last_actor_user_id" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "scan_unknowns_resolved_by_idx"
  ON "public"."scan_unknowns" USING "btree" ("resolved_by")
  WHERE "resolved_by" IS NOT NULL;

COMMENT ON TABLE "public"."scan_unknowns" IS
  'Codes scanned that resolved against nothing. The miss queue + the measurement instrument for whether an external product database is worth licensing. Written by the /api/v1/scan resolver chain when every resolver misses; drained by manual catalog adds. See docs/compvss/SCANNING_UNIVERSAL_CAPTURE_PLAN.md §2.2/§2.6.';

COMMENT ON COLUMN "public"."scan_unknowns"."code" IS
  'The code exactly as scanned — deliberately NOT normalized. A misread is data: this table exists to show what the field actually produces.';

COMMENT ON COLUMN "public"."scan_unknowns"."seen_count" IS
  'Incremented by the upsert on every repeat miss. Ranks the queue: a code seen 40 times is a work item, a one-off is noise.';

-- RLS: org members read their org's misses; any member whose scan produced
-- the miss can write it (the resolver runs under the scanner's session, and
-- every scanner already holds check-in:write). Manager+ resolves them.
ALTER TABLE "public"."scan_unknowns" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scan_unknowns_select_org_member" ON "public"."scan_unknowns"
  FOR SELECT USING ("private"."is_org_member"("org_id"));

CREATE POLICY "scan_unknowns_insert_org_member" ON "public"."scan_unknowns"
  FOR INSERT WITH CHECK ("private"."is_org_member"("org_id"));

CREATE POLICY "scan_unknowns_update_org_member" ON "public"."scan_unknowns"
  FOR UPDATE USING ("private"."is_org_member"("org_id"))
  WITH CHECK ("private"."is_org_member"("org_id"));

-- Grants. NOTE THE REVOKES — they are load-bearing, not tidiness.
--
-- `ALTER DEFAULT PRIVILEGES` on schema public (pg_default_acl) grants EVERY
-- new table `anon=r` and `authenticated=arwd` at creation, before any explicit
-- GRANT here runs. So *omitting* a grant grants nothing away: a new table is
-- anon-readable by default. Verified on this table at creation —
-- has_table_privilege('anon', …, 'SELECT') was already true with no anon GRANT
-- written anywhere in this file.
--
-- RLS is the real control (is_org_member is false without a session, so anon
-- selects zero rows), but this table has no public surface, so the privilege
-- should not exist either — the 2026-06-25 advisor triage found a genuine anon
-- cross-tenant leak in this schema, and defence in depth is cheap here.
--
-- DELETE is revoked from authenticated on purpose: a miss is *resolved*
-- (resolved_at), never erased. The queue is an audit of what the field
-- actually scanned.
GRANT SELECT, INSERT, UPDATE ON TABLE "public"."scan_unknowns" TO "authenticated";
GRANT ALL ON TABLE "public"."scan_unknowns" TO "service_role";

REVOKE ALL ON TABLE "public"."scan_unknowns" FROM "anon";
REVOKE DELETE ON TABLE "public"."scan_unknowns" FROM "authenticated";
