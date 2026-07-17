ALTER TABLE "public"."kb_articles"
  ADD COLUMN IF NOT EXISTS "must_ack" boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN "public"."kb_articles"."must_ack" IS
  'Kit 28: article requires an explicit read acknowledgement from the field (drives the must-read badge + the ack action on /m/docs/[id]).';

CREATE TABLE IF NOT EXISTS "public"."kb_article_acknowledgements" (
  "article_id" uuid NOT NULL REFERENCES "public"."kb_articles"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
  "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "acknowledged_at" timestamptz NOT NULL DEFAULT now(),
  "article_version" integer NOT NULL DEFAULT 1,
  PRIMARY KEY ("article_id", "user_id")
);

CREATE INDEX IF NOT EXISTS "kb_article_acks_user_id_idx" ON "public"."kb_article_acknowledgements" ("user_id");
CREATE INDEX IF NOT EXISTS "kb_article_acks_org_ack_at_idx" ON "public"."kb_article_acknowledgements" ("org_id", "acknowledged_at" DESC);

ALTER TABLE "public"."kb_article_acknowledgements" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kb_article_acks_select_org_member" ON "public"."kb_article_acknowledgements"
  FOR SELECT USING ("private"."is_org_member"("org_id"));
CREATE POLICY "kb_article_acks_insert_self" ON "public"."kb_article_acknowledgements"
  FOR INSERT WITH CHECK ("user_id" = (SELECT auth.uid()) AND "private"."is_org_member"("org_id"));
CREATE POLICY "kb_article_acks_update_self" ON "public"."kb_article_acknowledgements"
  FOR UPDATE USING ("user_id" = (SELECT auth.uid()));

REVOKE ALL ON TABLE "public"."kb_article_acknowledgements" FROM "anon";
GRANT SELECT, INSERT, UPDATE ON TABLE "public"."kb_article_acknowledgements" TO "authenticated";
