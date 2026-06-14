-- F6 — Video huddle (calls + participants).
--
-- The huddle shell: an org-scoped video call attached (optionally) to a
-- meeting, plus the per-user participant roster. The provider adapter
-- (src/lib/video/provider.ts) mints the join token at runtime from
-- env-configured creds; the schema only tracks call lifecycle + who is in
-- the room, so live media activates the moment an operator wires a provider.
--
--   - video_calls              : one row per call (scheduled → live → ended),
--                                optionally tied to a meeting via meeting_id.
--   - video_call_participants  : one row per (call × user), host|participant,
--                                with joined_at / left_at presence stamps.
--
-- LDP naming discipline: NO bare `status`. The lifecycle column is a NAMED
-- postgres enum `video_call_state` (scheduled/live/ended). Participant
-- `role` is a NAMED enum `video_participant_role` (host/participant) — a
-- membership descriptor, not a lifecycle, so it stays `role`.
--
-- Standard org-scoping: org_id FK → public.orgs, RLS enabled,
-- private.is_org_member select + private.has_org_role write, deleted_at
-- soft-delete, public.touch_updated_at() trigger. DO NOT APPLY by hand —
-- this is a PENDING migration; promote + apply via the Supabase MCP, then
-- regenerate database.types.ts and drop the LooseSupabase casts.

-- ── enum types ──────────────────────────────────────────────────────────
do $$ begin
  create type public.video_call_state as enum ('scheduled', 'live', 'ended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.video_participant_role as enum ('host', 'participant');
exception when duplicate_object then null; end $$;

-- ── video_calls ─────────────────────────────────────────────────────────
create table if not exists public.video_calls (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  meeting_id uuid references public.meetings(id) on delete set null,
  title text not null,
  -- Stable provider room identifier. Defaults to a generated handle; the
  -- provider adapter scopes its join token to this room_name.
  room_name text not null default ('huddle-' || replace(gen_random_uuid()::text, '-', '')),
  call_state public.video_call_state not null default 'scheduled',
  started_at timestamptz,
  ended_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists video_calls_org_state_idx
  on public.video_calls (org_id, call_state)
  where deleted_at is null;

create index if not exists video_calls_meeting_idx
  on public.video_calls (org_id, meeting_id)
  where deleted_at is null;

create unique index if not exists video_calls_room_name_uniq
  on public.video_calls (org_id, room_name)
  where deleted_at is null;

alter table public.video_calls enable row level security;

create policy video_calls_org_select
  on public.video_calls for select
  using (private.is_org_member(org_id));

create policy video_calls_org_write
  on public.video_calls
  using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']));

create trigger video_calls_touch_updated_at
  before update on public.video_calls
  for each row execute function public.touch_updated_at();

-- ── video_call_participants ─────────────────────────────────────────────
-- One row per (call × user). The (org_id, call_id, user_id) unique index
-- makes join/leave an idempotent upsert — a re-join clears left_at and
-- re-stamps joined_at rather than spawning a duplicate row.
create table if not exists public.video_call_participants (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  call_id uuid not null references public.video_calls(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.video_participant_role not null default 'participant',
  joined_at timestamptz,
  left_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists video_call_participants_uniq
  on public.video_call_participants (org_id, call_id, user_id)
  where deleted_at is null;

create index if not exists video_call_participants_call_idx
  on public.video_call_participants (org_id, call_id)
  where deleted_at is null;

alter table public.video_call_participants enable row level security;

create policy video_call_participants_org_select
  on public.video_call_participants for select
  using (private.is_org_member(org_id));

create policy video_call_participants_org_write
  on public.video_call_participants
  using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']));

create trigger video_call_participants_touch_updated_at
  before update on public.video_call_participants
  for each row execute function public.touch_updated_at();
