-- fbw_020 · Per-tenant usage metering — H3-01 / IK-023
--
-- Append-only event log + rollup view. Events are cheap to write and
-- retained for 90 days; rollups are the long-lived source of truth for
-- billing + quota enforcement.

create table if not exists usage_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  actor_id uuid,
  metric text not null,
  quantity bigint not null,
  unit text not null,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists usage_events_org_metric_time_idx
  on usage_events (org_id, metric, occurred_at desc);

create index if not exists usage_events_occurred_at_idx
  on usage_events (occurred_at);

alter table usage_events enable row level security;

create policy usage_events_select on usage_events
  for select to authenticated using (is_org_member(org_id));

create policy usage_events_no_client_write on usage_events
  for insert to authenticated with check (false);

create table if not exists usage_rollups (
  org_id uuid not null,
  metric text not null,
  bucket_start timestamptz not null,
  bucket_duration_s integer not null default 3600,
  quantity bigint not null,
  unit text not null,
  updated_at timestamptz not null default now(),
  primary key (org_id, metric, bucket_start, bucket_duration_s)
);

alter table usage_rollups enable row level security;

create policy usage_rollups_select on usage_rollups
  for select to authenticated using (is_org_member(org_id));

create policy usage_rollups_no_client_write on usage_rollups
  for insert to authenticated with check (false);

create policy usage_rollups_no_client_update on usage_rollups
  for update to authenticated using (false) with check (false);

comment on table usage_events is
  'Append-only per-tenant usage log. 90-day retention; aggregates roll into usage_rollups.';
comment on table usage_rollups is
  'Pre-aggregated usage counts per (org_id, metric, hour). Source of truth for billing + quotas.';
