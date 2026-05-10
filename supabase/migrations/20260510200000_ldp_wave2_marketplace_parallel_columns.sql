-- LDP Wave 2 — Marketplace tables: add canonical *_phase / *_state columns
-- alongside the legacy `status` columns established in 0002_marketplace_canon.sql.
--
-- Why parallel columns, not a rename?
--   The five marketplace tables have 20+ TypeScript call sites using
--   .select("..., status") and .eq("status", "...") string queries.
--   The LooseSupabase pattern used for these tables means the TypeScript
--   compiler doesn't enforce column names at build time, so a rename
--   would produce silent runtime 400s (PostgREST returns no rows instead
--   of an error for unknown column names in select). The established
--   pattern for this scenario (used for accounting_periods and
--   fabrication_orders) is: add the canonical column, sync via trigger,
--   keep the legacy `status` column for back-compat reads.
--
-- Mapping:
--   open_calls.status          (open_call_status) → open_call_phase
--   open_call_submissions.status (submission_status) → submission_state
--   talent_offers.status       (talent_offer_status) → talent_offer_state
--   job_postings.status        (job_posting_status) → job_posting_phase
--   job_applications.status    (job_application_status) → job_application_state
--
-- Each canonical column is:
--   - typed with the existing enum (same values)
--   - NOT NULL, default matches the existing default
--   - backfilled from status
--   - kept in sync by a BEFORE UPDATE trigger (bidirectional: whichever column
--     is written, the other is mirrored so existing and new code both work)
--
-- LDP discipline (CLAUDE.md §Conventions):
--   *_phase = sequential macro arc (draft→published→closed→archived)
--   *_state = cyclical operational (submitted→shortlisted→rejected etc.)
--
-- All operations are IF NOT EXISTS / idempotent — safe to re-apply.

-- ============================================================================
-- 1. open_calls → open_call_phase
-- ============================================================================

ALTER TABLE public.open_calls
  ADD COLUMN IF NOT EXISTS open_call_phase public.open_call_status
    NOT NULL DEFAULT 'draft'::public.open_call_status;

-- Backfill from status (no-op on re-run because default already matches)
UPDATE public.open_calls SET open_call_phase = status WHERE open_call_phase <> status;

CREATE INDEX IF NOT EXISTS idx_open_calls_open_call_phase
  ON public.open_calls (open_call_phase, published_at DESC) WHERE open_call_phase = 'published';

CREATE OR REPLACE FUNCTION private.sync_open_call_phase() RETURNS trigger
  LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.open_call_phase := NEW.status;
  ELSIF NEW.open_call_phase IS DISTINCT FROM OLD.open_call_phase THEN
    NEW.status := NEW.open_call_phase;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS open_calls_sync_phase ON public.open_calls;
CREATE TRIGGER open_calls_sync_phase
  BEFORE UPDATE ON public.open_calls
  FOR EACH ROW EXECUTE FUNCTION private.sync_open_call_phase();

COMMENT ON COLUMN public.open_calls.open_call_phase IS
  'LDP §NAMING DISCIPLINE — canonical phase column (Wave 2). Mirrors open_calls.status; use this column in new code.';

-- ============================================================================
-- 2. open_call_submissions → submission_state
-- ============================================================================

ALTER TABLE public.open_call_submissions
  ADD COLUMN IF NOT EXISTS submission_state public.submission_status
    NOT NULL DEFAULT 'submitted'::public.submission_status;

UPDATE public.open_call_submissions SET submission_state = status WHERE submission_state <> status;

CREATE INDEX IF NOT EXISTS idx_open_call_submissions_submission_state
  ON public.open_call_submissions (open_call_id, submission_state);

CREATE OR REPLACE FUNCTION private.sync_submission_state() RETURNS trigger
  LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.submission_state := NEW.status;
  ELSIF NEW.submission_state IS DISTINCT FROM OLD.submission_state THEN
    NEW.status := NEW.submission_state;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS open_call_submissions_sync_state ON public.open_call_submissions;
CREATE TRIGGER open_call_submissions_sync_state
  BEFORE UPDATE ON public.open_call_submissions
  FOR EACH ROW EXECUTE FUNCTION private.sync_submission_state();

COMMENT ON COLUMN public.open_call_submissions.submission_state IS
  'LDP §NAMING DISCIPLINE — canonical state column (Wave 2). Mirrors open_call_submissions.status; use this column in new code.';

-- ============================================================================
-- 3. talent_offers → talent_offer_state
-- ============================================================================

ALTER TABLE public.talent_offers
  ADD COLUMN IF NOT EXISTS talent_offer_state public.talent_offer_status
    NOT NULL DEFAULT 'draft'::public.talent_offer_status;

UPDATE public.talent_offers SET talent_offer_state = status WHERE talent_offer_state <> status;

CREATE INDEX IF NOT EXISTS idx_talent_offers_talent_offer_state
  ON public.talent_offers (org_id, talent_offer_state, performance_date);

CREATE OR REPLACE FUNCTION private.sync_talent_offer_state() RETURNS trigger
  LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.talent_offer_state := NEW.status;
  ELSIF NEW.talent_offer_state IS DISTINCT FROM OLD.talent_offer_state THEN
    NEW.status := NEW.talent_offer_state;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS talent_offers_sync_state ON public.talent_offers;
CREATE TRIGGER talent_offers_sync_state
  BEFORE UPDATE ON public.talent_offers
  FOR EACH ROW EXECUTE FUNCTION private.sync_talent_offer_state();

COMMENT ON COLUMN public.talent_offers.talent_offer_state IS
  'LDP §NAMING DISCIPLINE — canonical state column (Wave 2). Mirrors talent_offers.status; use this column in new code.';

-- ============================================================================
-- 4. job_postings → job_posting_phase
-- ============================================================================

ALTER TABLE public.job_postings
  ADD COLUMN IF NOT EXISTS job_posting_phase public.job_posting_status
    NOT NULL DEFAULT 'draft'::public.job_posting_status;

UPDATE public.job_postings SET job_posting_phase = status WHERE job_posting_phase <> status;

CREATE INDEX IF NOT EXISTS idx_job_postings_job_posting_phase
  ON public.job_postings (job_posting_phase, published_at DESC)
  WHERE job_posting_phase = 'published' AND deleted_at IS NULL;

CREATE OR REPLACE FUNCTION private.sync_job_posting_phase() RETURNS trigger
  LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.job_posting_phase := NEW.status;
  ELSIF NEW.job_posting_phase IS DISTINCT FROM OLD.job_posting_phase THEN
    NEW.status := NEW.job_posting_phase;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS job_postings_sync_phase ON public.job_postings;
CREATE TRIGGER job_postings_sync_phase
  BEFORE UPDATE ON public.job_postings
  FOR EACH ROW EXECUTE FUNCTION private.sync_job_posting_phase();

COMMENT ON COLUMN public.job_postings.job_posting_phase IS
  'LDP §NAMING DISCIPLINE — canonical phase column (Wave 2). Mirrors job_postings.status; use this column in new code.';

-- ============================================================================
-- 5. job_applications → job_application_state
-- ============================================================================

ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS job_application_state public.job_application_status
    NOT NULL DEFAULT 'new'::public.job_application_status;

UPDATE public.job_applications SET job_application_state = status WHERE job_application_state <> status;

CREATE INDEX IF NOT EXISTS idx_job_applications_job_application_state
  ON public.job_applications (job_posting_id, job_application_state, applied_at DESC);

CREATE OR REPLACE FUNCTION private.sync_job_application_state() RETURNS trigger
  LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.job_application_state := NEW.status;
  ELSIF NEW.job_application_state IS DISTINCT FROM OLD.job_application_state THEN
    NEW.status := NEW.job_application_state;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS job_applications_sync_state ON public.job_applications;
CREATE TRIGGER job_applications_sync_state
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION private.sync_job_application_state();

COMMENT ON COLUMN public.job_applications.job_application_state IS
  'LDP §NAMING DISCIPLINE — canonical state column (Wave 2). Mirrors job_applications.status; use this column in new code.';
