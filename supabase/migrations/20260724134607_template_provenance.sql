-- Template provenance on generated records (template-management program,
-- 2026-07-24).
--
-- Records instantiated FROM a template did not remember which template
-- produced them: proposals seeded from proposal_templates copied blocks/theme
-- and dropped the link; projects materialized from project_templates
-- blueprints likewise. (inspections.template_id and
-- notification_instances.template_id already had the idiom;
-- event_guides.template_id landed with org_guide_templates.)
--
-- ON DELETE SET NULL everywhere: deleting a template never touches the
-- records it produced — provenance degrades to "unknown", history survives.
ALTER TABLE "public"."proposals"
  ADD COLUMN IF NOT EXISTS "template_id" uuid REFERENCES "public"."proposal_templates"("id") ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "proposals_template_id_idx"
  ON "public"."proposals" ("template_id");

ALTER TABLE "public"."projects"
  ADD COLUMN IF NOT EXISTS "template_id" uuid REFERENCES "public"."project_templates"("id") ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "projects_template_id_idx"
  ON "public"."projects" ("template_id");
