-- R-LDP-v2-5 Wave A: data_export_jobs.status -> run_state, typed.
-- 0 rows, 0 src/ refs. Clean rename.

BEGIN;

CREATE TYPE public.export_job_state AS ENUM (
  'pending',
  'running',
  'succeeded',
  'failed',
  'expired'
);
ALTER TYPE public.export_job_state OWNER TO postgres;

ALTER TABLE public.data_export_jobs
  DROP CONSTRAINT data_export_jobs_status_check;

ALTER TABLE public.data_export_jobs
  RENAME COLUMN status TO run_state;

ALTER TABLE public.data_export_jobs
  ALTER COLUMN run_state TYPE public.export_job_state
  USING (run_state::public.export_job_state);

COMMIT;
