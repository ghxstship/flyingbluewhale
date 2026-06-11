-- Readiness finding R-15 (BLOCKER): chat RLS infinite recursion.
-- Approved + applied 2026-06-11 (version 20260611055842).
--
-- chat_room_members_self_rw references chat_room_members inside its own
-- USING clause, so Postgres raises "infinite recursion detected in policy
-- for relation chat_room_members" on EVERY authenticated select of
-- chat_room_members AND chat_messages (whose policy EXISTS-checks the
-- members table). Net effect today:
--   · /m/inbox/[roomId] message reads fail for user sessions
--   · portal /p/[slug]/messages fails for user sessions
--   · DSAR export silently omits chat_messages (logged warn)
--
-- Fix: hoist the membership probe into a SECURITY DEFINER helper that
-- bypasses RLS (same pattern as private.is_org_member), then recreate both
-- policies with IDENTICAL intended semantics:
--   members:  own row, or any row of a room you belong to
--   messages: rows of rooms you belong to
--
-- No grants change; no new access is introduced — this makes the policy's
-- written intent actually executable.

create or replace function private.is_room_member(p_room_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.chat_room_members crm
    where crm.room_id = p_room_id
      and crm.user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_room_member(uuid) from public;
grant execute on function private.is_room_member(uuid) to authenticated;

drop policy if exists chat_room_members_self_rw on public.chat_room_members;
create policy chat_room_members_self_rw on public.chat_room_members
  to authenticated
  using (
    user_id = (select auth.uid())
    or private.is_room_member(room_id)
  );

drop policy if exists chat_messages_member_rw on public.chat_messages;
create policy chat_messages_member_rw on public.chat_messages
  to authenticated
  using (private.is_room_member(room_id));
