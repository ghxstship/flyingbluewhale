-- Chat: make room membership an actual boundary (ADR-0008 Amendment 5).
--
-- ## The defect
--
-- Any authenticated org member could read any chat thread in their org —
-- including DMs they were never part of. Confirmed against the live DB with
-- nothing but a normal login (crew@gvteway.test, `member` band, a member of
-- ZERO rooms):
--
--   1. `chat_rooms_org_rw` USING `is_org_member(org_id)` let them SELECT every
--      room in the org and pick a target ("Festival Ops").
--   2. `chat_room_members_self_rw` let them INSERT `{room_id: <target>,
--      user_id: <self>}` — a self-issued membership row for a room nobody
--      invited them to.
--   3. `chat_messages_member_rw` USING `is_room_member(room_id)` then handed
--      over the whole thread, plus the 6-person roster.
--
-- Step 2 is the escalation. It was never anyone's intent: the baseline policy
-- spelled the roster rule as "owner/admin may add members", and the
-- `user_id = auth.uid()` disjunct sitting beside it was there to let a room's
-- CREATOR bootstrap their own first membership row. But a WITH CHECK cannot
-- tell "I am adding myself to the room I just made" from "I am adding myself
-- to your DM" — both are `user_id = auth.uid()`. The bootstrap clause was
-- load-bearing and, read literally, universal.
--
-- 20260611055842_chat_rls_recursion_fix then widened it further, though its
-- header says "no new access is introduced":
--
--   * It recreated both policies with USING and **no WITH CHECK**. These are
--     FOR ALL policies, and for FOR ALL Postgres reuses USING as the write
--     check when WITH CHECK is omitted. So `chat_room_members`' write check
--     silently became `user_id = auth.uid() OR is_room_member(room_id)` — the
--     baseline's `member_role IN ('owner','admin')` requirement for adding
--     OTHER people was dropped, leaving "any member may add anyone".
--   * `chat_messages`' write check lost its `is_org_member(org_id)` conjunct,
--     so a member could post a message carrying a forged `org_id`.
--
-- That migration was fixing a genuine BLOCKER (infinite recursion) and the
-- semantics it wrote in its comment are the right ones. It just wrote them
-- into USING only, and the FOR ALL fallback did the rest quietly. This
-- migration restores the intent and closes the bootstrap hole underneath it.
--
-- ## The fix
--
-- Replace the implicit FOR ALL fallbacks with explicit per-command policies,
-- so a write check is never again inherited from a read check by accident.
--
--   chat_room_members  SELECT  own row, or any row of a room I belong to (unchanged)
--                      INSERT  the room's CREATOR (bootstrap), or an owner/admin
--                              — NOT `user_id = auth.uid()`, which was the hole
--                      UPDATE  my own row (pin/mute/last_read_at), or an admin
--                      DELETE  my own row (leave), or an admin removing someone
--   chat_rooms         SELECT  rooms I belong to, or rooms I created
--                      INSERT  org members, and `created_by` must be me
--                      UPDATE  members (last_message_at on post; admins rename)
--                      DELETE  owner/admin only
--   chat_messages      SELECT  rooms I belong to (unchanged)
--                      INSERT  rooms I belong to AND the org pin (restored)
--
-- Creator-bootstrap covers every legitimate insert path in the app — all three
-- add members to a room the caller just created, including the paths that add
-- OTHER people (startDmAction adds the DM partner; the portal AM route adds the
-- manager). None of them needs the universal self-join.
--
-- Membership stays a *finer* boundary than project scope, which is why chat is
-- deliberately NOT project-scoped the way DirectorySurface/FeedSurface are —
-- see ADR-0008 Amendment 5. This migration is the precondition that makes that
-- rationale true rather than aspirational: the whole argument for leaving chat
-- unscoped is "you only see rooms you were added to", and until now you could
-- add yourself.

-- ── Helpers ────────────────────────────────────────────────────────────────
-- SECURITY DEFINER for the same reason private.is_room_member is: these are
-- called from inside chat_room_members' own policies, and a plain subquery
-- would re-enter RLS and recurse (the R-15 blocker).

create or replace function private.is_room_admin(p_room_id uuid)
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
      and crm.member_role in ('owner', 'admin')
  );
$$;

revoke all on function private.is_room_admin(uuid) from public;
grant execute on function private.is_room_admin(uuid) to authenticated;

-- Bootstrap probe: lets a room's creator seed the initial roster before any
-- membership row exists. Reads chat_rooms (whose policy never consults
-- chat_room_members), so this cannot recurse.
create or replace function private.is_room_creator(p_room_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.chat_rooms r
    where r.id = p_room_id
      and r.created_by = (select auth.uid())
  );
$$;

revoke all on function private.is_room_creator(uuid) from public;
grant execute on function private.is_room_creator(uuid) to authenticated;

-- ── chat_room_members ──────────────────────────────────────────────────────

drop policy if exists chat_room_members_self_rw on public.chat_room_members;

create policy chat_room_members_select on public.chat_room_members
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or private.is_room_member(room_id)
  );

-- The fix. `user_id = auth.uid()` is deliberately absent: self-service joining
-- is the vulnerability. Membership is granted BY someone, never taken.
create policy chat_room_members_insert on public.chat_room_members
  for insert to authenticated
  with check (
    private.is_room_creator(room_id)
    or private.is_room_admin(room_id)
  );

create policy chat_room_members_update on public.chat_room_members
  for update to authenticated
  using (
    user_id = (select auth.uid())
    or private.is_room_admin(room_id)
  )
  with check (
    user_id = (select auth.uid())
    or private.is_room_admin(room_id)
  );

create policy chat_room_members_delete on public.chat_room_members
  for delete to authenticated
  using (
    user_id = (select auth.uid())
    or private.is_room_admin(room_id)
  );

-- The UPDATE policy has to let a member write their own row — that is how
-- pin/mute/last_read_at work. But "my own row" includes `member_role`, so
-- without this guard a plain member could promote themselves to owner and then
-- use the INSERT policy above to add outsiders to a room. Narrower than the
-- self-join (it needs an existing membership) but the same shape, and it would
-- hollow out the admin-only roster rule this migration just established.
--
-- Not expressible in the policy itself: WITH CHECK sees only NEW, so it cannot
-- say "member_role is unchanged".
create or replace function public.tg_chat_member_role_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- auth.uid() is null for service_role / server-side admin paths, which are
  -- trusted and bypass RLS anyway. Only police real end-user sessions.
  if (select auth.uid()) is null then
    return new;
  end if;
  if new.member_role is distinct from old.member_role
     and not private.is_room_admin(old.room_id) then
    raise exception 'only a room owner or admin may change member_role'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists chat_room_members_role_guard on public.chat_room_members;
create trigger chat_room_members_role_guard
  before update on public.chat_room_members
  for each row execute function public.tg_chat_member_role_guard();

-- ── chat_rooms ─────────────────────────────────────────────────────────────
-- Every legitimate reader in the app is already membership-scoped — the list
-- surfaces filter `.in("id", roomIds)` off the caller's own memberships, and
-- the two room-detail pages `.eq("id", roomId)` then immediately check
-- membership and notFound(). So narrowing SELECT to members changes no
-- supported behaviour; it just stops a non-member from enumerating room names
-- and kinds (which is how the probe above located a target in the first place).

drop policy if exists chat_rooms_org_rw on public.chat_rooms;

create policy chat_rooms_select on public.chat_rooms
  for select to authenticated
  using (
    private.is_room_member(id)
    -- `created_by` keeps the INSERT ... RETURNING in the create paths working:
    -- PostgREST re-reads the new row through this policy, and at that instant
    -- the creator has no membership row yet.
    or created_by = (select auth.uid())
  );

create policy chat_rooms_insert on public.chat_rooms
  for insert to authenticated
  with check (
    private.is_org_member(org_id)
    -- Pins the bootstrap: `is_room_creator` is only a safe INSERT key for
    -- chat_room_members if `created_by` cannot be forged to someone else.
    and created_by = (select auth.uid())
  );

create policy chat_rooms_update on public.chat_rooms
  for update to authenticated
  using (private.is_room_member(id))
  with check (private.is_org_member(org_id));

create policy chat_rooms_delete on public.chat_rooms
  for delete to authenticated
  using (private.is_room_admin(id));

-- ── chat_messages ──────────────────────────────────────────────────────────

drop policy if exists chat_messages_member_rw on public.chat_messages;

create policy chat_messages_select on public.chat_messages
  for select to authenticated
  using (private.is_room_member(room_id));

-- Restores the `is_org_member(org_id)` conjunct the recursion fix dropped.
create policy chat_messages_insert on public.chat_messages
  for insert to authenticated
  with check (
    private.is_room_member(room_id)
    and private.is_org_member(org_id)
  );

create policy chat_messages_update on public.chat_messages
  for update to authenticated
  using (private.is_room_member(room_id))
  with check (private.is_room_member(room_id) and private.is_org_member(org_id));

create policy chat_messages_delete on public.chat_messages
  for delete to authenticated
  using (private.is_room_member(room_id));
