-- Kit 21 wave W5 — inbox messaging depth. Pin/mute per membership + a
-- reactions table. Mirrors the existing chat_* RLS (private.is_room_member).
-- Applied to the live project 2026-07-05 via the Supabase MCP; committed here
-- for repo/migration parity.

-- 1 · Per-membership pin + mute. Both null = default; a timestamp records
-- when the member pinned/muted the room (pinned rooms sort first; muted rooms
-- suppress the unread badge + the sidebar count).
alter table public.chat_room_members
  add column if not exists pinned_at timestamptz,
  add column if not exists muted_at  timestamptz;

-- 2 · Message reactions. room_id is denormalized so the RLS check can reuse
-- private.is_room_member(room_id) directly (same predicate as chat_messages).
create table if not exists public.chat_message_reactions (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.orgs(id) on delete cascade,
  room_id    uuid not null references public.chat_rooms(id) on delete cascade,
  message_id uuid not null references public.chat_messages(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  emoji      text not null,
  created_at timestamptz not null default now(),
  unique (message_id, user_id, emoji)
);

create index if not exists chat_message_reactions_message_idx
  on public.chat_message_reactions(message_id);

alter table public.chat_message_reactions enable row level security;

-- Room members read every reaction in their rooms; each user writes/removes
-- only their own (and only in rooms they belong to).
drop policy if exists chat_message_reactions_member_read on public.chat_message_reactions;
create policy chat_message_reactions_member_read
  on public.chat_message_reactions for select
  using (private.is_room_member(room_id));

drop policy if exists chat_message_reactions_owner_write on public.chat_message_reactions;
create policy chat_message_reactions_owner_write
  on public.chat_message_reactions for insert
  with check (private.is_room_member(room_id) and user_id = auth.uid());

drop policy if exists chat_message_reactions_owner_delete on public.chat_message_reactions;
create policy chat_message_reactions_owner_delete
  on public.chat_message_reactions for delete
  using (user_id = auth.uid());
