-- fbw_019 · Background job queue — H3-02 / IK-027
--
-- Single-table job queue backed by Postgres. Optimistic locking via
-- `locked_by` + `locked_until`. Atomic claim uses `FOR UPDATE SKIP LOCKED`
-- so concurrent workers never fight over the same row. Dead-letter
-- queue is the same table, state='dead'. Retries carry exponential
-- backoff governed by the worker, not the DB (keeps schema flexible).

create type job_state as enum ('pending', 'running', 'done', 'failed', 'dead');

create table if not exists job_queue (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  org_id uuid not null,
  state job_state not null default 'pending',
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  run_at timestamptz not null default now(),
  locked_by text,
  locked_until timestamptz,
  last_error text,
  dedup_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists job_queue_claim_idx
  on job_queue (run_at) where state = 'pending';

create unique index if not exists job_queue_dedup_idx
  on job_queue (type, dedup_key) where state in ('pending', 'running') and dedup_key is not null;

create index if not exists job_queue_org_state_idx
  on job_queue (org_id, state);

create index if not exists job_queue_state_dead_idx
  on job_queue (state) where state = 'dead';

create or replace function bump_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger job_queue_updated_at
  before update on job_queue
  for each row execute function bump_updated_at();

alter table job_queue enable row level security;

create policy job_queue_select on job_queue
  for select to authenticated
  using (is_org_member(org_id));

create policy job_queue_no_client_write on job_queue
  for insert to authenticated with check (false);

create policy job_queue_no_client_update on job_queue
  for update to authenticated using (false) with check (false);

create policy job_queue_no_client_delete on job_queue
  for delete to authenticated using (false);

comment on table job_queue is
  'Background job queue (H3-02 / IK-027). Single table; dead-letter = state="dead".';

create or replace function claim_jobs(p_batch int, p_visibility_s int, p_worker text)
returns setof job_queue as $$
  with batch as (
    select id from job_queue
    where state = 'pending' and run_at <= now()
    order by run_at
    for update skip locked
    limit p_batch
  )
  update job_queue j
  set state = 'running',
      attempts = attempts + 1,
      locked_by = p_worker,
      locked_until = now() + make_interval(secs => p_visibility_s)
  from batch
  where j.id = batch.id
  returning j.*;
$$ language sql volatile security definer;

create or replace function reclaim_stuck_jobs() returns int as $$
  with bumped as (
    update job_queue
    set state = 'pending', locked_by = null, locked_until = null
    where state = 'running' and locked_until < now()
    returning id
  )
  select count(*)::int from bumped;
$$ language sql volatile security definer;

revoke all on function claim_jobs(int, int, text) from public;
revoke all on function reclaim_stuck_jobs() from public;
grant execute on function claim_jobs(int, int, text) to service_role;
grant execute on function reclaim_stuck_jobs() to service_role;
