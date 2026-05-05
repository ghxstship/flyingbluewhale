-- ============================================================================
-- import_jobs — async import progress tracking
-- ============================================================================
-- Phase 6.4 of the SmartSuite parity roadmap. The existing job_queue handles
-- the actual claim/run/retry mechanics; import_jobs is a per-import metadata
-- row that the UI polls for progress. Decoupled from job_queue so the UI
-- doesn't need to understand worker internals.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'import_job_state') then
    create type import_job_state as enum ('pending', 'parsing', 'inserting', 'success', 'failed', 'cancelled');
  end if;
end $$;

create table if not exists import_jobs (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references orgs(id) on delete cascade,
  /** Resource being imported (crew_members, tasks, vendors, projects, ...). */
  resource        text not null,
  /** Source kind: csv, airtable, asana, json. */
  source          text not null default 'csv',
  /** Original filename or source identifier. */
  source_label    text,
  /** Path in Supabase Storage where the upload sits before processing. */
  storage_path    text,
  state           import_job_state not null default 'pending',
  /** Total rows planned (set after parse). */
  rows_total      int not null default 0,
  /** Rows successfully inserted. */
  rows_succeeded  int not null default 0,
  /** Rows that failed individual validation. */
  rows_failed     int not null default 0,
  /** Per-row errors (sample, capped at 100). */
  errors          jsonb not null default '[]'::jsonb,
  /** Optional summary for the success card. */
  summary         text,
  /** Backing job_queue row id (set when enqueued). */
  job_id          uuid,
  created_by      uuid references users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  started_at      timestamptz,
  finished_at     timestamptz
);

create index if not exists import_jobs_org_state_idx on import_jobs(org_id, state, created_at desc);
create index if not exists import_jobs_pending_idx on import_jobs(id) where state in ('pending', 'parsing', 'inserting');

alter table import_jobs enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'import_jobs' and policyname = 'imp_select') then
    create policy "imp_select" on import_jobs for select using (is_org_member(org_id));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'import_jobs' and policyname = 'imp_insert') then
    create policy "imp_insert" on import_jobs for insert
      with check (is_org_member(org_id) and has_org_role(org_id, array['owner','admin','manager']));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'import_jobs' and policyname = 'imp_update_owner') then
    create policy "imp_update_owner" on import_jobs for update
      using (is_org_member(org_id) and (created_by = auth.uid() or has_org_role(org_id, array['owner','admin'])));
  end if;
end $$;

create or replace function tg_import_jobs_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists import_jobs_updated_at_tg on import_jobs;
create trigger import_jobs_updated_at_tg
  before update on import_jobs
  for each row execute function tg_import_jobs_updated_at();
