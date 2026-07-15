-- Close the two flags ADR-0008 Amendment 5 left open.
--
-- ## 1. Chat reads are pinned to LIVE org membership
--
-- Amendment 5 part 2 found that `chat_messages` gates on room membership alone,
-- with no org check. That made `offboardMembershipInOrg` step ④ the ONLY thing
-- revoking a departed user's chat: soft-delete their `memberships` row and they
-- still held `chat_room_members` rows, and those rows alone were read access.
-- The offboard cascade is now correct (it runs elevated), but a teardown being
-- the only lock is not a boundary — it is a to-do list that has never yet been
-- skipped. Miss one sweep, ever, and the user keeps reading.
--
-- The pin goes inside `private.is_room_member`, not into each policy, because
-- that helper is the single predicate every chat policy already routes through
-- (chat_rooms, chat_messages, chat_room_members, chat_message_reactions). One
-- edit, and every chat read inherits it — including the ones a future table
-- adds. `is_room_admin` / `is_room_creator` get the same treatment so an
-- offboarded room-admin cannot keep managing a roster in an org they have left.
--
-- `chat_rooms_select`'s `created_by` disjunct is pinned explicitly: it exists
-- only so `INSERT … RETURNING` can re-read the row it just wrote (Amendment 5),
-- and "I made this room once" must not outlive membership.
--
-- ## 2. shifts: the leak was real, and narrowing it needed a fact I lacked
--
-- Amendment 5 part 2 deferred this as a product call. Two things settled it.
--
-- First, `shifts_select_consolidated` reads
--   has_org_role(org_id, ['owner','admin','controller','collaborator'])
--   OR is_org_member(org_id)
--   OR EXISTS (workforce_members wm WHERE wm.id = shifts.workforce_member_id
--              AND wm.user_id = auth.uid())
-- and `is_org_member` **subsumes both other disjuncts entirely** — an admin is an
-- org member; so is a workforce member with a login. The policy is exactly
-- `is_org_member(org_id)` wearing three clauses. Every org member reads every
-- shift, including the `vendor` persona: ScheduleSurface is mounted at
-- /p/[slug]/vendor/schedule, and its `.eq("workforce_member_id", …)` app filter
-- was the only thing narrowing it.
--
-- Second — the fact that makes "just remove is_org_member" wrong — the staff
-- band names `controller`, which is neither a role nor a persona and can never
-- match (see policy-vocabulary-canon.test.ts: PLATFORM_ROLES is
-- owner|admin|manager|member; PERSONAS holds crew|collaborator|…). And it omits
-- `manager`. So the "narrowing" that looks obvious would have left the band as
-- {owner, admin, collaborator} and cut **every manager** off from every shift —
-- a real outage, shipped in the name of a fix. The dead string is not carried
-- forward here: a new policy has no reason to cargo-cult it, and the concurrent
-- guard exists precisely so the 405 policies that do name it stay a decision.
--
-- Both person linkages are honoured. `shifts` currently has `workforce_member_id`
-- AND `crew_member_id`, both NULL on all 16 rows, because a concurrent session is
-- mid-merge (workforce_members → crew_members: 105 rows of e2e debris, 0 with a
-- login, in orgs disjoint from every shift). Keying on only one of them would
-- break the moment that merge lands or is reverted, so the policy accepts either.
-- Nothing observable changes for crew/vendor today — no shift has a person, so
-- their app queries already return zero — but the PostgREST enumeration closes.
--
-- `workforce_members` keeps its org-wide read on purpose: it is the store being
-- retired by that merge, all 105 rows are e2e debris with no login (so
-- `user_id = auth.uid()` matches nothing and self-scoping it would just break the
-- volunteer surfaces), and narrowing a table mid-retirement is churn against a
-- moving target. Tracked in the ADR.

-- ── 1. Chat: live org membership is a precondition of every room read ──────

create or replace function private.is_room_member(p_room_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
      from public.chat_room_members crm
      join public.chat_rooms r on r.id = crm.room_id
     where crm.room_id = p_room_id
       and crm.user_id = (select auth.uid())
       and private.is_org_member(r.org_id)
  );
$$;

create or replace function private.is_room_admin(p_room_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
      from public.chat_room_members crm
      join public.chat_rooms r on r.id = crm.room_id
     where crm.room_id = p_room_id
       and crm.user_id = (select auth.uid())
       and crm.member_role in ('owner', 'admin')
       and private.is_org_member(r.org_id)
  );
$$;

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
       and private.is_org_member(r.org_id)
  );
$$;

-- The `created_by` disjunct needs the pin spelled out — it does not route
-- through the helper.
drop policy if exists chat_rooms_select on public.chat_rooms;
create policy chat_rooms_select on public.chat_rooms
  for select to authenticated
  using (
    private.is_room_member(id)
    or (created_by = (select auth.uid()) and private.is_org_member(org_id))
  );

-- ── 2. shifts: staff, or the person the shift belongs to ───────────────────

drop policy if exists shifts_select_consolidated on public.shifts;
create policy shifts_select_consolidated on public.shifts
  for select to authenticated
  using (
    -- Roles owner|admin|manager + the `collaborator` persona. `manager` is NEW:
    -- the old band omitted it and leaned on is_org_member to let managers
    -- through, so dropping that disjunct without adding `manager` would have
    -- locked managers out of the schedule entirely.
    private.has_org_role(org_id, array['owner', 'admin', 'manager', 'collaborator'])
    -- The shift is mine, by either linkage. Both are live columns mid-merge.
    or exists (
      select 1 from public.workforce_members wm
       where wm.id = shifts.workforce_member_id
         and wm.user_id = (select auth.uid())
    )
    or exists (
      select 1 from public.crew_members cm
       where cm.id = shifts.crew_member_id
         and cm.user_id = (select auth.uid())
    )
  );
