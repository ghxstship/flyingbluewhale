-- migration: 20260616010000_assignment_bundles
-- Feature: Assignment Bundles — experience-layered advancing packages (Tixr competitor parity)
--
-- A bundle is a named group of assignments (e.g. "VIP Weekend Pack" = ticket +
-- backstage credential + hotel room) that ops staff can create, configure, and
-- issue together in a single step. Inspired by Tixr's "experience-layered"
-- model where fans bundle tickets + merch + F&B + VIP in one purchase flow.
--
-- LDP note: bundles have NO lifecycle state — they are an organisational
-- container, not a thing with a lifecycle arc. fulfillment_state lives on each
-- child assignment row per the unified advancing canon.

CREATE TABLE IF NOT EXISTS public.assignment_bundles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES public.orgs(id)     ON DELETE CASCADE,
  project_id  uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name        text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  description text,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz
);

ALTER TABLE public.assignment_bundles OWNER TO postgres;

-- bundle_id on assignments — nullable; SET NULL on bundle delete preserves
-- the assignment rows and their audit trail even if the bundle is removed.
ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS bundle_id uuid
    REFERENCES public.assignment_bundles(id) ON DELETE SET NULL;

-- Org-scoped list query (most callers filter by project too)
CREATE INDEX IF NOT EXISTS idx_assignment_bundles_org_project
  ON public.assignment_bundles (org_id, project_id)
  WHERE deleted_at IS NULL;

-- Reverse lookup: assignments in a bundle (for bundle detail views)
CREATE INDEX IF NOT EXISTS idx_assignments_bundle_id
  ON public.assignments (bundle_id)
  WHERE bundle_id IS NOT NULL AND deleted_at IS NULL;

-- Keep updated_at fresh automatically
CREATE OR REPLACE TRIGGER tg_assignment_bundles_touch_updated_at
  BEFORE UPDATE ON public.assignment_bundles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- RLS — mirrors the assignments table pattern
ALTER TABLE public.assignment_bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can select assignment_bundles"
  ON public.assignment_bundles FOR SELECT
  USING (private.is_org_member(org_id) AND deleted_at IS NULL);

CREATE POLICY "org members can insert assignment_bundles"
  ON public.assignment_bundles FOR INSERT
  WITH CHECK (private.is_org_member(org_id));

CREATE POLICY "org members can update assignment_bundles"
  ON public.assignment_bundles FOR UPDATE
  USING  (private.is_org_member(org_id))
  WITH CHECK (private.is_org_member(org_id));

CREATE POLICY "managers can delete assignment_bundles"
  ON public.assignment_bundles FOR DELETE
  USING (private.has_org_role(org_id, ARRAY['owner','admin','controller','collaborator']));

COMMENT ON TABLE  public.assignment_bundles IS 'Named groups of assignments — experience-layered advancing packages (e.g. VIP Pack = ticket + credential + lodging). Inspired by Tixr bundled purchase model.';
COMMENT ON COLUMN public.assignment_bundles.name IS 'Human-readable package name visible to ops staff (e.g. "Artist VIP Weekend").';
COMMENT ON COLUMN public.assignments.bundle_id   IS 'Optional bundle this assignment belongs to. SET NULL on bundle delete to preserve assignment audit trail.';
