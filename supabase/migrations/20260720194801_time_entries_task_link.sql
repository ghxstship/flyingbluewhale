-- Per-task time tracking: optional task a time entry logs against, so the
-- COMPVSS task-detail timer (Start / Pause / Stop & log) can attribute worked
-- time to a specific task. Null for shift/general time (the common case).
-- ON DELETE SET NULL: deleting a task preserves the logged time (unattributed).
-- Additive + nullable → backward-compatible with the deployed app.
alter table public.time_entries
  add column if not exists task_id uuid references public.tasks(id) on delete set null;

create index if not exists idx_time_entries_task_id on public.time_entries (task_id);

comment on column public.time_entries.task_id is
  'Optional task this entry logs against (per-task timer). Null for shift/general time.';
