-- Template-workflow RBAC remediation (template-management program,
-- 2026-07-24 audit).
--
-- FINDINGS FIXED HERE
-- 1 · Grant-holders hit the RLS wall: the app gates on the template surfaces
--     admit `templates:write` / `templates:publish` capability grants
--     (ADR-0015), but org_guide_templates / template_versions /
--     deliverable_templates / org_doc_template_settings only admitted the
--     manager band at RLS — a grantee passed the app check and then failed
--     the write. Capability arms follow the asset-custody precedent
--     (20260723120000): `public.effective_capabilities(org_id)` is SECURITY
--     DEFINER and can only answer for auth.uid().
-- 2 · email_templates writes were owner/admin only while the surface
--     (/studio/settings/email-templates) is offered at minRole manager —
--     a manager's create/update died at RLS. Widened to the standard
--     template-store manager band + templates:write arm. Hard DELETE stays
--     owner/admin (the app's delete is a soft-delete UPDATE).
-- 3 · job_templates / job_template_steps writes were owner/admin/controller —
--     managers curate the LEG3ND hub library (Manage nav is minRole manager)
--     but could not author job templates. Widened to the manager band +
--     templates:write arm.
--
-- PUBLISH STAYS TIGHTER THAN WRITE, AT THE DATABASE: a templates:write-only
-- grantee can create drafts and edit/archive, but flipping
-- org_guide_templates.template_state to 'published' requires
-- templates:publish (or the manager band) — enforced in WITH CHECK so a
-- direct PostgREST call cannot bypass the app-layer split.

-- ── 1a · org_guide_templates: capability arms ────────────────────────────
CREATE POLICY "org_guide_templates_grant_insert" ON "public"."org_guide_templates"
  FOR INSERT TO "authenticated"
  WITH CHECK (
    "private"."is_org_member"("org_id")
    AND "template_state" = 'draft'
    AND EXISTS (
      SELECT 1 FROM "public"."effective_capabilities"("org_id") cap
      WHERE cap IN ('templates:write', 'templates:publish')
    )
  );

CREATE POLICY "org_guide_templates_grant_update" ON "public"."org_guide_templates"
  FOR UPDATE TO "authenticated"
  USING (
    "private"."is_org_member"("org_id")
    AND EXISTS (
      SELECT 1 FROM "public"."effective_capabilities"("org_id") cap
      WHERE cap IN ('templates:write', 'templates:publish')
    )
  )
  WITH CHECK (
    "private"."is_org_member"("org_id")
    AND (
      "template_state" <> 'published'
      OR EXISTS (
        SELECT 1 FROM "public"."effective_capabilities"("org_id") cap
        WHERE cap = 'templates:publish'
      )
    )
  );

-- ── 1b · template_versions: grantees journal their own writes ────────────
CREATE POLICY "template_versions_grant_insert" ON "public"."template_versions"
  FOR INSERT TO "authenticated"
  WITH CHECK (
    "private"."is_org_member"("org_id")
    AND EXISTS (
      SELECT 1 FROM "public"."effective_capabilities"("org_id") cap
      WHERE cap IN ('templates:write', 'templates:publish')
    )
  );

-- ── 1c · deliverable_templates: capability arms ──────────────────────────
CREATE POLICY "deliverable_templates_grant_insert" ON "public"."deliverable_templates"
  FOR INSERT TO "authenticated"
  WITH CHECK (
    "private"."is_org_member"("org_id")
    AND EXISTS (
      SELECT 1 FROM "public"."effective_capabilities"("org_id") cap
      WHERE cap = 'templates:write'
    )
  );

CREATE POLICY "deliverable_templates_grant_update" ON "public"."deliverable_templates"
  FOR UPDATE TO "authenticated"
  USING (
    "private"."is_org_member"("org_id")
    AND EXISTS (
      SELECT 1 FROM "public"."effective_capabilities"("org_id") cap
      WHERE cap = 'templates:write'
    )
  )
  WITH CHECK (
    "private"."is_org_member"("org_id")
    AND EXISTS (
      SELECT 1 FROM "public"."effective_capabilities"("org_id") cap
      WHERE cap = 'templates:write'
    )
  );

-- ── 1d · org_doc_template_settings: capability arms (configurator) ───────
CREATE POLICY "org_doc_template_settings_grant_iud" ON "public"."org_doc_template_settings"
  TO "authenticated"
  USING (
    "private"."is_org_member"("org_id")
    AND EXISTS (
      SELECT 1 FROM "public"."effective_capabilities"("org_id") cap
      WHERE cap = 'templates:write'
    )
  )
  WITH CHECK (
    "private"."is_org_member"("org_id")
    AND EXISTS (
      SELECT 1 FROM "public"."effective_capabilities"("org_id") cap
      WHERE cap = 'templates:write'
    )
  );

-- ── 2 · email_templates: manager band + grant arm ────────────────────────
DROP POLICY IF EXISTS "email_templates_insert" ON "public"."email_templates";
CREATE POLICY "email_templates_insert" ON "public"."email_templates"
  FOR INSERT TO "authenticated"
  WITH CHECK (
    "private"."has_org_role"("org_id", ARRAY['owner'::text,'admin'::text,'manager'::text,'controller'::text,'collaborator'::text])
    OR (
      "private"."is_org_member"("org_id")
      AND EXISTS (
        SELECT 1 FROM "public"."effective_capabilities"("org_id") cap
        WHERE cap = 'templates:write'
      )
    )
  );

DROP POLICY IF EXISTS "email_templates_update" ON "public"."email_templates";
CREATE POLICY "email_templates_update" ON "public"."email_templates"
  FOR UPDATE TO "authenticated"
  USING (
    "private"."has_org_role"("org_id", ARRAY['owner'::text,'admin'::text,'manager'::text,'controller'::text,'collaborator'::text])
    OR (
      "private"."is_org_member"("org_id")
      AND EXISTS (
        SELECT 1 FROM "public"."effective_capabilities"("org_id") cap
        WHERE cap = 'templates:write'
      )
    )
  )
  WITH CHECK (
    "private"."has_org_role"("org_id", ARRAY['owner'::text,'admin'::text,'manager'::text,'controller'::text,'collaborator'::text])
    OR (
      "private"."is_org_member"("org_id")
      AND EXISTS (
        SELECT 1 FROM "public"."effective_capabilities"("org_id") cap
        WHERE cap = 'templates:write'
      )
    )
  );

-- ── 3 · job_templates (+ steps): manager band + grant arm ────────────────
DROP POLICY IF EXISTS "job_templates_write" ON "public"."job_templates";
CREATE POLICY "job_templates_write" ON "public"."job_templates"
  TO "authenticated"
  USING (
    "private"."has_org_role"("org_id", ARRAY['owner'::text,'admin'::text,'manager'::text,'controller'::text,'collaborator'::text])
    OR (
      "private"."is_org_member"("org_id")
      AND EXISTS (
        SELECT 1 FROM "public"."effective_capabilities"("org_id") cap
        WHERE cap = 'templates:write'
      )
    )
  )
  WITH CHECK (
    "private"."has_org_role"("org_id", ARRAY['owner'::text,'admin'::text,'manager'::text,'controller'::text,'collaborator'::text])
    OR (
      "private"."is_org_member"("org_id")
      AND EXISTS (
        SELECT 1 FROM "public"."effective_capabilities"("org_id") cap
        WHERE cap = 'templates:write'
      )
    )
  );

DROP POLICY IF EXISTS "job_template_steps_write" ON "public"."job_template_steps";
CREATE POLICY "job_template_steps_write" ON "public"."job_template_steps"
  TO "authenticated"
  USING (
    EXISTS (
      SELECT 1 FROM "public"."job_templates" t
      WHERE t."id" = "job_template_steps"."job_template_id"
        AND (
          "private"."has_org_role"(t."org_id", ARRAY['owner'::text,'admin'::text,'manager'::text,'controller'::text,'collaborator'::text])
          OR (
            "private"."is_org_member"(t."org_id")
            AND EXISTS (
              SELECT 1 FROM "public"."effective_capabilities"(t."org_id") cap
              WHERE cap = 'templates:write'
            )
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "public"."job_templates" t
      WHERE t."id" = "job_template_steps"."job_template_id"
        AND (
          "private"."has_org_role"(t."org_id", ARRAY['owner'::text,'admin'::text,'manager'::text,'controller'::text,'collaborator'::text])
          OR (
            "private"."is_org_member"(t."org_id")
            AND EXISTS (
              SELECT 1 FROM "public"."effective_capabilities"(t."org_id") cap
              WHERE cap = 'templates:write'
            )
          )
        )
    )
  );
