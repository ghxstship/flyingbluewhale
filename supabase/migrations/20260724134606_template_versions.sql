-- Template version history (template-management program, 2026-07-24).
--
-- Every row-backed template store in the product (job_templates,
-- field_templates, email_templates, org_guide_templates, ...) is a flat row
-- edited in place: changing an org template silently changes what the next
-- project inherits, with zero history. Record instances already have the
-- version idiom (proposal_versions, contract_versions, file_versions) —
-- templates had nothing.
--
-- One GENERIC append-only snapshot journal instead of N per-store *_versions
-- tables: template edits are low-volume config writes, the payloads are
-- heterogeneous JSON, and a single journal keeps the library's version UI and
-- the ratchet simple. `family` matches the unified library vocabulary
-- (src/lib/templates/library-shared.ts); `template_id` is NOT an FK on
-- purpose — it points into a different table per family, and history must
-- survive the template row's deletion.
--
-- Append-only: SELECT + INSERT policies only. No UPDATE/DELETE policy means
-- those writes are denied (RLS default-deny), same pattern as the
-- *_state_transitions ledgers.
CREATE TABLE IF NOT EXISTS "public"."template_versions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "family" text NOT NULL CHECK ("family" IN (
    'doc', 'job', 'field', 'advance', 'guide', 'proposal', 'project',
    'inspection', 'email', 'deliverable', 'notification'
  )),
  "template_id" uuid NOT NULL,
  "version" integer NOT NULL CHECK ("version" >= 1),
  -- Full template payload at this version (columns the store considers content).
  "snapshot" jsonb NOT NULL,
  "changed_by" uuid REFERENCES "auth"."users"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "template_versions_uq" UNIQUE ("org_id", "family", "template_id", "version")
);

CREATE INDEX IF NOT EXISTS "template_versions_lookup_idx"
  ON "public"."template_versions" ("org_id", "family", "template_id", "version" DESC);

ALTER TABLE "public"."template_versions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "template_versions_select" ON "public"."template_versions"
  FOR SELECT TO "authenticated" USING ("private"."is_org_member"("org_id"));

-- Writers are the template-shaping band (same as the stores themselves).
CREATE POLICY "template_versions_insert" ON "public"."template_versions"
  FOR INSERT TO "authenticated"
  WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::text,'admin'::text,'manager'::text,'controller'::text,'collaborator'::text]));

REVOKE ALL ON TABLE "public"."template_versions" FROM "anon";
GRANT SELECT, INSERT ON TABLE "public"."template_versions" TO "authenticated";
