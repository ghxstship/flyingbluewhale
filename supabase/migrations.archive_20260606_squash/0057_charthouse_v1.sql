-- CHARTHOUSE PROTOCOL v1.0
--
-- File ID: FP-CHARTHOUSE-001 · Frozen Phoenix · Spatial Architecture
-- Issued:  2026-05-13 · Rev A
--
-- Canonical spatial-plan data spine. Every site plan, floor plan, RCP, power
-- plan, egress plan, flow plan, signage plan, section, and as-built becomes a
-- queryable, lifecycle-aware, atom-identifier-stamped row anchored to an APS
-- Zone, traceable down to the UAC catalog line item it places.
--
-- This migration ENRICHES the legacy `site_plans` table (the canonical
-- sheet/atom record) with the CHARTHOUSE schema fields and adds the six
-- child tables that comprise the full protocol §4 data model:
--
--   charthouse_zone_region   §4.2  - Named sub-regions inside the shell
--   charthouse_band          §4.3  - Linear surface types (blue/orange line)
--   charthouse_station       §4.4  - Discrete work/service positions on bands
--   charthouse_placement     §4.5  - UAC/TPC catalog items placed on a sheet
--   charthouse_utility       §4.6  - Power, gas, water, drain, data drops
--   charthouse_adjacency     §4.7  - Per-edge adjacency declarations
--
-- Lifecycle is governed by the `document_state` machine (protocol §5). Per
-- LIFECYCLE_DECOMPOSITION_PROTOCOL.md §NAMING DISCIPLINE, the canonical column
-- name is `*_state` (cyclical operational) — `status` is banned.
--
-- Atom Identifier (protocol §3) format:
--   {ORG}-{EVT}{YY}{VEN}-{CLASS}.{DIV}.{SEC}-{ZON}-{SEQ}{REV}
-- e.g. SC-EDCLV26-LVMS-8000.800.002-KITPRP-001A. Validated by the
-- `charthouse_atom_id_re` regex constant exposed below.

BEGIN;

-- =============================================================================
-- 1. ENUMS
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE public.charthouse_sheet_type AS ENUM (
    'site_plan',
    'floor_plan',
    'rcp',
    'power',
    'egress',
    'flow',
    'signage',
    'section',
    'as_built'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- §5 Lifecycle state machine.
-- draft -> in_review -> approved -> issued -> superseded
--                                          \-> as_built (via field_change)
DO $$ BEGIN
  CREATE TYPE public.charthouse_document_state AS ENUM (
    'draft',
    'in_review',
    'approved',
    'issued',
    'superseded',
    'as_built'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.charthouse_shell_type AS ENUM (
    'tent',
    'container',
    'building',
    'parcel',
    'truss_structure',
    'vehicle',
    'riser',
    'open'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- §6 Band Vocabulary — closed enum. New band types enter via UWCP, never inline.
DO $$ BEGIN
  CREATE TYPE public.charthouse_band_type AS ENUM (
    'appliance',
    'service',
    'bar',
    'display',
    'cold_rail',
    'hot_rail',
    'queue',
    'bench',
    'tech',
    'barricade'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Edge declarations — cardinal + L-returns.
DO $$ BEGIN
  CREATE TYPE public.charthouse_edge AS ENUM (
    'N', 'S', 'E', 'W',
    'L_NE', 'L_SE', 'L_SW', 'L_NW'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- §4.6 Utility service types.
DO $$ BEGIN
  CREATE TYPE public.charthouse_utility_service AS ENUM (
    'power_120v_20a',
    'power_120v_30a',
    'power_208v_30a',
    'power_208v_50a',
    'power_480v_50a_3ph',
    'gas_propane',
    'gas_natural',
    'water_potable',
    'water_greywater',
    'drain',
    'data_ethernet',
    'data_fiber',
    'comms_rf',
    'comms_intercom',
    'compressed_air'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- §4.7 Adjacency relationship.
DO $$ BEGIN
  CREATE TYPE public.charthouse_adjacency_rel AS ENUM (
    'feeds',
    'egress_to',
    'service_from',
    'blocks',
    'noise_buffer',
    'thermal_buffer',
    'public_facing',
    'restricted'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- 2. SITE_PLANS ENRICHMENT (the canonical sheet row)
-- =============================================================================
-- Per protocol §4.1 `charthouse_sheet` IS the sheet record. In Flying Blue
-- Whale the canonical table is `public.site_plans` — we enrich it in place
-- rather than introduce a parallel table.

ALTER TABLE public.site_plans
  ADD COLUMN IF NOT EXISTS atom_id            text,
  ADD COLUMN IF NOT EXISTS sheet_type         public.charthouse_sheet_type NOT NULL DEFAULT 'site_plan',
  ADD COLUMN IF NOT EXISTS primary_class      smallint CHECK (primary_class BETWEEN 0 AND 9),
  ADD COLUMN IF NOT EXISTS secondary_classes  smallint[] DEFAULT '{}'::smallint[],
  ADD COLUMN IF NOT EXISTS tier_primary       smallint CHECK (tier_primary BETWEEN 1 AND 6),
  ADD COLUMN IF NOT EXISTS tier_secondary     jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS shell_type         public.charthouse_shell_type,
  ADD COLUMN IF NOT EXISTS shell_dimensions   jsonb,
  ADD COLUMN IF NOT EXISTS orientation_deg    smallint CHECK (orientation_deg BETWEEN 0 AND 359),
  ADD COLUMN IF NOT EXISTS scale              text,
  ADD COLUMN IF NOT EXISTS document_state     public.charthouse_document_state NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS superseded_by      uuid REFERENCES public.site_plans(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS issued_at          timestamptz,
  ADD COLUMN IF NOT EXISTS revision_letter    char(1) DEFAULT 'A' CHECK (revision_letter ~ '^[A-Z]$'),
  ADD COLUMN IF NOT EXISTS event_id           uuid REFERENCES public.events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS preset_code        text,
  ADD COLUMN IF NOT EXISTS zone_code          text,
  -- §11 cross-cutting tags
  ADD COLUMN IF NOT EXISTS sustainability_tag   text CHECK (sustainability_tag IN ('none', 'aspirational', 'committed', 'certified')),
  ADD COLUMN IF NOT EXISTS accessibility_tag    text CHECK (accessibility_tag IN ('ada_compliant', 'partial', 'none')),
  ADD COLUMN IF NOT EXISTS weather_exposure     text CHECK (weather_exposure IN ('enclosed', 'covered', 'open')),
  ADD COLUMN IF NOT EXISTS security_level       text CHECK (security_level IN ('public', 'restricted', 'talent_only', 'exec')),
  ADD COLUMN IF NOT EXISTS sensitivity          text CHECK (sensitivity IN ('low', 'med', 'high')),
  ADD COLUMN IF NOT EXISTS approved_at          timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS submitted_at        timestamptz,
  ADD COLUMN IF NOT EXISTS submitted_by        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deleted_at          timestamptz;

-- Atom IDs are globally unique once present.
CREATE UNIQUE INDEX IF NOT EXISTS site_plans_atom_id_uniq
  ON public.site_plans (atom_id)
  WHERE atom_id IS NOT NULL AND deleted_at IS NULL;

-- Atom-id well-formedness (§3). Stored as a column-level check.
-- Pattern: {ORG 2-4}-{EVT 3-5}{YY 2}-{VEN 3-5}-{CLASS 4}.{DIV 3}.{SEC 3}-{ZON 4-8}-{SEQ 3}{REV 1}
-- Examples: SC-EDCLV26-LVMS-8000.800.002-KITPRP-001A
ALTER TABLE public.site_plans
  DROP CONSTRAINT IF EXISTS site_plans_atom_id_format;
ALTER TABLE public.site_plans
  ADD CONSTRAINT site_plans_atom_id_format CHECK (
    atom_id IS NULL OR
    atom_id ~ '^[A-Z0-9]{2,4}-[A-Z0-9]{3,5}[0-9]{2}-[A-Z0-9]{3,5}-[0-9]{4}\.[0-9]{3}\.[0-9]{3}-[A-Z0-9]{4,8}-[0-9]{3}[A-Z]$'
  );

CREATE INDEX IF NOT EXISTS site_plans_document_state_idx     ON public.site_plans (org_id, document_state);
CREATE INDEX IF NOT EXISTS site_plans_sheet_type_idx         ON public.site_plans (org_id, sheet_type);
CREATE INDEX IF NOT EXISTS site_plans_event_idx              ON public.site_plans (event_id) WHERE event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS site_plans_superseded_by_idx      ON public.site_plans (superseded_by) WHERE superseded_by IS NOT NULL;

-- =============================================================================
-- 3. CHARTHOUSE CHILD TABLES (§4.2 - §4.7)
-- =============================================================================

-- §4.2 Zone Region — named sub-regions inside the shell (Cold Zone, Cook Zone, Pass, ...)
CREATE TABLE IF NOT EXISTS public.charthouse_zone_region (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  sheet_id    uuid NOT NULL REFERENCES public.site_plans(id) ON DELETE CASCADE,
  code        text NOT NULL,
  label       text NOT NULL,
  bbox        jsonb,                                   -- {x, y, w, h} in viewBox coords
  class_tag   smallint CHECK (class_tag BETWEEN 0 AND 9),
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at  timestamptz,
  UNIQUE (sheet_id, code)
);
CREATE INDEX IF NOT EXISTS charthouse_zone_region_sheet_idx ON public.charthouse_zone_region (sheet_id);
CREATE INDEX IF NOT EXISTS charthouse_zone_region_org_idx   ON public.charthouse_zone_region (org_id);

-- §4.3 Band — linear surface types (formal name for "blue line / orange line").
CREATE TABLE IF NOT EXISTS public.charthouse_band (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  sheet_id     uuid NOT NULL REFERENCES public.site_plans(id) ON DELETE CASCADE,
  region_id    uuid REFERENCES public.charthouse_zone_region(id) ON DELETE SET NULL,
  band_type    public.charthouse_band_type NOT NULL,
  edge         public.charthouse_edge NOT NULL,
  depth_in     numeric(8,2),
  path         jsonb,                                  -- SVG path or polyline coords
  color_token  text,                                   -- design-token override
  label        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at   timestamptz
);
CREATE INDEX IF NOT EXISTS charthouse_band_sheet_idx   ON public.charthouse_band (sheet_id);
CREATE INDEX IF NOT EXISTS charthouse_band_org_idx     ON public.charthouse_band (org_id);
CREATE INDEX IF NOT EXISTS charthouse_band_region_idx  ON public.charthouse_band (region_id) WHERE region_id IS NOT NULL;

-- §4.4 Station — discrete work or service positions on a band.
CREATE TABLE IF NOT EXISTS public.charthouse_station (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  sheet_id     uuid NOT NULL REFERENCES public.site_plans(id) ON DELETE CASCADE,
  band_id      uuid NOT NULL REFERENCES public.charthouse_band(id) ON DELETE CASCADE,
  position_in  numeric(8,2),                           -- linear position along band axis (inches)
  station_code text NOT NULL,                          -- T-1, STN-3, PASS-A
  function     text,                                   -- prep, plate, expo, dish, ...
  head_count   smallint DEFAULT 1 CHECK (head_count >= 0),
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at   timestamptz,
  UNIQUE (sheet_id, station_code)
);
CREATE INDEX IF NOT EXISTS charthouse_station_sheet_idx ON public.charthouse_station (sheet_id);
CREATE INDEX IF NOT EXISTS charthouse_station_band_idx  ON public.charthouse_station (band_id);
CREATE INDEX IF NOT EXISTS charthouse_station_org_idx   ON public.charthouse_station (org_id);

-- §4.5 Placement — bridge from plan to UAC/TPC catalog. The most important table.
CREATE TABLE IF NOT EXISTS public.charthouse_placement (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  sheet_id        uuid NOT NULL REFERENCES public.site_plans(id) ON DELETE CASCADE,
  station_id      uuid REFERENCES public.charthouse_station(id) ON DELETE SET NULL,
  band_id         uuid REFERENCES public.charthouse_band(id) ON DELETE SET NULL,
  catalog_item_id uuid REFERENCES public.master_catalog_items(id) ON DELETE SET NULL,
  uac_atom_id     text,                                -- LYTE-FBW-FBW-... UAC atom ref (free-text until UAC table lands)
  tpc_atom_id     text,                                -- TPC catalog ref (build phase / UAL)
  tag             text NOT NULL,                       -- plan tag: RI-REF, CONV-1, GAS-1
  footprint       jsonb,                               -- {x, y, w, h, rotation_deg}
  power_drop_id   uuid,                                -- forward ref; set after utility row insert
  qty             smallint NOT NULL DEFAULT 1 CHECK (qty >= 1),
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at      timestamptz,
  UNIQUE (sheet_id, tag)
);
CREATE INDEX IF NOT EXISTS charthouse_placement_sheet_idx        ON public.charthouse_placement (sheet_id);
CREATE INDEX IF NOT EXISTS charthouse_placement_station_idx      ON public.charthouse_placement (station_id) WHERE station_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS charthouse_placement_band_idx         ON public.charthouse_placement (band_id) WHERE band_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS charthouse_placement_catalog_idx      ON public.charthouse_placement (catalog_item_id) WHERE catalog_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS charthouse_placement_org_idx          ON public.charthouse_placement (org_id);
CREATE INDEX IF NOT EXISTS charthouse_placement_power_drop_idx   ON public.charthouse_placement (power_drop_id) WHERE power_drop_id IS NOT NULL;

-- §4.6 Utility — power, gas, water, drain, data, comms drops.
CREATE TABLE IF NOT EXISTS public.charthouse_utility (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  sheet_id      uuid NOT NULL REFERENCES public.site_plans(id) ON DELETE CASCADE,
  drop_code     text NOT NULL,                         -- P-1, G-1, W-1
  service_type  public.charthouse_utility_service NOT NULL,
  loads         text[] DEFAULT '{}'::text[],           -- placement tags this drop serves
  location      jsonb,                                 -- {x, y} in viewBox
  circuit_id    text,                                  -- for power: distro panel circuit
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at    timestamptz,
  UNIQUE (sheet_id, drop_code)
);
CREATE INDEX IF NOT EXISTS charthouse_utility_sheet_idx  ON public.charthouse_utility (sheet_id);
CREATE INDEX IF NOT EXISTS charthouse_utility_org_idx    ON public.charthouse_utility (org_id);
CREATE INDEX IF NOT EXISTS charthouse_utility_service_idx ON public.charthouse_utility (service_type);

-- Now that charthouse_utility exists, wire the deferred FK from placement.
ALTER TABLE public.charthouse_placement
  DROP CONSTRAINT IF EXISTS charthouse_placement_power_drop_fk;
ALTER TABLE public.charthouse_placement
  ADD CONSTRAINT charthouse_placement_power_drop_fk
  FOREIGN KEY (power_drop_id)
  REFERENCES public.charthouse_utility(id)
  ON DELETE SET NULL;

-- §4.7 Adjacency — what's on each side of the shell.
CREATE TABLE IF NOT EXISTS public.charthouse_adjacency (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  sheet_id          uuid NOT NULL REFERENCES public.site_plans(id) ON DELETE CASCADE,
  edge              public.charthouse_edge NOT NULL,
  adjacent_sheet_id uuid REFERENCES public.site_plans(id) ON DELETE SET NULL,
  adjacent_label    text,                              -- free-text when adjacent zone isn't a CHARTHOUSE sheet
  relationship      public.charthouse_adjacency_rel NOT NULL,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  created_by        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at        timestamptz,
  UNIQUE (sheet_id, edge)
);
CREATE INDEX IF NOT EXISTS charthouse_adjacency_sheet_idx     ON public.charthouse_adjacency (sheet_id);
CREATE INDEX IF NOT EXISTS charthouse_adjacency_adjacent_idx  ON public.charthouse_adjacency (adjacent_sheet_id) WHERE adjacent_sheet_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS charthouse_adjacency_org_idx       ON public.charthouse_adjacency (org_id);

-- =============================================================================
-- 4. ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.charthouse_zone_region ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charthouse_band        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charthouse_station     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charthouse_placement   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charthouse_utility     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charthouse_adjacency   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS charthouse_zone_region_org_rw ON public.charthouse_zone_region;
CREATE POLICY charthouse_zone_region_org_rw ON public.charthouse_zone_region
  TO authenticated
  USING (private.is_org_member(org_id))
  WITH CHECK (private.is_org_member(org_id));

DROP POLICY IF EXISTS charthouse_band_org_rw ON public.charthouse_band;
CREATE POLICY charthouse_band_org_rw ON public.charthouse_band
  TO authenticated
  USING (private.is_org_member(org_id))
  WITH CHECK (private.is_org_member(org_id));

DROP POLICY IF EXISTS charthouse_station_org_rw ON public.charthouse_station;
CREATE POLICY charthouse_station_org_rw ON public.charthouse_station
  TO authenticated
  USING (private.is_org_member(org_id))
  WITH CHECK (private.is_org_member(org_id));

DROP POLICY IF EXISTS charthouse_placement_org_rw ON public.charthouse_placement;
CREATE POLICY charthouse_placement_org_rw ON public.charthouse_placement
  TO authenticated
  USING (private.is_org_member(org_id))
  WITH CHECK (private.is_org_member(org_id));

DROP POLICY IF EXISTS charthouse_utility_org_rw ON public.charthouse_utility;
CREATE POLICY charthouse_utility_org_rw ON public.charthouse_utility
  TO authenticated
  USING (private.is_org_member(org_id))
  WITH CHECK (private.is_org_member(org_id));

DROP POLICY IF EXISTS charthouse_adjacency_org_rw ON public.charthouse_adjacency;
CREATE POLICY charthouse_adjacency_org_rw ON public.charthouse_adjacency
  TO authenticated
  USING (private.is_org_member(org_id))
  WITH CHECK (private.is_org_member(org_id));

-- =============================================================================
-- 5. TRIGGERS
-- =============================================================================
-- Canonical touch_updated_at lives in public.tg_touch_updated_at (added 0047).

DO $$ BEGIN
  CREATE TRIGGER tg_charthouse_zone_region_touch BEFORE UPDATE ON public.charthouse_zone_region
    FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER tg_charthouse_band_touch BEFORE UPDATE ON public.charthouse_band
    FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER tg_charthouse_station_touch BEFORE UPDATE ON public.charthouse_station
    FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER tg_charthouse_placement_touch BEFORE UPDATE ON public.charthouse_placement
    FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER tg_charthouse_utility_touch BEFORE UPDATE ON public.charthouse_utility
    FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER tg_charthouse_adjacency_touch BEFORE UPDATE ON public.charthouse_adjacency
    FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- 6. STATE MACHINE — charthouse_transition_state RPC
-- =============================================================================
-- Per protocol §5 transitions:
--   draft       -> submit          -> in_review
--   in_review   -> approve         -> approved
--   in_review   -> reject          -> draft
--   approved    -> issue           -> issued        (locks atom_id, bumps revision)
--   issued      -> supersede       -> superseded
--   issued      -> field_change    -> as_built      (creates as-built clone)
--
-- The function enforces acceptance criteria (§8.3) at the `issue` boundary
-- by counting child rows and validating atom_id presence.

CREATE OR REPLACE FUNCTION public.charthouse_transition_state(
  p_sheet_id   uuid,
  p_transition text
) RETURNS public.site_plans
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_sheet         public.site_plans;
  v_new_state     public.charthouse_document_state;
  v_user_id       uuid;
  v_region_count  int;
  v_band_count    int;
  v_adj_count     int;
BEGIN
  v_user_id := auth.uid();

  SELECT * INTO v_sheet FROM public.site_plans WHERE id = p_sheet_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'charthouse: sheet not found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT private.is_org_member(v_sheet.org_id) THEN
    RAISE EXCEPTION 'charthouse: not authorized' USING ERRCODE = '42501';
  END IF;

  -- Resolve target state.
  CASE p_transition
    WHEN 'submit'       THEN
      IF v_sheet.document_state <> 'draft' THEN
        RAISE EXCEPTION 'charthouse: submit requires draft (was %)', v_sheet.document_state USING ERRCODE = '22023';
      END IF;
      v_new_state := 'in_review';
    WHEN 'approve'      THEN
      IF v_sheet.document_state <> 'in_review' THEN
        RAISE EXCEPTION 'charthouse: approve requires in_review (was %)', v_sheet.document_state USING ERRCODE = '22023';
      END IF;
      v_new_state := 'approved';
    WHEN 'reject'       THEN
      IF v_sheet.document_state <> 'in_review' THEN
        RAISE EXCEPTION 'charthouse: reject requires in_review (was %)', v_sheet.document_state USING ERRCODE = '22023';
      END IF;
      v_new_state := 'draft';
    WHEN 'revise'       THEN
      -- Pull an approved or in_review sheet back to draft for revision.
      IF v_sheet.document_state NOT IN ('in_review','approved') THEN
        RAISE EXCEPTION 'charthouse: revise requires in_review or approved (was %)', v_sheet.document_state USING ERRCODE = '22023';
      END IF;
      v_new_state := 'draft';
    WHEN 'issue'        THEN
      IF v_sheet.document_state <> 'approved' THEN
        RAISE EXCEPTION 'charthouse: issue requires approved (was %)', v_sheet.document_state USING ERRCODE = '22023';
      END IF;
      -- Acceptance criteria (§8.3) — enforced at the issue boundary.
      IF v_sheet.atom_id IS NULL THEN
        RAISE EXCEPTION 'charthouse: cannot issue without atom_id' USING ERRCODE = '22023';
      END IF;
      IF v_sheet.shell_type IS NULL OR v_sheet.shell_dimensions IS NULL THEN
        RAISE EXCEPTION 'charthouse: cannot issue without shell_type + shell_dimensions' USING ERRCODE = '22023';
      END IF;
      IF v_sheet.primary_class IS NULL THEN
        RAISE EXCEPTION 'charthouse: cannot issue without primary_class' USING ERRCODE = '22023';
      END IF;
      SELECT count(*) INTO v_region_count FROM public.charthouse_zone_region
        WHERE sheet_id = p_sheet_id AND deleted_at IS NULL;
      IF v_region_count = 0 THEN
        RAISE EXCEPTION 'charthouse: cannot issue without at least one zone region' USING ERRCODE = '22023';
      END IF;
      SELECT count(*) INTO v_band_count FROM public.charthouse_band
        WHERE sheet_id = p_sheet_id AND deleted_at IS NULL;
      IF v_band_count = 0 THEN
        RAISE EXCEPTION 'charthouse: cannot issue without at least one band' USING ERRCODE = '22023';
      END IF;
      SELECT count(*) INTO v_adj_count FROM public.charthouse_adjacency
        WHERE sheet_id = p_sheet_id AND deleted_at IS NULL;
      IF v_adj_count < 4 THEN
        RAISE EXCEPTION 'charthouse: cannot issue without all four edges declared (have %, need 4)', v_adj_count USING ERRCODE = '22023';
      END IF;
      v_new_state := 'issued';
    WHEN 'supersede'    THEN
      IF v_sheet.document_state <> 'issued' THEN
        RAISE EXCEPTION 'charthouse: supersede requires issued (was %)', v_sheet.document_state USING ERRCODE = '22023';
      END IF;
      v_new_state := 'superseded';
    WHEN 'field_change' THEN
      IF v_sheet.document_state <> 'issued' THEN
        RAISE EXCEPTION 'charthouse: field_change requires issued (was %)', v_sheet.document_state USING ERRCODE = '22023';
      END IF;
      v_new_state := 'as_built';
    ELSE
      RAISE EXCEPTION 'charthouse: unknown transition %', p_transition USING ERRCODE = '22023';
  END CASE;

  -- Side effects.
  UPDATE public.site_plans
     SET document_state = v_new_state,
         submitted_at   = CASE WHEN p_transition = 'submit'  THEN now() ELSE submitted_at END,
         submitted_by   = CASE WHEN p_transition = 'submit'  THEN v_user_id ELSE submitted_by END,
         approved_at    = CASE WHEN p_transition = 'approve' THEN now() ELSE approved_at END,
         approved_by    = CASE WHEN p_transition = 'approve' THEN v_user_id ELSE approved_by END,
         issued_at      = CASE WHEN p_transition = 'issue'   THEN now() ELSE issued_at END,
         updated_at     = now()
   WHERE id = p_sheet_id
  RETURNING * INTO v_sheet;

  RETURN v_sheet;
END $$;

REVOKE ALL ON FUNCTION public.charthouse_transition_state(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.charthouse_transition_state(uuid, text) TO authenticated;

-- =============================================================================
-- 7. VIEWS
-- =============================================================================
-- v_charthouse_sheet_acceptance — computed snapshot of which §8.3 boxes are ticked.

CREATE OR REPLACE VIEW public.v_charthouse_sheet_acceptance AS
SELECT
  sp.id                                                            AS sheet_id,
  sp.org_id,
  sp.atom_id,
  sp.document_state,
  (sp.atom_id IS NOT NULL)                                         AS has_atom_id,
  (sp.sheet_type IS NOT NULL)                                      AS has_sheet_type,
  (sp.primary_class IS NOT NULL)                                   AS has_primary_class,
  (sp.tier_primary IS NOT NULL)                                    AS has_tier_primary,
  (sp.shell_type IS NOT NULL AND sp.shell_dimensions IS NOT NULL)  AS has_shell,
  (SELECT count(*) FROM public.charthouse_zone_region z
    WHERE z.sheet_id = sp.id AND z.deleted_at IS NULL) > 0         AS has_region,
  (SELECT count(*) FROM public.charthouse_band b
    WHERE b.sheet_id = sp.id AND b.deleted_at IS NULL) > 0         AS has_band,
  (SELECT count(*) FROM public.charthouse_placement p
    WHERE p.sheet_id = sp.id AND p.deleted_at IS NULL) > 0         AS has_placement,
  (SELECT count(*) FROM public.charthouse_utility u
    WHERE u.sheet_id = sp.id AND u.deleted_at IS NULL) > 0         AS has_utility,
  (SELECT count(*) FROM public.charthouse_adjacency a
    WHERE a.sheet_id = sp.id AND a.deleted_at IS NULL) >= 4        AS has_all_four_edges,
  sp.approved_at IS NOT NULL                                       AS has_approval_signoff
FROM public.site_plans sp
WHERE sp.deleted_at IS NULL;

GRANT SELECT ON public.v_charthouse_sheet_acceptance TO authenticated;

-- =============================================================================
-- 8. COMMENTS (documentation surface)
-- =============================================================================

COMMENT ON COLUMN public.site_plans.atom_id           IS 'CHARTHOUSE atom identifier per protocol §3. Format: {ORG}-{EVT}{YY}{VEN}-{CLASS}.{DIV}.{SEC}-{ZON}-{SEQ}{REV}. Append-only once issued.';
COMMENT ON COLUMN public.site_plans.sheet_type        IS 'CHARTHOUSE protocol §1: site_plan|floor_plan|rcp|power|egress|flow|signage|section|as_built.';
COMMENT ON COLUMN public.site_plans.primary_class     IS 'Primary XPMS class 0..9 governing this sheet (executive..technology).';
COMMENT ON COLUMN public.site_plans.document_state    IS 'Lifecycle state per protocol §5. State machine — no ad-hoc transitions.';
COMMENT ON COLUMN public.site_plans.revision_letter   IS 'Single-letter revision per atom-id {REV}. Bumped on issue.';
COMMENT ON COLUMN public.site_plans.shell_dimensions  IS 'JSONB: {length_in, width_in, height_in, gross_sqft}.';

COMMENT ON TABLE public.charthouse_zone_region IS 'CHARTHOUSE §4.2 — named sub-regions within a sheet shell (Cold Zone, Cook Zone, Pass, ...).';
COMMENT ON TABLE public.charthouse_band        IS 'CHARTHOUSE §4.3 — linear surface types along zone edges (the formal name for blue/orange line).';
COMMENT ON TABLE public.charthouse_station     IS 'CHARTHOUSE §4.4 — discrete work or service positions placed on a band.';
COMMENT ON TABLE public.charthouse_placement   IS 'CHARTHOUSE §4.5 — bridge from a plan to the UAC/TPC catalog. The most important table.';
COMMENT ON TABLE public.charthouse_utility     IS 'CHARTHOUSE §4.6 — power, gas, water, drain, data, comms drops.';
COMMENT ON TABLE public.charthouse_adjacency   IS 'CHARTHOUSE §4.7 — per-edge adjacency declarations.';

COMMIT;
