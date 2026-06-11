-- Recovered from supabase_migrations.schema_migrations (applied remotely via
-- MCP without a repo file — readiness run repo/remote alignment, 2026-06-11).
ALTER TABLE shifts
  ADD COLUMN IF NOT EXISTS worker_confirmed_at timestamptz;

COMMENT ON COLUMN shifts.worker_confirmed_at IS
  'Set when the scheduled worker explicitly confirms attendance via /m. NULL = not yet confirmed.';
