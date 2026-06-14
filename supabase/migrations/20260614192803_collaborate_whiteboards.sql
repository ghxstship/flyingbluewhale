-- F5 — Collaborative whiteboards (tldraw-backed canvas).
--
-- One org-scoped table backing /console/collaborate/whiteboards. Each row is
-- a single tldraw document: a name, the persisted tldraw store snapshot
-- (JSONB), and a cyclical lifecycle column.
--
-- SCOPE NOTE: single-user persistence only. Realtime multiplayer presence
-- (cursors, live co-editing via tldraw sync / yjs) is OUT OF SCOPE — the
-- snapshot is saved explicitly / debounced by the lone editor. No presence
-- or per-session shape locking is modeled here.
--
-- LDP naming discipline: NO bare `status`. The lifecycle column is a NAMED
-- postgres enum `whiteboard_state` (active/archived) — cyclical operational
-- arc, hence `*_state`. `snapshot` is opaque tldraw document state, not a
-- lifecycle, so it keeps its descriptive name.
--
-- Standard org-scoping: org_id FK → public.orgs, RLS enabled,
-- private.is_org_member select + private.has_org_role write, deleted_at
-- soft-delete, public.touch_updated_at() trigger. DO NOT APPLY by hand —
-- this is a PENDING migration; promote + apply via the Supabase MCP, then
-- regenerate database.types.ts and drop the LooseSupabase casts.

-- ── enum types ──────────────────────────────────────────────────────────
do $$ begin
  create type public.whiteboard_state as enum ('active', 'archived');
exception when duplicate_object then null; end $$;

-- ── whiteboards ─────────────────────────────────────────────────────────
create table if not exists public.whiteboards (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  name text not null,
  -- tldraw store snapshot (getSnapshot(editor.store)). NULL until first save.
  snapshot jsonb,
  whiteboard_state public.whiteboard_state not null default 'active',
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists whiteboards_org_state_idx
  on public.whiteboards (org_id, whiteboard_state, updated_at desc)
  where deleted_at is null;

alter table public.whiteboards enable row level security;

create policy whiteboards_org_select
  on public.whiteboards for select
  using (private.is_org_member(org_id));

create policy whiteboards_org_write
  on public.whiteboards
  using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']));

create trigger whiteboards_touch_updated_at
  before update on public.whiteboards
  for each row execute function public.touch_updated_at();
