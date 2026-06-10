-- Shift worker confirmation (Connecteam parity).
-- Crew members can acknowledge upcoming shifts directly from the mobile
-- schedule list without navigating to a detail page. The timestamp records
-- when the worker confirmed their attendance; NULL means unacknowledged.
--
-- This is intentionally append-only: confirmed_at is set once and never
-- cleared. If the worker can't make it they submit a swap request instead
-- (shift_swaps table). The column is readable by the scheduler via RLS
-- (org member read, worker writes their own row via the API).

ALTER TABLE shifts
  ADD COLUMN IF NOT EXISTS worker_confirmed_at timestamptz;

COMMENT ON COLUMN shifts.worker_confirmed_at IS
  'Set when the scheduled worker explicitly confirms attendance via /m. NULL = not yet confirmed.';
