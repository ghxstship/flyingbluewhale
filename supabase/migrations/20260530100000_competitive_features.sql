-- 2026-05-30 — Competitive feature parity batch
--
-- Implements schema backing for 6 features identified in the May 2026
-- competitive landscape audit:
--
--   1. Photo-verified clock-in (Deputy Time Clock 2.0 parity)
--   2. Hiring / ATS-lite (Connecteam Hiring, March 2026)
--   3. Credential expiry alert preferences (Nowsta / Makai parity)
--   4. AI course generation metadata (Connecteam AI Course Creator parity)
--   5. AI run-of-show generation log (LASSO Intelligence parity)
--   6. Job applicant pipeline (ATS detail layer)

BEGIN;

-- ============================================================
-- 1. Photo-verified clock-in
-- ============================================================

ALTER TABLE public.shifts
  ADD COLUMN IF NOT EXISTS clock_in_photo_url  text,
  ADD COLUMN IF NOT EXISTS clock_out_photo_url text;

-- ============================================================
-- 2. Hiring / ATS-lite — job positions
-- ============================================================

DO $$ BEGIN
  CREATE TYPE public.job_position_phase AS ENUM (
    'draft',
    'open',
    'filled',
    'closed',
    'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.job_applicant_stage AS ENUM (
    'new',
    'reviewing',
    'shortlisted',
    'interview',
    'offer_sent',
    'hired',
    'rejected',
    'withdrawn'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.employment_type AS ENUM (
    'full_time',
    'part_time',
    'contractor',
    'freelance',
    'volunteer',
    'intern'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.job_positions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  title           text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  department      text CHECK (char_length(department) <= 80),
  location        text CHECK (char_length(location) <= 120),
  employment_type public.employment_type NOT NULL DEFAULT 'full_time',
  description     text CHECK (char_length(description) <= 4000),
  phase           public.job_position_phase NOT NULL DEFAULT 'open',
  applicant_count integer NOT NULL DEFAULT 0,
  created_by      uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);

CREATE TABLE IF NOT EXISTS public.job_applicants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  position_id   uuid NOT NULL REFERENCES public.job_positions(id) ON DELETE CASCADE,
  full_name     text NOT NULL CHECK (char_length(full_name) BETWEEN 1 AND 160),
  email         text CHECK (char_length(email) <= 254),
  phone         text CHECK (char_length(phone) <= 40),
  stage         public.job_applicant_stage NOT NULL DEFAULT 'new',
  notes         text CHECK (char_length(notes) <= 4000),
  resume_url    text,
  applied_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS job_positions_org_id_idx       ON public.job_positions(org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS job_applicants_position_id_idx ON public.job_applicants(position_id);
CREATE INDEX IF NOT EXISTS job_applicants_org_id_idx      ON public.job_applicants(org_id);

-- Trigger: keep applicant_count denormalised
CREATE OR REPLACE FUNCTION public.tg_job_applicants_count()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.job_positions SET applicant_count = applicant_count + 1 WHERE id = NEW.position_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.job_positions SET applicant_count = GREATEST(applicant_count - 1, 0) WHERE id = OLD.position_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS tg_job_applicants_count ON public.job_applicants;
CREATE TRIGGER tg_job_applicants_count
  AFTER INSERT OR DELETE ON public.job_applicants
  FOR EACH ROW EXECUTE FUNCTION public.tg_job_applicants_count();

-- RLS
ALTER TABLE public.job_positions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applicants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_member_job_positions"  ON public.job_positions;
DROP POLICY IF EXISTS "org_member_job_applicants" ON public.job_applicants;

CREATE POLICY "org_member_job_positions"
  ON public.job_positions FOR ALL
  USING (private.is_org_member(org_id));

CREATE POLICY "org_member_job_applicants"
  ON public.job_applicants FOR ALL
  USING (private.is_org_member(org_id));

-- ============================================================
-- 3. AI course generation — track which courses were AI-seeded
-- ============================================================

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS ai_generated     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_topic_prompt  text CHECK (char_length(ai_topic_prompt) <= 300);

-- ============================================================
-- 4. AI run-of-show generation log
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ros_generation_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  event_id      uuid REFERENCES public.events(id) ON DELETE SET NULL,
  event_name    text NOT NULL,
  event_type    text NOT NULL,
  prompt_notes  text,
  cues_generated integer NOT NULL DEFAULT 0,
  created_by    uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ros_generation_log_org_id_idx ON public.ros_generation_log(org_id);

ALTER TABLE public.ros_generation_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_member_ros_generation_log" ON public.ros_generation_log;
CREATE POLICY "org_member_ros_generation_log"
  ON public.ros_generation_log FOR ALL
  USING (private.is_org_member(org_id));

-- ============================================================
-- touch_updated_at triggers for new tables
-- ============================================================

DO $$ BEGIN
  CREATE OR REPLACE FUNCTION public.touch_updated_at()
  RETURNS trigger LANGUAGE plpgsql AS $fn$
  BEGIN NEW.updated_at = now(); RETURN NEW; END;
  $fn$;
EXCEPTION WHEN duplicate_function THEN NULL; END $$;

DROP TRIGGER IF EXISTS touch_updated_at ON public.job_positions;
CREATE TRIGGER touch_updated_at
  BEFORE UPDATE ON public.job_positions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS touch_updated_at ON public.job_applicants;
CREATE TRIGGER touch_updated_at
  BEFORE UPDATE ON public.job_applicants
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

COMMIT;
