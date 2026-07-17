-- Spaces & Clubs + Knowledge — the stores behind kit 28's two remaining
-- More-hub surfaces (/m/spaces, /m/docs).
--
-- SPACES ride the existing chat stores rather than a parallel table: a space
-- IS a room with a kind facet (Team / Trade / Location / Club) and an about
-- blurb. Two RLS consequences, both deliberate:
--
--   * `chat_rooms_select` was member-or-creator only. Right for DMs and
--     channels — an unjoined space would be INVISIBLE, so nobody could ever
--     browse the directory to join one. Spaces are org-browsable; their
--     CONTENT stays member-gated (chat_messages RLS is unchanged).
--   * `chat_room_members_insert` was creator-or-admin only. Right for DMs —
--     you cannot add yourself to someone's DM — but join/leave is the whole
--     point of a club. Self-join is allowed for space rooms only.
--
-- Policies are ALTERed, not dropped and recreated: a DROP/CREATE silently
-- discards whatever a parallel migration added to the policy — that exact
-- mistake took out /m/market's photo uploads earlier this cycle.
--
-- KNOWLEDGE reads `sops` (document-backing store, 20260615215535). The kit's
-- library needs a category filter and a must-read flag, and acknowledgement
-- needs a store — `sop_acknowledgements`, append-only, one row per (sop,
-- user). `_kind`-style facet naming per LDP: `category` and `must_read` are
-- facets, not lifecycles; the lifecycle stays `sop_state`.

-- ── Spaces ────────────────────────────────────────────────────────────────
ALTER TABLE "public"."chat_rooms" DROP CONSTRAINT IF EXISTS "chat_rooms_room_kind_check";
ALTER TABLE "public"."chat_rooms"
  ADD CONSTRAINT "chat_rooms_room_kind_check"
  CHECK ("room_kind" = ANY (ARRAY['direct'::"text", 'group'::"text", 'channel'::"text", 'space'::"text"]));

ALTER TABLE "public"."chat_rooms"
  ADD COLUMN IF NOT EXISTS "space_kind" "text"
  CHECK ("space_kind" IS NULL OR "space_kind" = ANY (ARRAY['team'::"text", 'trade'::"text", 'location'::"text", 'club'::"text"]));
ALTER TABLE "public"."chat_rooms" ADD COLUMN IF NOT EXISTS "about" "text";

COMMENT ON COLUMN "public"."chat_rooms"."space_kind" IS
  'Kit 28 Spaces & Clubs facet (team/trade/location/club). Non-null only when room_kind = space.';

ALTER POLICY "chat_rooms_select" ON "public"."chat_rooms"
  USING (
    "private"."is_room_member"("id")
    OR (("created_by" = (SELECT "auth"."uid"())) AND "private"."is_org_member"("org_id"))
    OR (("room_kind" = 'space') AND "private"."is_org_member"("org_id"))
  );

ALTER POLICY "chat_room_members_insert" ON "public"."chat_room_members"
  WITH CHECK (
    "private"."is_room_creator"("room_id")
    OR "private"."is_room_admin"("room_id")
    OR (
      ("user_id" = (SELECT "auth"."uid"()))
      AND EXISTS (
        SELECT 1 FROM "public"."chat_rooms" "r"
        WHERE "r"."id" = "room_id"
          AND "r"."room_kind" = 'space'
          AND "r"."deleted_at" IS NULL
          AND "private"."is_org_member"("r"."org_id")
      )
    )
  );

-- ── Knowledge ─────────────────────────────────────────────────────────────
ALTER TABLE "public"."sops" ADD COLUMN IF NOT EXISTS "category" "text";
ALTER TABLE "public"."sops" ADD COLUMN IF NOT EXISTS "must_read" boolean DEFAULT false NOT NULL;

CREATE TABLE IF NOT EXISTS "public"."sop_acknowledgements" (
    "sop_id" "uuid" NOT NULL REFERENCES "public"."sops"("id") ON DELETE CASCADE,
    "user_id" "uuid" NOT NULL,
    "org_id" "uuid" NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
    "acknowledged_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    PRIMARY KEY ("sop_id", "user_id")
);
ALTER TABLE "public"."sop_acknowledgements" OWNER TO "postgres";
ALTER TABLE "public"."sop_acknowledgements" ENABLE ROW LEVEL SECURITY;

-- pg_default_acl grants anon SELECT on every new table (known footgun) —
-- revoke explicitly.
REVOKE ALL ON TABLE "public"."sop_acknowledgements" FROM "anon";
GRANT SELECT, INSERT ON TABLE "public"."sop_acknowledgements" TO "authenticated";

-- Org members see who has acknowledged (that is the POINT of a read roll);
-- a user can only ever acknowledge as themself, in an org they belong to.
CREATE POLICY "sop_ack_select" ON "public"."sop_acknowledgements"
  FOR SELECT USING ("private"."is_org_member"("org_id"));
CREATE POLICY "sop_ack_insert" ON "public"."sop_acknowledgements"
  FOR INSERT WITH CHECK (
    ("user_id" = (SELECT "auth"."uid"())) AND "private"."is_org_member"("org_id")
  );

CREATE INDEX IF NOT EXISTS "sop_ack_org_user_idx"
  ON "public"."sop_acknowledgements" ("org_id", "user_id");
