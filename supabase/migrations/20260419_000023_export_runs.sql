-- fbw_023 · Unified export runs — Opportunity #8

do $$ begin
  create type export_kind as enum ('csv', 'json', 'xlsx', 'zip', 'project_archive');
exception when duplicate_object then null; end $$;

do $$ begin
  create type export_status as enum ('pending', 'running', 'done', 'failed');
exception when duplicate_object then null; end $$;

create table if not exists export_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  kind export_kind not null,
  params jsonb not null default '{}'::jsonb,
  status export_status not null default 'pending',
  file_path text,
  size_bytes bigint,
  row_count bigint,
  requested_by uuid,
  last_error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists export_runs_org_status_idx on export_runs (org_id, status);
create index if not exists export_runs_created_at_idx on export_runs (created_at desc);

alter table export_runs enable row level security;

create policy export_runs_select on export_runs
  for select to authenticated using (is_org_member(org_id));

create policy export_runs_insert on export_runs
  for insert to authenticated with check (is_org_member(org_id));

create policy export_runs_no_client_update on export_runs
  for update to authenticated using (false) with check (false);

insert into storage.buckets (id, name, public, file_size_limit)
values ('exports', 'exports', false, 1073741824)
on conflict (id) do nothing;

create policy "exports_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'exports' and (storage.foldername(name))[1] = (auth.jwt()->>'sub'));

comment on table export_runs is
  'Unified export history. Opportunity #8 — kinds: csv, json, xlsx, zip, project_archive.';
