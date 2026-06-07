-- Round 12: extend notifications with inbox-zero discipline fields.
-- The notifications table already plays the role of the unified inbox;
-- we just need richer per-row state to support snooze, mark-done, and
-- source-keyed idempotency.

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS done_at timestamptz,
  ADD COLUMN IF NOT EXISTS snoozed_until timestamptz,
  ADD COLUMN IF NOT EXISTS source_type text,
  ADD COLUMN IF NOT EXISTS source_id uuid,
  ADD COLUMN IF NOT EXISTS actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Partial unique: same logical event collapses into one inbox row per
-- user. Without this, every retry / fan-out duplicates rows.
CREATE UNIQUE INDEX IF NOT EXISTS notifications_source_uniq
  ON public.notifications (user_id, source_type, source_id)
  WHERE source_type IS NOT NULL AND source_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS notifications_inbox_idx
  ON public.notifications (user_id, created_at DESC)
  WHERE deleted_at IS NULL AND done_at IS NULL;

CREATE INDEX IF NOT EXISTS notifications_snoozed_idx
  ON public.notifications (user_id, snoozed_until)
  WHERE snoozed_until IS NOT NULL AND deleted_at IS NULL;
