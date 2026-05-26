-- Round 44 — Weather on daily logs + warranties + reality capture
--
-- Per construction-pm-parity Waves 4.1, 4.4, plus G-025. Three small
-- spines consolidated into one migration:
--   - Weather columns on daily_logs (auto-pull source).
--   - warranties + warranty_reminders for closeout coverage tracking.
--   - reality_captures + reality_capture_anchors for OpenSpace /
--     DroneDeploy / Matterport / 360° integration.

BEGIN;

-- =============================================================================
-- 1. Weather on daily_logs (additive — defaults preserve existing rows)
-- =============================================================================

ALTER TABLE public.daily_logs
  ADD COLUMN IF NOT EXISTS weather_temp_high_f   numeric(5,1),
  ADD COLUMN IF NOT EXISTS weather_temp_low_f    numeric(5,1),
  ADD COLUMN IF NOT EXISTS weather_precip_in     numeric(5,2),
  ADD COLUMN IF NOT EXISTS weather_wind_mph      numeric(5,1),
  ADD COLUMN IF NOT EXISTS weather_conditions    text,
  -- 'nws' (US National Weather Service) | 'openweathermap' | 'manual' | null.
  ADD COLUMN IF NOT EXISTS weather_source        text,
  ADD COLUMN IF NOT EXISTS weather_pulled_at     timestamptz;

CREATE INDEX IF NOT EXISTS daily_logs_weather_source_idx
  ON public.daily_logs (weather_source) WHERE weather_source IS NOT NULL;

COMMENT ON COLUMN public.daily_logs.weather_source IS
  'How the weather was captured. NWS API is primary in the US; OpenWeatherMap fallback for non-US sites.';

-- =============================================================================
-- 2. WARRANTIES
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE public.warranty_state AS ENUM (
    'active',
    'expiring_soon',   -- < 30 days
    'expired',
    'voided'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.warranties (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  project_id      uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  -- Free-text label and asset reference; full equipment-table FK is optional.
  name            text NOT NULL,
  -- Optional links into existing inventory + procurement records.
  equipment_id    uuid REFERENCES public.equipment(id) ON DELETE SET NULL,
  vendor_id       uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  spec_section_id uuid REFERENCES public.spec_sections(id) ON DELETE SET NULL,
  -- Coverage.
  coverage_summary_md text,
  start_date      date NOT NULL,
  end_date        date NOT NULL,
  duration_months int,                                -- for display; derived from dates
  warranty_state  public.warranty_state NOT NULL DEFAULT 'active',
  -- Vendor contact + claim info captured upfront.
  warrantor_name  text,
  warrantor_email text,
  warrantor_phone text,
  -- File reference into the docs bucket.
  document_path   text,
  notes           text,
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);

CREATE INDEX IF NOT EXISTS warranties_org_idx ON public.warranties (org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS warranties_project_idx ON public.warranties (project_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS warranties_equipment_idx ON public.warranties (equipment_id) WHERE equipment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS warranties_vendor_idx ON public.warranties (vendor_id) WHERE vendor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS warranties_spec_section_idx ON public.warranties (spec_section_id) WHERE spec_section_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS warranties_state_idx
  ON public.warranties (warranty_state) WHERE warranty_state IN ('active','expiring_soon');
CREATE INDEX IF NOT EXISTS warranties_end_date_idx ON public.warranties (end_date) WHERE warranty_state IN ('active','expiring_soon');
CREATE INDEX IF NOT EXISTS warranties_created_by_idx ON public.warranties (created_by);

COMMENT ON TABLE public.warranties IS
  'Warranty coverage for installed assets / systems / vendor work. warranty_state advances via a nightly batch (active → expiring_soon → expired).';

CREATE TABLE IF NOT EXISTS public.warranty_reminders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  warranty_id     uuid NOT NULL REFERENCES public.warranties(id) ON DELETE CASCADE,
  -- e.g. 1-year, 30-day, 7-day reminder slots.
  remind_at       timestamptz NOT NULL,
  reminder_type   text NOT NULL,            -- 'anniversary' | 'expiry_30d' | 'expiry_7d' | 'custom'
  notes           text,
  sent_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS warranty_reminders_warranty_idx ON public.warranty_reminders (warranty_id);
CREATE INDEX IF NOT EXISTS warranty_reminders_remind_at_idx
  ON public.warranty_reminders (remind_at) WHERE sent_at IS NULL;
CREATE INDEX IF NOT EXISTS warranty_reminders_org_idx ON public.warranty_reminders (org_id);

COMMENT ON TABLE public.warranty_reminders IS
  'Scheduled push/email reminders ahead of expiry. The dispatch worker selects rows where remind_at <= now() AND sent_at IS NULL.';

-- =============================================================================
-- 3. REALITY CAPTURES (OpenSpace / DroneDeploy / Matterport / 360°)
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE public.reality_capture_source AS ENUM (
    'openspace',
    'dronedeploy',
    'structionsite',
    'matterport',
    'huddle_cam',
    'manual_360',
    'drone_photo',
    'satellite'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.reality_capture_state AS ENUM (
    'pending_upload',
    'processing',
    'ready',
    'failed',
    'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.reality_captures (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  project_id      uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  source          public.reality_capture_source NOT NULL,
  -- Vendor-side identifier (OpenSpace job ID, DroneDeploy flight ID,
  -- Matterport space ID). Used for webhook + deep-link.
  external_id     text,
  external_url    text,                        -- viewer URL on the partner platform
  name            text NOT NULL,
  capture_date    date,
  capture_state   public.reality_capture_state NOT NULL DEFAULT 'pending_upload',
  -- Geometry summary; full payloads live with the partner.
  approximate_sqft int,
  panorama_count  int,
  thumbnail_url   text,
  notes           text,
  uploaded_by     uuid REFERENCES auth.users(id),
  uploaded_at     timestamptz NOT NULL DEFAULT now(),
  processed_at    timestamptz,
  failed_reason   text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);

CREATE INDEX IF NOT EXISTS reality_captures_org_idx ON public.reality_captures (org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS reality_captures_project_idx ON public.reality_captures (project_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS reality_captures_source_idx ON public.reality_captures (source);
CREATE INDEX IF NOT EXISTS reality_captures_state_idx
  ON public.reality_captures (capture_state) WHERE capture_state IN ('pending_upload','processing');
CREATE INDEX IF NOT EXISTS reality_captures_capture_date_idx ON public.reality_captures (capture_date);
CREATE INDEX IF NOT EXISTS reality_captures_uploaded_by_idx ON public.reality_captures (uploaded_by);

COMMENT ON TABLE public.reality_captures IS
  'Site-walk / drone / matterport captures. Heavy assets live with the partner platform; rows here are anchors for cross-reference + RFI/punch links.';

CREATE TABLE IF NOT EXISTS public.reality_capture_anchors (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id             uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  reality_capture_id uuid NOT NULL REFERENCES public.reality_captures(id) ON DELETE CASCADE,
  -- Anchor a panorama / image / point to a sheet so the viewer can click
  -- the floor-plan icon and jump to the capture.
  site_plan_id       uuid REFERENCES public.site_plans(id) ON DELETE SET NULL,
  panorama_index     int,
  x                  numeric(10,4),
  y                  numeric(10,4),
  yaw_deg            numeric(7,2),
  captured_at        timestamptz,
  external_anchor_id text,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reality_capture_anchors_capture_idx
  ON public.reality_capture_anchors (reality_capture_id);
CREATE INDEX IF NOT EXISTS reality_capture_anchors_site_plan_idx
  ON public.reality_capture_anchors (site_plan_id) WHERE site_plan_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS reality_capture_anchors_org_idx ON public.reality_capture_anchors (org_id);

COMMENT ON TABLE public.reality_capture_anchors IS
  'Pin-on-plan anchors for panoramas/images inside a capture. site_plan_id ties to the canonical drawing sheet for visual cross-ref.';

-- =============================================================================
-- 4. updated_at triggers
-- =============================================================================

CREATE OR REPLACE FUNCTION public.touch_round44_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_warranties_touch ON public.warranties;
CREATE TRIGGER trg_warranties_touch BEFORE UPDATE ON public.warranties
  FOR EACH ROW EXECUTE FUNCTION public.touch_round44_updated_at();

DROP TRIGGER IF EXISTS trg_reality_captures_touch ON public.reality_captures;
CREATE TRIGGER trg_reality_captures_touch BEFORE UPDATE ON public.reality_captures
  FOR EACH ROW EXECUTE FUNCTION public.touch_round44_updated_at();

-- =============================================================================
-- 5. RLS
-- =============================================================================

ALTER TABLE public.warranties               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_reminders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reality_captures         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reality_capture_anchors  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS warranties_org_select ON public.warranties;
CREATE POLICY warranties_org_select ON public.warranties FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS warranties_org_write ON public.warranties;
CREATE POLICY warranties_org_write ON public.warranties FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

DROP POLICY IF EXISTS warranty_reminders_org_select ON public.warranty_reminders;
CREATE POLICY warranty_reminders_org_select ON public.warranty_reminders FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS warranty_reminders_org_write ON public.warranty_reminders;
CREATE POLICY warranty_reminders_org_write ON public.warranty_reminders FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

DROP POLICY IF EXISTS reality_captures_org_select ON public.reality_captures;
CREATE POLICY reality_captures_org_select ON public.reality_captures FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS reality_captures_org_write ON public.reality_captures;
CREATE POLICY reality_captures_org_write ON public.reality_captures FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

DROP POLICY IF EXISTS reality_capture_anchors_org_select ON public.reality_capture_anchors;
CREATE POLICY reality_capture_anchors_org_select ON public.reality_capture_anchors FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS reality_capture_anchors_org_write ON public.reality_capture_anchors;
CREATE POLICY reality_capture_anchors_org_write ON public.reality_capture_anchors FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

COMMIT;
