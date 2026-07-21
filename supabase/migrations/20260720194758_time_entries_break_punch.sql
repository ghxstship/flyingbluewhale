-- COMPVSS field clock: break punch on the live time-clock entry.
-- The shifts table already models scheduled break_minutes (roster planning);
-- this adds the ACTUAL break punch to time_entries (the live clock face) so a
-- worker can Start/End Break within an open clock-in. Break time is tracked
-- separately from gross duration_minutes (which the derive trigger keeps as
-- ended_at - started_at); net worked = duration_minutes - break_minutes.
-- Additive + nullable/defaulted → backward-compatible with the deployed app.
alter table public.time_entries
  add column if not exists break_open_at timestamptz,
  add column if not exists break_minutes integer not null default 0;

comment on column public.time_entries.break_open_at is
  'When the currently-open break started (null = not on break). Set on break_start, cleared on break_end when the elapsed minutes fold into break_minutes.';
comment on column public.time_entries.break_minutes is
  'Accumulated break minutes for this entry, excluded from worked time. Net worked = duration_minutes - break_minutes.';
