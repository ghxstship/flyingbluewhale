-- ============================================================================
-- automation_runs / automation_step_runs — execution ledger
-- ============================================================================
-- Phase 4.1 of the SmartSuite parity roadmap. Per-run + per-step records so
-- the UI can render a SmartSuite-style "Run history" with timeline of
-- actions, durations, errors, outputs.
--
-- The `automations` table already exists with `trigger_kind`/`steps` JSONB.
-- The `job_queue` + `claim_jobs()` infrastructure already exists. This
-- migration ships the ledger that the runner writes to.
--
-- Idempotent: every CREATE TABLE / CREATE INDEX uses IF NOT EXISTS, the enum
-- is gated on a pg_type lookup, and every policy is gated on a pg_policies
-- lookup. Safe to re-run.
-- ============================================================================

do $$ begin
  if not exists (select 1 from pg_type where typname = 'automation_run_status') then
    create type automation_run_status as enum ('pending', 'running', 'success', 'failed', 'cancelled');
  end if;
end $$;

create table if not exists automation_runs (
  id              uuid primary key default gen_random_uuid(),
  automation_id   uuid not null references automations(id) on delete cascade,
  org_id          uuid not null references orgs(id) on delete cascade,
  trigger_kind    text not null,                  -- 'manual' | 'schedule' | 'webhook' | 'event'
  trigger_payload jsonb not null default '{}'::jsonb,
  triggered_by    uuid references users(id) on delete set null,
  status          automation_run_status not null default 'pending',
  started_at      timestamptz,
  finished_at     timestamptz,
  error_summary   text,
  action_count    int not null default 0,
  created_at      timestamptz not null default now()
);

create index if not exists automation_runs_automation_started_idx on automation_runs(automation_id, started_at desc);
create index if not exists automation_runs_org_status_idx on automation_runs(org_id, status);
create index if not exists automation_runs_pending_idx on automation_runs(id) where status = 'pending';

create table if not exists automation_step_runs (
  id            uuid primary key default gen_random_uuid(),
  run_id        uuid not null references automation_runs(id) on delete cascade,
  step_index    int not null,
  action_type   text not null,
  input         jsonb not null default '{}'::jsonb,
  output        jsonb not null default '{}'::jsonb,
  status        text not null default 'pending',  -- pending | running | success | failed | skipped
  error         text,
  started_at    timestamptz,
  finished_at   timestamptz,
  latency_ms    int,
  created_at    timestamptz not null default now()
);

create index if not exists automation_step_runs_run_idx on automation_step_runs(run_id, step_index);

alter table automation_runs enable row level security;
alter table automation_step_runs enable row level security;

do $$ begin
  -- Reads gated by org membership; writes happen via service-role only
  -- (no INSERT/UPDATE policy = blocked for authenticated role).
  if not exists (select 1 from pg_policies where tablename = 'automation_runs' and policyname = 'automation_runs_select') then
    create policy "automation_runs_select" on automation_runs for select using (is_org_member(org_id));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'automation_step_runs' and policyname = 'automation_step_runs_select') then
    create policy "automation_step_runs_select" on automation_step_runs for select using (
      run_id in (select id from automation_runs where is_org_member(org_id))
    );
  end if;
end $$;
