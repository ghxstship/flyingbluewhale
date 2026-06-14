-- F2 — RAG corpus indexer tracking table.
--
-- The /console/ai/corpus status page rolls up document_chunks by source_type
-- and that is sufficient for the live surface today (no app dependency on this
-- table). This table is the OPTIONAL durable backing for a future scheduled
-- indexer: it records one row per reindex *run* per source kind so an operator
-- can see when each kind was last walked (independent of whether any chunks
-- changed), how many documents were enumerated, and the outcome — which a pure
-- document_chunks rollup cannot express (a kind with zero indexable text would
-- never appear).
--
-- NOT APPLIED automatically (no Supabase MCP in this run). Apply via the
-- Supabase MCP `apply_migration`, then regenerate database.types.ts; until then
-- code paths that touch this table must go through `as unknown as LooseSupabase`.
--
-- LDP naming discipline: the cyclical run outcome lives in `run_state`
-- (operational, repeats), never a bare `status` column.

-- Idempotent enum creation (re-run safe).
do $$
begin
  create type public.corpus_run_state as enum (
    'queued',
    'running',
    'succeeded',
    'partial',
    'failed'
  );
exception
  when duplicate_object then null;
end$$;

create table if not exists public.corpus_sources (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  -- Mirrors the embedding_source_type enum value walked (deliverable / submittal / rfi / ...).
  -- Kept as text so this table never needs to track enum extensions.
  source_kind text not null,
  run_state public.corpus_run_state not null default 'queued',
  -- Last successful walk completion — the per-source "Refreshed" the UI shows.
  refreshed_at timestamptz,
  documents_seen integer not null default 0,
  documents_indexed integer not null default 0,
  documents_skipped integer not null default 0,
  last_error text,
  triggered_by uuid references auth.users(id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint corpus_sources_kind_len check (char_length(source_kind) between 1 and 64)
);

comment on table public.corpus_sources is
  'Per-org, per-source-kind reindex run telemetry for the RAG corpus indexer (F2). Drives the /console/ai/corpus refreshed_at + outcome display for scheduled/manual walks. document_chunks remains the source of truth for chunk counts.';

-- One live tracking row per (org, source_kind); history can be added later by
-- relaxing this. Partial unique honors the soft-delete column.
create unique index if not exists corpus_sources_org_kind_uniq
  on public.corpus_sources (org_id, source_kind)
  where deleted_at is null;

create index if not exists corpus_sources_org_idx
  on public.corpus_sources (org_id, run_state);

-- updated_at maintenance via the canonical shared trigger fn.
drop trigger if exists corpus_sources_touch_updated_at on public.corpus_sources;
create trigger corpus_sources_touch_updated_at
  before update on public.corpus_sources
  for each row execute function public.touch_updated_at();

alter table public.corpus_sources enable row level security;

-- Org members read; manager-band writes (mirrors the soft-deletable canon).
drop policy if exists corpus_sources_select on public.corpus_sources;
create policy corpus_sources_select on public.corpus_sources
  for select using (private.is_org_member(org_id));

drop policy if exists corpus_sources_insert on public.corpus_sources;
create policy corpus_sources_insert on public.corpus_sources
  for insert with check (
    private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator'])
  );

drop policy if exists corpus_sources_update on public.corpus_sources;
create policy corpus_sources_update on public.corpus_sources
  for update using (
    private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator'])
  ) with check (
    private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator'])
  );

drop policy if exists corpus_sources_delete on public.corpus_sources;
create policy corpus_sources_delete on public.corpus_sources
  for delete using (
    private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator'])
  );
