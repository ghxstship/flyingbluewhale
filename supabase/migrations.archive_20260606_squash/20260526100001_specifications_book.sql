-- Round 36 — Specifications Book
--
-- Per construction-pm-parity roadmap Wave 1.4 (gap G-005 + G-007).
-- A specifications book is the textual half of a construction document set:
-- divisions (00-49 under CSI MasterFormat 2026) → sections (e.g. 26 22 00
-- Low-Voltage Transformers) → subsections.
--
-- Submittals and RFIs already exist; this migration adds the spec spine and
-- the spec_section_id FK from both, so an RFI/submittal can declare "this is
-- a question about section 26 22 00."

BEGIN;

-- =============================================================================
-- 1. ENUMS
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE public.spec_format AS ENUM (
    'masterformat_2026',  -- CSI MasterFormat (US/Canada)
    'masterformat_1995',  -- legacy 16-division
    'uniformat_2_2',      -- ASTM E1557 elements
    'nrm2',               -- RICS New Rules of Measurement (UK)
    'custom'              -- org-defined
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.spec_section_state AS ENUM (
    'draft',
    'in_review',
    'issued',
    'superseded',
    'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON TYPE public.spec_section_state IS
  'Per-section lifecycle state. Mirrors site_plans document_state so a section can supersede independently.';

-- =============================================================================
-- 2. spec_sections — the spine
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.spec_sections (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id             uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  project_id         uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  format             public.spec_format NOT NULL DEFAULT 'masterformat_2026',
  -- e.g. "26 22 00" for low-voltage transformers; or Uniformat "B30" for
  -- exterior enclosures. Kept as text because format-specific.
  section_number     text NOT NULL,
  title              text NOT NULL,
  division           text,                       -- e.g. "26 — Electrical"
  parent_id          uuid REFERENCES public.spec_sections(id) ON DELETE CASCADE,
  section_state      public.spec_section_state NOT NULL DEFAULT 'draft',
  -- The full body of the section as Markdown. Sub-points break into
  -- spec_section_items rows when granular reference (e.g. submittal hyperlink
  -- to part 2.3.B.1) is needed.
  body_md            text,
  sheet_refs         text[] NOT NULL DEFAULT '{}',  -- sheet codes referenced in body
  issued_at          timestamptz,
  issued_by          uuid REFERENCES auth.users(id),
  superseded_at      timestamptz,
  superseded_by      uuid REFERENCES public.spec_sections(id) ON DELETE SET NULL,
  created_by         uuid REFERENCES auth.users(id),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  deleted_at         timestamptz,
  UNIQUE (project_id, format, section_number)
);

CREATE INDEX IF NOT EXISTS spec_sections_org_idx
  ON public.spec_sections (org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS spec_sections_project_idx
  ON public.spec_sections (project_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS spec_sections_parent_idx
  ON public.spec_sections (parent_id);
CREATE INDEX IF NOT EXISTS spec_sections_state_idx
  ON public.spec_sections (section_state) WHERE section_state IN ('draft','in_review','issued');
CREATE INDEX IF NOT EXISTS spec_sections_superseded_by_idx
  ON public.spec_sections (superseded_by);
CREATE INDEX IF NOT EXISTS spec_sections_issued_by_idx
  ON public.spec_sections (issued_by);
CREATE INDEX IF NOT EXISTS spec_sections_division_idx
  ON public.spec_sections (project_id, division) WHERE deleted_at IS NULL;

COMMENT ON TABLE public.spec_sections IS
  'Specifications book sections, per project. CSI MasterFormat-friendly but supports Uniformat / NRM2 / custom via format. parent_id supports hierarchy for divisions → sections → subsections when needed.';

COMMENT ON COLUMN public.spec_sections.section_number IS
  'Format-aware code. MasterFormat: "26 22 00". Uniformat: "B30". Kept as text because format-defined.';

-- =============================================================================
-- 3. spec_section_items — granular sub-points (PART 1, PART 2, PART 3 paragraphs)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.spec_section_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  spec_section_id   uuid NOT NULL REFERENCES public.spec_sections(id) ON DELETE CASCADE,
  -- e.g. "2.3.B.1" — the paragraph identifier within a CSI 3-part section.
  paragraph         text NOT NULL,
  body_md           text NOT NULL,
  ordinal           int NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (spec_section_id, paragraph)
);

CREATE INDEX IF NOT EXISTS spec_section_items_section_idx
  ON public.spec_section_items (spec_section_id);
CREATE INDEX IF NOT EXISTS spec_section_items_org_idx
  ON public.spec_section_items (org_id);

COMMENT ON TABLE public.spec_section_items IS
  'Granular paragraph rows under a spec section. Created on-demand when an RFI or submittal needs to reference a specific paragraph.';

-- =============================================================================
-- 4. FK from submittals + rfis
-- =============================================================================

ALTER TABLE public.submittals
  ADD COLUMN IF NOT EXISTS spec_section_id uuid REFERENCES public.spec_sections(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS submittals_spec_section_idx
  ON public.submittals (spec_section_id) WHERE spec_section_id IS NOT NULL;

ALTER TABLE public.rfis
  ADD COLUMN IF NOT EXISTS spec_section_id uuid REFERENCES public.spec_sections(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS rfis_spec_section_idx
  ON public.rfis (spec_section_id) WHERE spec_section_id IS NOT NULL;

-- =============================================================================
-- 5. updated_at triggers
-- =============================================================================

CREATE OR REPLACE FUNCTION public.touch_spec_section_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_spec_sections_touch ON public.spec_sections;
CREATE TRIGGER trg_spec_sections_touch
  BEFORE UPDATE ON public.spec_sections
  FOR EACH ROW EXECUTE FUNCTION public.touch_spec_section_updated_at();

DROP TRIGGER IF EXISTS trg_spec_section_items_touch ON public.spec_section_items;
CREATE TRIGGER trg_spec_section_items_touch
  BEFORE UPDATE ON public.spec_section_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_spec_section_updated_at();

-- =============================================================================
-- 6. RLS
-- =============================================================================

ALTER TABLE public.spec_sections       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spec_section_items  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS spec_sections_org_select ON public.spec_sections;
CREATE POLICY spec_sections_org_select ON public.spec_sections
  FOR SELECT USING (private.is_org_member(org_id));

DROP POLICY IF EXISTS spec_sections_org_write ON public.spec_sections;
CREATE POLICY spec_sections_org_write ON public.spec_sections
  FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

DROP POLICY IF EXISTS spec_section_items_org_select ON public.spec_section_items;
CREATE POLICY spec_section_items_org_select ON public.spec_section_items
  FOR SELECT USING (private.is_org_member(org_id));

DROP POLICY IF EXISTS spec_section_items_org_write ON public.spec_section_items;
CREATE POLICY spec_section_items_org_write ON public.spec_section_items
  FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

COMMIT;
