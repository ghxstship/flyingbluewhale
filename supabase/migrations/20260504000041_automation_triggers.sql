-- ============================================================================
-- Automation triggers — domain event bus + inbound webhook + schedule
-- ============================================================================
-- Phase 4.3 of the SmartSuite parity roadmap. The runner from Phase 4.1
-- already exists; this migration ships the three trigger surfaces that
-- enqueue `automation.run` jobs:
--
--   1. domain_events           — append-only event log written by SSOT
--                                triggers + notify(); the worker fans out to
--                                automation_subscriptions
--   2. automation_subscriptions — which automations care about which events
--   3. automation_schedules    — cron/RRULE recurring triggers; the worker
--                                tick-loop enqueues runs whose
--                                next_run_at <= now()
--   4. automations.webhook_secret — per-automation HMAC secret for inbound
--                                   webhook signature verification
--
-- Idempotent: every CREATE TABLE / CREATE INDEX uses IF NOT EXISTS, every
-- ALTER TABLE column uses ADD COLUMN IF NOT EXISTS, every policy is gated on
-- a pg_policies lookup. Safe to re-run.
-- ============================================================================

-- domain_events: append-only event log written by SSOT triggers + notify().
create table if not exists domain_events (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references orgs(id) on delete cascade,
  event_type    text not null,                    -- e.g. 'invoice.paid'
  payload       jsonb not null default '{}'::jsonb,
  -- SmartSuite-style "matches a condition" payloads include the record id + table.
  source_table  text,
  source_id     uuid,
  emitted_at    timestamptz not null default now(),
  -- When set, all subscribers have been dispatched. Worker stamps after fanning out.
  dispatched_at timestamptz
);

create index if not exists domain_events_pending_idx on domain_events(emitted_at) where dispatched_at is null;
create index if not exists domain_events_org_event_idx on domain_events(org_id, event_type, emitted_at desc);

-- automation_subscriptions: which automations care about which events.
create table if not exists automation_subscriptions (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references orgs(id) on delete cascade,
  automation_id   uuid not null references automations(id) on delete cascade,
  event_type      text not null,
  -- Optional table filter — only fires when source_table matches.
  source_table    text,
  -- Optional record id filter — rare.
  source_id       uuid,
  enabled         boolean not null default true,
  created_at      timestamptz not null default now(),
  unique (automation_id, event_type, source_table, source_id)
);

create index if not exists automation_subscriptions_event_idx on automation_subscriptions(event_type) where enabled = true;

-- automation_schedules: cron/RRULE recurring triggers.
create table if not exists automation_schedules (
  id              uuid primary key default gen_random_uuid(),
  automation_id   uuid not null references automations(id) on delete cascade,
  rrule           text not null,            -- RRULE syntax, e.g. "FREQ=DAILY;BYHOUR=9;BYMINUTE=0"
  timezone        text not null default 'UTC',
  next_run_at     timestamptz not null,
  last_run_at     timestamptz,
  enabled         boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (automation_id)
);

create index if not exists automation_schedules_due_idx on automation_schedules(next_run_at) where enabled = true;

-- Inbound webhook secret per automation (one secret per automation).
alter table automations add column if not exists webhook_secret text;

alter table domain_events enable row level security;
alter table automation_subscriptions enable row level security;
alter table automation_schedules enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'domain_events' and policyname = 'domain_events_select') then
    create policy "domain_events_select" on domain_events for select using (is_org_member(org_id));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'automation_subscriptions' and policyname = 'subs_select') then
    create policy "subs_select" on automation_subscriptions for select using (is_org_member(org_id));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'automation_subscriptions' and policyname = 'subs_admin_write') then
    create policy "subs_admin_write" on automation_subscriptions for all
      using (has_org_role(org_id, array['owner','admin','manager']))
      with check (has_org_role(org_id, array['owner','admin','manager']));
  end if;
  -- automation_schedules and webhook_secret managed via service role for the worker
end $$;
