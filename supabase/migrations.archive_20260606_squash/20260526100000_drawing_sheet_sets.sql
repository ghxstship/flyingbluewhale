-- Round 35 — Drawing Sheet Sets
--
-- Adds a versioned grouping concept on top of `site_plans`. site_plans already
-- carries the canonical per-sheet record (with charthouse_sheet_type covering
-- the full construction-drawing taxonomy: floor_plan, rcp, power, egress, flow,
-- signage, section, as_built). What it lacks is a way to publish a coordinated
-- set of sheets as a single versioned drop with slip-sheet diff.
--
-- Three new tables:
--   sheet_sets             — named per-project package (e.g. "100% CD set")
--   sheet_set_versions     — published snapshots (Rev 0, Rev 1, ...)
--   sheet_set_members      — join: which site_plan rows are in which version,
--                            with the sheet's revision at publish time
--
-- Closes parity gap G-014 (Wave 1.1 in construction-pm-parity roadmap).

BEGIN;

-- =============================================================================
-- 1. ENUMS
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE public.sheet_set_state AS ENUM (
    'draft',
    'in_review',
    'published',
    'superseded',
    'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON TYPE public.sheet_set_state IS
  'Lifecycle for a coordinated drawing sheet set. published is the canonical IFC drop; superseded means a newer version exists.';

-- =============================================================================
-- 2. sheet_sets — per-project named package
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.sheet_sets (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id             uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  project_id         uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name               text NOT NULL,
  description        text,
  discipline         text,                              -- 'multi' | 'A' | 'S' | 'M' | 'E' | 'P' | 'FP' | 'CIV' | ...
  current_version_id uuid,                              -- FK added after sheet_set_versions exists
  created_by         uuid REFERENCES auth.users(id),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  deleted_at         timestamptz,
  UNIQUE (project_id, name)
);

CREATE INDEX IF NOT EXISTS sheet_sets_org_idx
  ON public.sheet_sets (org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS sheet_sets_project_idx
  ON public.sheet_sets (project_id) WHERE deleted_at IS NULL;

COMMENT ON TABLE public.sheet_sets IS
  'A coordinated drawing-sheet package, per project. Holds the meta; versions live in sheet_set_versions.';

-- =============================================================================
-- 3. sheet_set_versions — published snapshots
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.sheet_set_versions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  sheet_set_id    uuid NOT NULL REFERENCES public.sheet_sets(id) ON DELETE CASCADE,
  version_label   text NOT NULL,                     -- 'Rev 0', '50% DD', '100% CD', '24-03-15'
  set_state       public.sheet_set_state NOT NULL DEFAULT 'draft',
  published_at    timestamptz,
  published_by    uuid REFERENCES auth.users(id),
  superseded_at   timestamptz,
  superseded_by   uuid REFERENCES public.sheet_set_versions(id) ON DELETE SET NULL,
  notes_md        text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sheet_set_id, version_label)
);

CREATE INDEX IF NOT EXISTS sheet_set_versions_org_idx
  ON public.sheet_set_versions (org_id);
CREATE INDEX IF NOT EXISTS sheet_set_versions_set_idx
  ON public.sheet_set_versions (sheet_set_id);
CREATE INDEX IF NOT EXISTS sheet_set_versions_state_idx
  ON public.sheet_set_versions (set_state) WHERE set_state IN ('draft','in_review','published');
CREATE INDEX IF NOT EXISTS sheet_set_versions_superseded_by_idx
  ON public.sheet_set_versions (superseded_by);
CREATE INDEX IF NOT EXISTS sheet_set_versions_published_by_idx
  ON public.sheet_set_versions (published_by);

COMMENT ON TABLE public.sheet_set_versions IS
  'A published snapshot of a sheet set. Slip-sheet diff renders by comparing the member rows of two versions.';

-- Wire sheet_sets.current_version_id now that the target table exists.
ALTER TABLE public.sheet_sets
  ADD CONSTRAINT sheet_sets_current_version_fk
  FOREIGN KEY (current_version_id) REFERENCES public.sheet_set_versions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS sheet_sets_current_version_idx
  ON public.sheet_sets (current_version_id);

-- =============================================================================
-- 4. sheet_set_members — which site_plan rows belong to which version
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.sheet_set_members (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  sheet_set_version_id uuid NOT NULL REFERENCES public.sheet_set_versions(id) ON DELETE CASCADE,
  site_plan_id         uuid NOT NULL REFERENCES public.site_plans(id) ON DELETE CASCADE,
  -- Captured at publish-time so the version is immutable even if the source
  -- site_plan revision_letter advances later.
  revision_letter_at_publish text,
  ordinal              int NOT NULL DEFAULT 0,
  added_at             timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sheet_set_version_id, site_plan_id)
);

CREATE INDEX IF NOT EXISTS sheet_set_members_version_idx
  ON public.sheet_set_members (sheet_set_version_id);
CREATE INDEX IF NOT EXISTS sheet_set_members_plan_idx
  ON public.sheet_set_members (site_plan_id);
CREATE INDEX IF NOT EXISTS sheet_set_members_org_idx
  ON public.sheet_set_members (org_id);

COMMENT ON TABLE public.sheet_set_members IS
  'Membership join. Each row pins a site_plan into a sheet_set_version at the revision letter it was on when the version published.';

-- =============================================================================
-- 5. updated_at trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION public.touch_sheet_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sheet_sets_touch ON public.sheet_sets;
CREATE TRIGGER trg_sheet_sets_touch
  BEFORE UPDATE ON public.sheet_sets
  FOR EACH ROW EXECUTE FUNCTION public.touch_sheet_set_updated_at();

DROP TRIGGER IF EXISTS trg_sheet_set_versions_touch ON public.sheet_set_versions;
CREATE TRIGGER trg_sheet_set_versions_touch
  BEFORE UPDATE ON public.sheet_set_versions
  FOR EACH ROW EXECUTE FUNCTION public.touch_sheet_set_updated_at();

-- =============================================================================
-- 6. RLS
-- =============================================================================

ALTER TABLE public.sheet_sets             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sheet_set_versions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sheet_set_members      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sheet_sets_org_select ON public.sheet_sets;
CREATE POLICY sheet_sets_org_select ON public.sheet_sets
  FOR SELECT USING (private.is_org_member(org_id));

DROP POLICY IF EXISTS sheet_sets_org_write ON public.sheet_sets;
CREATE POLICY sheet_sets_org_write ON public.sheet_sets
  FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

DROP POLICY IF EXISTS sheet_set_versions_org_select ON public.sheet_set_versions;
CREATE POLICY sheet_set_versions_org_select ON public.sheet_set_versions
  FOR SELECT USING (private.is_org_member(org_id));

DROP POLICY IF EXISTS sheet_set_versions_org_write ON public.sheet_set_versions;
CREATE POLICY sheet_set_versions_org_write ON public.sheet_set_versions
  FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

DROP POLICY IF EXISTS sheet_set_members_org_select ON public.sheet_set_members;
CREATE POLICY sheet_set_members_org_select ON public.sheet_set_members
  FOR SELECT USING (private.is_org_member(org_id));

DROP POLICY IF EXISTS sheet_set_members_org_write ON public.sheet_set_members;
CREATE POLICY sheet_set_members_org_write ON public.sheet_set_members
  FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

COMMIT;
