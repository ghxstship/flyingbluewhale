-- Collaborate — block documents (deferred item F4).
--
-- Org-scoped block documents authored in a Tiptap editor on the web client.
-- One table:
--   - collab_docs : title + Tiptap JSON content + lifecycle state
--
-- The editor body is stored as the canonical Tiptap document JSON in the
-- `content` jsonb column (a ProseMirror doc node). Rendering / search can be
-- derived from that shape app-side; we do not denormalize plaintext here.
--
-- Multiplayer is OUT OF SCOPE — single-user editing only. There is no
-- per-field CRDT / yjs awareness column and no presence table; concurrent
-- edits last-write-win on the whole `content` blob. A future multiplayer
-- layer would add a yjs update log + presence channel, not change this table.
--
-- LDP naming discipline: NO bare `status`. The document's macro lifecycle
-- (draft → published → archived) is a sequential arc → `doc_state` enum,
-- never `status`. Domain-prefixed enum name `collab_doc_state` avoids
-- collisions with the eight canonical lifecycle enums.
--
-- NOT YET APPLIED — write-only PENDING migration. Code uses the LooseSupabase
-- cast until the typed Database is regenerated post-apply.

-- ── enum type ───────────────────────────────────────────────────────────
do $$ begin
  create type public.collab_doc_state as enum ('draft', 'published', 'archived');
exception when duplicate_object then null; end $$;

-- ── collab_docs ─────────────────────────────────────────────────────────
create table if not exists public.collab_docs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  title text not null,
  -- Canonical Tiptap / ProseMirror document JSON. Defaults to an empty doc
  -- so the editor always mounts against a valid node.
  content jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  doc_state public.collab_doc_state not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists collab_docs_org_state_idx
  on public.collab_docs (org_id, doc_state)
  where deleted_at is null;

create index if not exists collab_docs_org_updated_idx
  on public.collab_docs (org_id, updated_at desc)
  where deleted_at is null;

alter table public.collab_docs enable row level security;

create policy collab_docs_org_select
  on public.collab_docs for select
  using (private.is_org_member(org_id));

create policy collab_docs_org_write
  on public.collab_docs
  using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']));

create trigger collab_docs_touch_updated_at
  before update on public.collab_docs
  for each row execute function public.touch_updated_at();
