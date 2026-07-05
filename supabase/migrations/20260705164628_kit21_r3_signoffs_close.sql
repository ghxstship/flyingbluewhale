-- Kit 21 remediation R3 (ADR-0015) — one child table + tasks facets. Applied to
-- the live project 2026-07-05 via the Supabase MCP; committed here for parity.

-- 1 · Daily-log sign-off (Raken progressive completion). The daily-log
-- sections are already child tables (manpower/deliveries/equipment/visitors/
-- photos); this records a signature per section so the header can show
-- sections-signed completeness. One signoff row per (log, section).
create table if not exists public.daily_log_signoffs (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.orgs(id) on delete cascade,
  daily_log_id uuid not null references public.daily_logs(id) on delete cascade,
  section      text not null,
  signed_by    uuid references auth.users(id) on delete set null,
  signed_at    timestamptz not null default now(),
  unique (daily_log_id, section)
);
create index if not exists daily_log_signoffs_log_idx on public.daily_log_signoffs(daily_log_id);
alter table public.daily_log_signoffs enable row level security;

drop policy if exists daily_log_signoffs_read on public.daily_log_signoffs;
create policy daily_log_signoffs_read
  on public.daily_log_signoffs for select using (private.is_org_member(org_id));

drop policy if exists daily_log_signoffs_write on public.daily_log_signoffs;
create policy daily_log_signoffs_write
  on public.daily_log_signoffs for all
  using (private.is_org_member(org_id))
  with check (private.is_org_member(org_id));

-- 2 · Period Close checklist — a facet on the ONE tasks store (FloQast guided
-- close), not a new table. period_id scopes a task to an accounting period;
-- kind='close' marks it a close-checklist item (default 'general' keeps every
-- existing task unchanged).
alter table public.tasks
  add column if not exists period_id uuid references public.accounting_periods(id) on delete cascade,
  add column if not exists kind      text not null default 'general';
create index if not exists tasks_period_idx on public.tasks(period_id) where period_id is not null;
