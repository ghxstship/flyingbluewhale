-- COMPVSS Spaces & Clubs (kit 28, surface `spaces` → /m/spaces + /m/spaces/[id]).
--
-- Kit model (COMPVSS-Field-SEED.jsx.txt §SPACES): Team / Trade / Location / Club
-- channels, credential-gated, with join/leave that persists, an unread count, an
-- `about` blurb, and a member post feed carrying likes + comments.
--
-- Why a new store rather than reuse:
--   * `message_channels` + `channel_memberships` is the CONSOLE comms/Slack-mirror
--     integration (kind='project' only, external_provider/external_channel_id,
--     slack_channel_mappings). It is keyed by `party_id`, not `user_id`, and is
--     owned by /studio/comms/channels. Repurposing it for a social feature would
--     couple field Spaces to the Slack integration surface.
--   * `chat_rooms` is 1:1/DM + room messaging for /m/inbox — different object:
--     a Space is joinable/leaveable and public-within-a-gate; a room is a
--     membership list you are added to.
--
-- LDP: no bare `status` column. Soft-delete via `deleted_at` per the repo canon.

CREATE TABLE IF NOT EXISTS "public"."spaces" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  -- Kit SPACE_KINDS minus the "All" filter pseudo-kind.
  "kind" text NOT NULL CHECK ("kind" IN ('team', 'trade', 'location', 'club')),
  "name" text NOT NULL,
  "about" text,
  -- Lucide icon id, mirroring the kit's per-space icon (DoorOpen, Anchor, …).
  "icon" text,
  -- Credential gate: the access/credential NAME a member must hold to join
  -- (kit: `gated: "Gate & Access"` / `"Rigging"`). NULL = open to the org.
  "gated_credential" text,
  -- Location/Team spaces may be scoped to a production; Club spaces are org-wide.
  "project_id" uuid REFERENCES "public"."projects"("id") ON DELETE SET NULL,
  "created_by" uuid REFERENCES "auth"."users"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz
);

CREATE TABLE IF NOT EXISTS "public"."space_memberships" (
  "space_id" uuid NOT NULL REFERENCES "public"."spaces"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
  "role" text NOT NULL DEFAULT 'member' CHECK ("role" IN ('member', 'moderator')),
  "joined_at" timestamptz NOT NULL DEFAULT now(),
  -- Drives the kit's per-space unread badge: posts newer than this.
  "last_read_at" timestamptz,
  "muted" boolean NOT NULL DEFAULT false,
  PRIMARY KEY ("space_id", "user_id")
);

CREATE TABLE IF NOT EXISTS "public"."space_posts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "space_id" uuid NOT NULL REFERENCES "public"."spaces"("id") ON DELETE CASCADE,
  -- Denormalized from spaces.org_id so RLS + org-scoped reads never need a join.
  "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "author_id" uuid REFERENCES "auth"."users"("id") ON DELETE SET NULL,
  "body" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz
);

CREATE TABLE IF NOT EXISTS "public"."space_post_reactions" (
  "post_id" uuid NOT NULL REFERENCES "public"."space_posts"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("post_id", "user_id")
);

CREATE TABLE IF NOT EXISTS "public"."space_post_comments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "post_id" uuid NOT NULL REFERENCES "public"."space_posts"("id") ON DELETE CASCADE,
  "author_id" uuid REFERENCES "auth"."users"("id") ON DELETE SET NULL,
  "body" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz
);

-- FK indexes (the 0050 lesson: every FK gets one).
CREATE INDEX IF NOT EXISTS "spaces_org_id_idx" ON "public"."spaces" ("org_id");
CREATE INDEX IF NOT EXISTS "spaces_project_id_idx" ON "public"."spaces" ("project_id");
CREATE INDEX IF NOT EXISTS "spaces_created_by_idx" ON "public"."spaces" ("created_by");
CREATE INDEX IF NOT EXISTS "space_memberships_user_id_idx" ON "public"."space_memberships" ("user_id");
CREATE INDEX IF NOT EXISTS "space_posts_space_id_created_at_idx" ON "public"."space_posts" ("space_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "space_posts_org_id_idx" ON "public"."space_posts" ("org_id");
CREATE INDEX IF NOT EXISTS "space_posts_author_id_idx" ON "public"."space_posts" ("author_id");
CREATE INDEX IF NOT EXISTS "space_post_reactions_user_id_idx" ON "public"."space_post_reactions" ("user_id");
CREATE INDEX IF NOT EXISTS "space_post_comments_post_id_idx" ON "public"."space_post_comments" ("post_id");
CREATE INDEX IF NOT EXISTS "space_post_comments_author_id_idx" ON "public"."space_post_comments" ("author_id");

CREATE TRIGGER "spaces_touch_updated_at" BEFORE UPDATE ON "public"."spaces"
  FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();
CREATE TRIGGER "space_posts_touch_updated_at" BEFORE UPDATE ON "public"."space_posts"
  FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();

-- ── RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE "public"."spaces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."space_memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."space_posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."space_post_reactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."space_post_comments" ENABLE ROW LEVEL SECURITY;

-- Spaces are discoverable org-wide (the gate is on JOINING, not seeing that a
-- space exists — the kit renders un-joined gated spaces with a Join CTA).
CREATE POLICY "spaces_select_org_member" ON "public"."spaces"
  FOR SELECT USING ("private"."is_org_member"("org_id"));
CREATE POLICY "spaces_write_manager" ON "public"."spaces"
  FOR ALL USING ("private"."has_org_role"("org_id", ARRAY['owner', 'admin', 'controller', 'collaborator']))
  WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner', 'admin', 'controller', 'collaborator']));

-- Membership: you manage your own join/leave; org members can see the roster.
CREATE POLICY "space_memberships_select_org_member" ON "public"."space_memberships"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM "public"."spaces" s WHERE s."id" = "space_id" AND "private"."is_org_member"(s."org_id"))
  );
CREATE POLICY "space_memberships_insert_self" ON "public"."space_memberships"
  FOR INSERT WITH CHECK (
    "user_id" = (SELECT auth.uid())
    AND EXISTS (SELECT 1 FROM "public"."spaces" s WHERE s."id" = "space_id" AND "private"."is_org_member"(s."org_id"))
  );
CREATE POLICY "space_memberships_update_self" ON "public"."space_memberships"
  FOR UPDATE USING ("user_id" = (SELECT auth.uid()));
CREATE POLICY "space_memberships_delete_self" ON "public"."space_memberships"
  FOR DELETE USING ("user_id" = (SELECT auth.uid()));

-- Posts: readable by org members who have joined the space; authored as self.
CREATE POLICY "space_posts_select_member" ON "public"."space_posts"
  FOR SELECT USING (
    "private"."is_org_member"("org_id")
    AND EXISTS (
      SELECT 1 FROM "public"."space_memberships" m
      WHERE m."space_id" = "space_posts"."space_id" AND m."user_id" = (SELECT auth.uid())
    )
  );
CREATE POLICY "space_posts_insert_member" ON "public"."space_posts"
  FOR INSERT WITH CHECK (
    "author_id" = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM "public"."space_memberships" m
      WHERE m."space_id" = "space_posts"."space_id" AND m."user_id" = (SELECT auth.uid())
    )
  );
CREATE POLICY "space_posts_update_own" ON "public"."space_posts"
  FOR UPDATE USING ("author_id" = (SELECT auth.uid()));

CREATE POLICY "space_post_reactions_select_member" ON "public"."space_post_reactions"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "public"."space_posts" p
      JOIN "public"."space_memberships" m ON m."space_id" = p."space_id"
      WHERE p."id" = "post_id" AND m."user_id" = (SELECT auth.uid())
    )
  );
CREATE POLICY "space_post_reactions_write_self" ON "public"."space_post_reactions"
  FOR ALL USING ("user_id" = (SELECT auth.uid())) WITH CHECK ("user_id" = (SELECT auth.uid()));

CREATE POLICY "space_post_comments_select_member" ON "public"."space_post_comments"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "public"."space_posts" p
      JOIN "public"."space_memberships" m ON m."space_id" = p."space_id"
      WHERE p."id" = "post_id" AND m."user_id" = (SELECT auth.uid())
    )
  );
CREATE POLICY "space_post_comments_insert_self" ON "public"."space_post_comments"
  FOR INSERT WITH CHECK ("author_id" = (SELECT auth.uid()));

-- ── Grants ─────────────────────────────────────────────────────────────────
-- THE REVOKES ARE LOAD-BEARING. `pg_default_acl` on this project grants `anon=r`
-- at CREATE TABLE time, before any explicit GRANT — so a new table is
-- anon-readable by default unless revoked. RLS is the real control, but a
-- table-level anon SELECT grant should not exist either (the 2026-06-25 advisor
-- triage found a genuine anon leak of exactly this shape). Same pattern as
-- 20260715133509_scan_unknowns.sql.
REVOKE ALL ON TABLE "public"."spaces" FROM "anon";
REVOKE ALL ON TABLE "public"."space_memberships" FROM "anon";
REVOKE ALL ON TABLE "public"."space_posts" FROM "anon";
REVOKE ALL ON TABLE "public"."space_post_reactions" FROM "anon";
REVOKE ALL ON TABLE "public"."space_post_comments" FROM "anon";

GRANT SELECT, INSERT, UPDATE ON TABLE "public"."spaces" TO "authenticated";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."space_memberships" TO "authenticated";
GRANT SELECT, INSERT, UPDATE ON TABLE "public"."space_posts" TO "authenticated";
GRANT SELECT, INSERT, DELETE ON TABLE "public"."space_post_reactions" TO "authenticated";
GRANT SELECT, INSERT ON TABLE "public"."space_post_comments" TO "authenticated";
