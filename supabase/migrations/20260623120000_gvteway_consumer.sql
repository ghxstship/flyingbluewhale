-- ============================================================================
-- GVTEWAY consumer product — social graph + ticketing-provider mirror + onsite
-- (ATLVS kit 2026-06 cycle, design_handoff_flyingbluewhale/README.md §5).
--
-- CODE-READY MIGRATION — written for review; apply via the Supabase MCP
-- `apply_migration` (do NOT hand-edit the remote DB). Provider data is
-- INGESTED / NORMALIZED, never authored here: `linked_pass` is a read-only
-- mirror, the provider owns the source of truth. 3NF + RLS throughout; state
-- columns follow the LDP `*_state` discipline (never bare `status`).
-- ============================================================================

-- ── Ticketing-provider integration ─────────────────────────────────────────

-- One row per (user × provider). The OAuth token itself lives in a secrets
-- store; `token_ref` is an opaque pointer. `sync_state` drives the reconnect UX.
create table if not exists public.provider_connection (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  provider      text not null check (provider in ('dice','ra','axs','ticketmaster','eventbrite')),
  token_ref     text,
  sync_state    text not null default 'connected'
                  check (sync_state in ('connected','syncing','error','reconnect','disconnected')),
  last_synced   timestamptz,
  created_at    timestamptz not null default now(),
  unique (user_id, provider)
);
alter table public.provider_connection enable row level security;
create policy provider_connection_all on public.provider_connection
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- A read-only mirror of a provider pass. NEVER a source of truth — display,
-- add-to-OS-wallet, and transfer-deep-link-out only.
create table if not exists public.linked_pass (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  connection_id uuid references public.provider_connection (id) on delete set null,
  event_name    text not null,
  event_at      timestamptz,
  venue_name    text,
  tier          text,
  seat          text,
  pass_state    text not null default 'owned'
                  check (pass_state in ('owned','transferred','redeemed','expired','voided')),
  qr_ref        text,
  created_at    timestamptz not null default now()
);
alter table public.linked_pass enable row level security;
create policy linked_pass_owner on public.linked_pass
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Social graph ────────────────────────────────────────────────────────────

create table if not exists public.follow (
  follower_id  uuid not null references auth.users (id) on delete cascade,
  followee_id  uuid not null references auth.users (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
alter table public.follow enable row level security;
create policy follow_select on public.follow for select using (true);
create policy follow_write on public.follow
  for all using (follower_id = auth.uid()) with check (follower_id = auth.uid());

-- A community/scene — public discovery surface (Dice × Radiate).
create table if not exists public.scene (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  description  text,
  created_by   uuid references auth.users (id) on delete set null,
  scene_state  text not null default 'published'
                  check (scene_state in ('draft','published','archived')),
  created_at   timestamptz not null default now()
);
alter table public.scene enable row level security;
create policy scene_select on public.scene for select using (scene_state = 'published' or created_by = auth.uid());
create policy scene_write  on public.scene for all using (created_by = auth.uid()) with check (created_by = auth.uid());

create table if not exists public.scene_member (
  scene_id     uuid not null references public.scene (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  member_role  text not null default 'member' check (member_role in ('member','moderator','owner')),
  created_at   timestamptz not null default now(),
  primary key (scene_id, user_id)
);
alter table public.scene_member enable row level security;
create policy scene_member_select on public.scene_member for select using (true);
create policy scene_member_write  on public.scene_member
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Shareable collections.
create table if not exists public.list (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  owner_id     uuid not null references auth.users (id) on delete cascade,
  name         text not null,
  visibility   text not null default 'private' check (visibility in ('private','unlisted','public')),
  created_at   timestamptz not null default now()
);
alter table public.list enable row level security;
create policy list_select on public.list for select using (visibility in ('public','unlisted') or owner_id = auth.uid());
create policy list_write  on public.list for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create table if not exists public.list_item (
  id           uuid primary key default gen_random_uuid(),
  list_id      uuid not null references public.list (id) on delete cascade,
  item_kind    text not null check (item_kind in ('event','scene','user','venue')),
  item_ref     text not null,
  position     int  not null default 0,
  created_at   timestamptz not null default now()
);
alter table public.list_item enable row level security;
create policy list_item_select on public.list_item for select using (
  exists (select 1 from public.list l where l.id = list_id
          and (l.visibility in ('public','unlisted') or l.owner_id = auth.uid())));
create policy list_item_write on public.list_item for all using (
  exists (select 1 from public.list l where l.id = list_id and l.owner_id = auth.uid()))
  with check (exists (select 1 from public.list l where l.id = list_id and l.owner_id = auth.uid()));

-- Friend-activity feed (saves, follows, attendances).
create table if not exists public.activity (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid not null references auth.users (id) on delete cascade,
  verb         text not null check (verb in ('saved','followed','attended','posted','listed')),
  object_kind  text not null,
  object_ref   text not null,
  created_at   timestamptz not null default now()
);
alter table public.activity enable row level security;
-- Visible to the actor and to anyone who follows them.
create policy activity_select on public.activity for select using (
  actor_id = auth.uid()
  or exists (select 1 from public.follow f where f.followee_id = actor_id and f.follower_id = auth.uid()));
create policy activity_write on public.activity for all using (actor_id = auth.uid()) with check (actor_id = auth.uid());

create table if not exists public.post (
  id           uuid primary key default gen_random_uuid(),
  scene_id     uuid not null references public.scene (id) on delete cascade,
  author_id    uuid not null references auth.users (id) on delete cascade,
  body         text not null,
  created_at   timestamptz not null default now()
);
alter table public.post enable row level security;
create policy post_select on public.post for select using (
  exists (select 1 from public.scene s where s.id = scene_id and s.scene_state = 'published'));
create policy post_write on public.post for all using (author_id = auth.uid()) with check (author_id = auth.uid());

-- ── Onsite (live event) ─────────────────────────────────────────────────────

-- Per-stage set times for the live "My Night" schedule (public read).
create table if not exists public.set_time (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references public.projects (id) on delete cascade,
  stage        text not null,
  performer    text not null,
  starts_at    timestamptz not null,
  ends_at      timestamptz,
  created_at   timestamptz not null default now()
);
alter table public.set_time enable row level security;
create policy set_time_select on public.set_time for select using (true);

-- Find-my-friends presence — coarse, zone-level, opt-in. Reuses venue_zones.
create table if not exists public.presence (
  user_id        uuid primary key references auth.users (id) on delete cascade,
  venue_zone_id  uuid references public.venue_zones (id) on delete set null,
  updated_at     timestamptz not null default now()
);
alter table public.presence enable row level security;
-- A user writes their own presence; reads their own + followed users'.
create policy presence_select on public.presence for select using (
  user_id = auth.uid()
  or exists (select 1 from public.follow f where f.followee_id = user_id and f.follower_id = auth.uid()));
create policy presence_write on public.presence for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Order-to-seat (F&B / merch at the venue).
create table if not exists public.onsite_order (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  project_id    uuid references public.projects (id) on delete set null,
  items         jsonb not null default '[]'::jsonb,
  total_cents   int not null default 0,
  order_state   text not null default 'placed'
                  check (order_state in ('placed','preparing','ready','delivered','cancelled')),
  created_at    timestamptz not null default now()
);
alter table public.onsite_order enable row level security;
create policy onsite_order_owner on public.onsite_order
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── FK indexes (match the repo's index discipline) ─────────────────────────
create index if not exists idx_linked_pass_user on public.linked_pass (user_id);
create index if not exists idx_linked_pass_connection on public.linked_pass (connection_id);
create index if not exists idx_follow_followee on public.follow (followee_id);
create index if not exists idx_scene_member_user on public.scene_member (user_id);
create index if not exists idx_list_owner on public.list (owner_id);
create index if not exists idx_list_item_list on public.list_item (list_id);
create index if not exists idx_activity_actor on public.activity (actor_id);
create index if not exists idx_post_scene on public.post (scene_id);
create index if not exists idx_set_time_project on public.set_time (project_id);
create index if not exists idx_onsite_order_user on public.onsite_order (user_id);
