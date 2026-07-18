-- Kit 31 (COMPVSS Field conformance, task #23) — the universal field template
-- library: More · Operations → Templates (/m/templates). One library for
-- everything repeatable (rosters, advances, checklists, contracts, task lists,
-- schedules, onboarding packs, budget code sets). Org templates apply to every
-- project (project_id NULL); project templates can be promoted (project_id
-- flipped to NULL). Archive is soft (deleted_at) per repo convention — no
-- lifecycle *_state needed (the library has no cyclical machine; LDP-clean:
-- no bare status column).
CREATE TABLE IF NOT EXISTS "public"."field_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "project_id" uuid REFERENCES "public"."projects"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  -- The kit's 8 fixed categories (runtime/app.jsx TEMPLATE_CATS), snake_cased.
  "category" text NOT NULL CHECK ("category" IN
    ('roster','advance','checklist','contract','task_list','schedule','onboarding','budget')),
  -- The row's one-line contents summary ("12 Roles · Rates & Certs").
  "summary" text,
  -- Reusable payload. Shape is category-specific and versioned app-side.
  "config" jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Provenance per the kit New Template form (Create From).
  "source" text NOT NULL DEFAULT 'blank' CHECK ("source" IN ('blank','project_data','duplicate')),
  "use_count" integer NOT NULL DEFAULT 0,
  "last_used_at" timestamptz,
  "created_by" uuid REFERENCES "auth"."users"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz
);

CREATE INDEX IF NOT EXISTS "field_templates_org_idx" ON "public"."field_templates" ("org_id");
CREATE INDEX IF NOT EXISTS "field_templates_project_idx" ON "public"."field_templates" ("project_id");
CREATE INDEX IF NOT EXISTS "field_templates_created_by_idx" ON "public"."field_templates" ("created_by");

ALTER TABLE "public"."field_templates" ENABLE ROW LEVEL SECURITY;

-- Reads: any org member (the library is shared reference). Writes: the
-- manager band, matching the 20260625144337 sweep convention — creating,
-- promoting, duplicating and archiving library templates is library-shaping.
CREATE POLICY "field_templates_select" ON "public"."field_templates"
  FOR SELECT TO "authenticated" USING ("private"."is_org_member"("org_id"));

CREATE POLICY "field_templates_iud" ON "public"."field_templates"
  TO "authenticated"
  USING ("private"."has_org_role"("org_id", ARRAY['owner'::text,'admin'::text,'manager'::text,'controller'::text,'collaborator'::text]))
  WITH CHECK ("private"."has_org_role"("org_id", ARRAY['owner'::text,'admin'::text,'manager'::text,'controller'::text,'collaborator'::text]));

-- pg default ACL grants anon SELECT on every new table — revoke explicitly.
REVOKE ALL ON TABLE "public"."field_templates" FROM "anon";
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."field_templates" TO "authenticated";

CREATE TRIGGER "tg_touch_field_templates"
  BEFORE UPDATE ON "public"."field_templates"
  FOR EACH ROW EXECUTE FUNCTION "public"."touch_updated_at"();

-- "Use" is a member act (any crew member applies a template), while row
-- UPDATE stays manager-band — so the usage counter increments through a
-- SECURITY DEFINER RPC that enforces org membership itself.
CREATE OR REPLACE FUNCTION "public"."use_field_template"("p_template_id" uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.field_templates ft
     SET use_count = ft.use_count + 1,
         last_used_at = now()
   WHERE ft.id = p_template_id
     AND ft.deleted_at IS NULL
     AND private.is_org_member(ft.org_id)
  RETURNING ft.use_count INTO v_count;
  IF v_count IS NULL THEN
    RAISE EXCEPTION 'template not found';
  END IF;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION "public"."use_field_template"(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."use_field_template"(uuid) FROM "anon";
GRANT EXECUTE ON FUNCTION "public"."use_field_template"(uuid) TO "authenticated";
