-- GDPR retention automation — schedule the two lifecycle jobs that were
-- written but never wired to a scheduler:
--   (a) private.redact_audit_log_pii()  — nulls audit_events.actor_email past
--       the 90-day retention window (Art. 5(1)(c) storage limitation).
--   (b) private.purge_deleted_accounts() — finalizes Art. 17 erasure for users
--       whose 30-day grace window has elapsed.
--
-- The purge previously lived ONLY in a Supabase Edge Function that nothing
-- invoked. We port it into a SECURITY DEFINER SQL function (owned by postgres,
-- so it can hard-delete from auth.users) and schedule it with pg_cron. This is
-- the most reliable mechanism: no network hop, no worker token, no edge-function
-- cold start — it runs inside the database on the same WAL as the data it erases.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;   -- available for net.http_post fallback if ever needed

-- ── Cron-run audit/visibility table ─────────────────────────────────────────
-- Every scheduled run writes exactly one row: success counts OR the error text.
-- This is the failure-alerting surface (poll WHERE error IS NOT NULL).
CREATE TABLE IF NOT EXISTS private.cron_run_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name    text        NOT NULL,
  ran_at      timestamptz NOT NULL DEFAULT now(),
  duration_ms integer,
  succeeded   boolean     NOT NULL,
  details     jsonb       NOT NULL DEFAULT '{}'::jsonb,
  error       text
);
COMMENT ON TABLE private.cron_run_log IS
  'One row per scheduled GDPR-lifecycle job run. Failure-alerting surface: rows WHERE succeeded=false / error IS NOT NULL.';
CREATE INDEX IF NOT EXISTS cron_run_log_job_ran_idx ON private.cron_run_log (job_name, ran_at DESC);
CREATE INDEX IF NOT EXISTS cron_run_log_failed_idx  ON private.cron_run_log (ran_at DESC) WHERE NOT succeeded;

ALTER TABLE private.cron_run_log ENABLE ROW LEVEL SECURITY;
-- Deny-all by default (private schema, service-role only) — no policies added.

-- ── Account purge (ported from supabase/functions/purge-deleted-accounts) ────
CREATE OR REPLACE FUNCTION private.purge_deleted_accounts()
  RETURNS TABLE(purged integer, failed integer)
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'auth', 'pg_temp'
AS $$
DECLARE
  v_started   timestamptz := clock_timestamp();
  v_user      RECORD;
  v_purged    int := 0;
  v_failed    int := 0;
  v_fail_ids  uuid[] := '{}';
  v_err       text;
BEGIN
  -- Due = soft-deleted and the 30-day grace sentinel has elapsed.
  FOR v_user IN
    SELECT id FROM public.users
    WHERE deleted_at IS NOT NULL AND deleted_at <= now()
  LOOP
    BEGIN
      -- Belt-and-suspenders re-scrub (the request endpoint already scrubbed,
      -- but a row could have been restored+re-deleted, or predate the scrub).
      -- FK ON DELETE SET NULL/CASCADE (migration 20260625182657) handles every
      -- referencing row; we only need to remove the identity rows themselves.
      UPDATE public.users
         SET email = 'deleted-' || id || '@deleted.invalid',
             name = 'Deleted user',
             avatar_url = NULL
       WHERE id = v_user.id;

      DELETE FROM public.users WHERE id = v_user.id;
      DELETE FROM auth.users   WHERE id = v_user.id;

      v_purged := v_purged + 1;
    EXCEPTION WHEN OTHERS THEN
      -- One bad row must not abort the batch. Record + continue.
      v_failed := v_failed + 1;
      v_fail_ids := v_fail_ids || v_user.id;
    END;
  END LOOP;

  INSERT INTO private.cron_run_log(job_name, duration_ms, succeeded, details)
  VALUES (
    'purge_deleted_accounts',
    (extract(epoch FROM clock_timestamp() - v_started) * 1000)::int,
    v_failed = 0,
    jsonb_build_object('purged', v_purged, 'failed', v_failed, 'failed_ids', to_jsonb(v_fail_ids))
  );

  RETURN QUERY SELECT v_purged, v_failed;
EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
  INSERT INTO private.cron_run_log(job_name, duration_ms, succeeded, error)
  VALUES ('purge_deleted_accounts',
          (extract(epoch FROM clock_timestamp() - v_started) * 1000)::int,
          false, v_err);
  RAISE;
END;
$$;
ALTER FUNCTION private.purge_deleted_accounts() OWNER TO postgres;
REVOKE ALL ON FUNCTION private.purge_deleted_accounts() FROM PUBLIC, anon, authenticated;
COMMENT ON FUNCTION private.purge_deleted_accounts() IS
  'GDPR Art. 17 finalizer. Hard-deletes public.users + auth.users for accounts past their 30-day grace window; FK ON DELETE rules erase/sever all referencing rows. Idempotent, batch-safe (per-row exception capture), logs to private.cron_run_log. Scheduled via pg_cron.';

-- ── Logged wrapper for the redaction fn (so failures land in cron_run_log) ───
CREATE OR REPLACE FUNCTION private.run_audit_redaction()
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_started timestamptz := clock_timestamp();
  v_redacted int;
  v_cutoff timestamptz;
  v_err text;
BEGIN
  SELECT redacted, cutoff INTO v_redacted, v_cutoff FROM private.redact_audit_log_pii();
  INSERT INTO private.cron_run_log(job_name, duration_ms, succeeded, details)
  VALUES ('redact_audit_log_pii',
          (extract(epoch FROM clock_timestamp() - v_started) * 1000)::int,
          true,
          jsonb_build_object('redacted', v_redacted, 'cutoff', v_cutoff));
EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
  INSERT INTO private.cron_run_log(job_name, duration_ms, succeeded, error)
  VALUES ('redact_audit_log_pii',
          (extract(epoch FROM clock_timestamp() - v_started) * 1000)::int,
          false, v_err);
  RAISE;
END;
$$;
ALTER FUNCTION private.run_audit_redaction() OWNER TO postgres;
REVOKE ALL ON FUNCTION private.run_audit_redaction() FROM PUBLIC, anon, authenticated;
COMMENT ON FUNCTION private.run_audit_redaction() IS
  'Logged wrapper around private.redact_audit_log_pii() — records each run (count, cutoff, or error) to private.cron_run_log. Scheduled via pg_cron.';

-- ── Schedules ───────────────────────────────────────────────────────────────
-- Unschedule first so this migration is re-runnable without "job already exists".
DO $$
BEGIN
  PERFORM cron.unschedule('gdpr-redact-audit-pii')   WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='gdpr-redact-audit-pii');
  PERFORM cron.unschedule('gdpr-purge-accounts')     WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='gdpr-purge-accounts');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Audit-email redaction: daily 02:30 UTC.
SELECT cron.schedule('gdpr-redact-audit-pii', '30 2 * * *',
  $cron$ SELECT private.run_audit_redaction(); $cron$);

-- Account purge: daily 03:00 UTC (after redaction, low-traffic window).
SELECT cron.schedule('gdpr-purge-accounts', '0 3 * * *',
  $cron$ SELECT private.purge_deleted_accounts(); $cron$);
