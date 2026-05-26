-- Round 39 — BIM models
--
-- Per construction-pm-parity Wave 1.3 (gap G-006). Storage spine for
-- federated BIM models. The viewer (three.js + web-ifc for IFC, Forge for
-- RVT/NWD) is a separate engineering pass; this round ships the
-- persistence layer + admin surface so projects can register models and
-- the viewer can hydrate from these rows.
--
-- bim_model_links is the polymorphic glue so that an IFC element's
-- global_id (the GUID in IfcRoot) can carry RFIs, issues, submittals back
-- to the construction record.

BEGIN;

DO $$ BEGIN
  CREATE TYPE public.bim_source_type AS ENUM (
    'ifc',
    'ifc_zip',
    'rvt',
    'nwd',
    'nwc',
    'glb',
    'gltf',
    'fbx',
    'dwg'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.bim_model_state AS ENUM (
    'uploaded',
    'processing',
    'ready',
    'failed',
    'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.bim_link_type AS ENUM (
    'rfi',
    'submittal',
    'issue',
    'punch_item',
    'inspection',
    'transmittal_item'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- bim_models — one row per file
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.bim_models (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  project_id      uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name            text NOT NULL,
  discipline      text,
  source_type     public.bim_source_type NOT NULL,
  -- Supabase Storage object key in the 'bim' bucket (created by the
  -- runtime; not enforced by FK).
  storage_path    text NOT NULL,
  -- For RVT/NWD: the .svf URN returned by the Forge Model Derivative API
  -- once translation completes. For IFC: null (viewer reads storage directly).
  forge_urn       text,
  size_bytes      bigint,
  version_label   text,
  model_state     public.bim_model_state NOT NULL DEFAULT 'uploaded',
  -- Optional grouping: a federated set of models that align in 3D.
  federation_root_id uuid REFERENCES public.bim_models(id) ON DELETE SET NULL,
  -- 4x4 row-major transform applied at view time so children align with the
  -- federation root's coordinate system. JSONB keeps the index small.
  alignment_matrix jsonb,
  uploaded_by     uuid REFERENCES auth.users(id),
  uploaded_at     timestamptz NOT NULL DEFAULT now(),
  processed_at    timestamptz,
  failed_reason   text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  UNIQUE (project_id, storage_path)
);

CREATE INDEX IF NOT EXISTS bim_models_org_idx
  ON public.bim_models (org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS bim_models_project_idx
  ON public.bim_models (project_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS bim_models_state_idx
  ON public.bim_models (model_state) WHERE model_state IN ('uploaded','processing','failed');
CREATE INDEX IF NOT EXISTS bim_models_federation_root_idx
  ON public.bim_models (federation_root_id) WHERE federation_root_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS bim_models_uploaded_by_idx ON public.bim_models (uploaded_by);

COMMENT ON TABLE public.bim_models IS
  'Federated BIM models. IFC viewed directly via web-ifc; RVT/NWD viewed via Autodesk Forge .svf URNs (forge_urn populated after Model Derivative translates).';

-- =============================================================================
-- bim_model_links — IFC element global_id → construction record
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.bim_model_links (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  model_id        uuid NOT NULL REFERENCES public.bim_models(id) ON DELETE CASCADE,
  -- IFC GlobalId (22-char base64) or Forge dbId. Free text since both apply.
  element_global_id text NOT NULL,
  link_type       public.bim_link_type NOT NULL,
  target_id       uuid NOT NULL,
  note            text,
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (model_id, element_global_id, link_type, target_id)
);

CREATE INDEX IF NOT EXISTS bim_model_links_model_idx ON public.bim_model_links (model_id);
CREATE INDEX IF NOT EXISTS bim_model_links_element_idx ON public.bim_model_links (model_id, element_global_id);
CREATE INDEX IF NOT EXISTS bim_model_links_target_idx ON public.bim_model_links (link_type, target_id);
CREATE INDEX IF NOT EXISTS bim_model_links_org_idx ON public.bim_model_links (org_id);

COMMENT ON TABLE public.bim_model_links IS
  'Hot links between BIM elements and construction records. Click element in viewer → fetch all links → render RFI / submittal / punch panel.';

-- =============================================================================
-- updated_at trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION public.touch_bim_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bim_models_touch ON public.bim_models;
CREATE TRIGGER trg_bim_models_touch
  BEFORE UPDATE ON public.bim_models
  FOR EACH ROW EXECUTE FUNCTION public.touch_bim_updated_at();

-- =============================================================================
-- RLS
-- =============================================================================

ALTER TABLE public.bim_models       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bim_model_links  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bim_models_org_select ON public.bim_models;
CREATE POLICY bim_models_org_select ON public.bim_models
  FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS bim_models_org_write ON public.bim_models;
CREATE POLICY bim_models_org_write ON public.bim_models
  FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

DROP POLICY IF EXISTS bim_model_links_org_select ON public.bim_model_links;
CREATE POLICY bim_model_links_org_select ON public.bim_model_links
  FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS bim_model_links_org_write ON public.bim_model_links;
CREATE POLICY bim_model_links_org_write ON public.bim_model_links
  FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

COMMIT;
