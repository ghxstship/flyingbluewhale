-- Correction to 20260718122909: that migration made the open-punch index a
-- partial UNIQUE (org_id, user_id) WHERE ended_at IS NULL to also close the
-- double-clock-in race. The re-audit caught the regression: THREE code paths
-- open a time_entries row with ended_at IS NULL, not just the personal punch —
-- /api/v1/shifts/checkin (scheduled-shift punch, shift_id set) and the studio
-- manual time entry. A worker clocked in personally AND checking into a
-- scheduled shift would hit 23505 on the shift insert (which shifts/checkin
-- did not even error-check), advancing the attendance FSM while silently
-- dropping the shift's time_entries row — lost hours.
--
-- Fix: make the index NON-UNIQUE. It still serves the hot open-punch read
-- (org_id, user_id, ended_at IS NULL — every clock-in/out + the clock/time
-- renders) with started_at DESC for the ORDER BY. The double-punch guard
-- reverts to the app-level 409 (the pre-existing serial-case check); the rare
-- concurrent/replayed race falls back to the prior behavior rather than
-- corrupting the shift-checkin path.
drop index if exists public.time_entries_open_per_user;
create index if not exists time_entries_open_per_user
  on public.time_entries (org_id, user_id, started_at desc) where ended_at is null;
