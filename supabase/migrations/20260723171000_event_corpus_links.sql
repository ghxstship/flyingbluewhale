-- L-P5 — Knowledge grounding seam: event-scoped corpus sync.
--
-- The positioning ("Knowledge that answers back") promises that legend
-- standards / SOPs / guides become the grounded Copilot's corpus SYNCED PER
-- EVENT — the answer at the gate matches the binder in the production office.
-- The embedding layer (document_chunks + match_document_chunks) already
-- exists; what was missing is the event scoping:
--
--   1) `project_corpus_links` — the per-event corpus registry. One row links
--      an org-level knowledge source (today: a VERIFIED kb_article) to one
--      project/event. A source can attach to many events, which is why this
--      is a join table and NOT a nullable project_id on `corpus_sources`
--      (that table is per-(org, source_kind) reindex-run telemetry, one row
--      per kind — it has no per-document rows to scope).
--
--   2) `match_event_chunks` — the event-scoped retrieval RPC. For a given
--      project the visible corpus is the union of:
--        a. that project's own chunks (RFIs, submittals, deliverables,
--           event guides — anything embedded with project_id = the event);
--        b. org-wide chunks (project_id IS NULL) for every source type
--           EXCEPT kb_article — org standards (SOPs, contracts, proposals)
--           apply to every event;
--        c. kb_article chunks ONLY when explicitly linked to the event via
--           project_corpus_links AND the article is currently verified
--           (verification honesty: an unverified article never grounds an
--           event answer, even if it was linked while verified).
--      Chunks belonging to OTHER projects are never visible. A new function
--      name (not an overload of match_document_chunks) avoids PostgREST
--      ambiguous-function resolution; global/document scopes keep using the
--      existing RPC unchanged.
--
--   3) Additive `embedding_source_type` values `sop` + `event_guide` so the
--      corpus walker can index org SOPs (published only) and per-project
--      event guides. Transaction-safe: the new values are referenced by no
--      row inside this migration (PG 12+).
--
-- NOT APPLIED automatically (repo policy for this program: author the file,
-- apply via the Supabase MCP `apply_migration` at readiness P7, then
-- regenerate database.types.ts). Until applied, app code paths touch the new
-- table through `as unknown as LooseSupabase` and fall back gracefully.
--
-- LDP naming discipline: no lifecycle column at all — a link either exists
-- or it does not (removal is a hard DELETE; nothing cycles, nothing
-- sequences). `last_synced_at` is a clock, not a state.

-- ---------------------------------------------------------------------------
-- 0) Enum extension (additive; unused inside this transaction)
-- ---------------------------------------------------------------------------
alter type public.embedding_source_type add value if not exists 'sop';
alter type public.embedding_source_type add value if not exists 'event_guide';

-- ---------------------------------------------------------------------------
-- 1) project_corpus_links — the per-event corpus registry
-- ---------------------------------------------------------------------------
create table if not exists public.project_corpus_links (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  source_type public.embedding_source_type not null,
  source_id uuid not null,
  -- Last successful (re-)embed of this source for this link — compared
  -- against the source row's updated_at to derive "stale, refresh" honestly.
  last_synced_at timestamptz,
  synced_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.project_corpus_links is
  'Event-scoped corpus registry (L-P5 knowledge grounding seam). Links an org-level knowledge source (kb_article today) into one project/event''s grounded-retrieval corpus. A source can attach to many events. Removal is a hard DELETE. match_event_chunks consumes this to build the per-event corpus.';

create unique index if not exists project_corpus_links_uniq
  on public.project_corpus_links (org_id, project_id, source_type, source_id);

create index if not exists project_corpus_links_project_idx
  on public.project_corpus_links (org_id, project_id);

create index if not exists project_corpus_links_source_idx
  on public.project_corpus_links (org_id, source_type, source_id);

create index if not exists project_corpus_links_synced_by_idx
  on public.project_corpus_links (synced_by);

drop trigger if exists project_corpus_links_touch_updated_at on public.project_corpus_links;
create trigger project_corpus_links_touch_updated_at
  before update on public.project_corpus_links
  for each row execute function public.touch_updated_at();

alter table public.project_corpus_links enable row level security;

-- Mirrors the corpus_sources posture: org members read; manager band writes.
drop policy if exists project_corpus_links_select on public.project_corpus_links;
create policy project_corpus_links_select on public.project_corpus_links
  for select using (private.is_org_member(org_id));

drop policy if exists project_corpus_links_insert on public.project_corpus_links;
create policy project_corpus_links_insert on public.project_corpus_links
  for insert with check (
    private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator'])
  );

drop policy if exists project_corpus_links_update on public.project_corpus_links;
create policy project_corpus_links_update on public.project_corpus_links
  for update using (
    private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator'])
  ) with check (
    private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator'])
  );

drop policy if exists project_corpus_links_delete on public.project_corpus_links;
create policy project_corpus_links_delete on public.project_corpus_links
  for delete using (
    private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator'])
  );

-- ---------------------------------------------------------------------------
-- 2) match_event_chunks — event-scoped cosine retrieval
-- ---------------------------------------------------------------------------
create or replace function public.match_event_chunks(
  query_embedding public.vector,
  org_filter uuid,
  project_filter uuid,
  match_top_k integer default 8,
  min_similarity numeric default 0.65
) returns table(
  id uuid,
  source_type text,
  source_id uuid,
  chunk_text text,
  chunk_ordinal integer,
  similarity numeric
)
language sql stable
as $$
  select
    dc.id,
    dc.source_type::text,
    dc.source_id,
    dc.chunk_text,
    dc.chunk_ordinal,
    (1 - (dc.embedding <=> query_embedding))::numeric as similarity
  from public.document_chunks dc
  where
    dc.org_id = org_filter
    and dc.embedding is not null
    and (1 - (dc.embedding <=> query_embedding)) >= min_similarity
    and (
      -- a) the event's own chunks — never another project's.
      dc.project_id = project_filter
      -- b) org-wide chunks for non-gated source types (org standards).
      or (dc.project_id is null and dc.source_type <> 'kb_article')
      -- c) knowledge articles: only when linked to THIS event and still
      --    verified right now (verification honesty).
      or (
        dc.project_id is null
        and dc.source_type = 'kb_article'
        and exists (
          select 1
          from public.project_corpus_links l
          join public.kb_articles a on a.id = l.source_id
          where l.org_id = org_filter
            and l.project_id = project_filter
            and l.source_type = 'kb_article'
            and l.source_id = dc.source_id
            and a.verified_at is not null
        )
      )
    )
  order by dc.embedding <=> query_embedding asc
  limit match_top_k
$$;

comment on function public.match_event_chunks(public.vector, uuid, uuid, integer, numeric) is
  'Event-scoped cosine retrieval over document_chunks (L-P5): the event''s own chunks + org-wide non-kb chunks + kb_article chunks explicitly linked via project_corpus_links (currently-verified only). Never returns another project''s chunks. security_invoker so RLS still gates per-org reads. Used by src/lib/ai/rag.ts for the "project" scope; global/document scopes stay on match_document_chunks.';

grant execute on function public.match_event_chunks(public.vector, uuid, uuid, integer, numeric) to authenticated;
grant execute on function public.match_event_chunks(public.vector, uuid, uuid, integer, numeric) to service_role;
