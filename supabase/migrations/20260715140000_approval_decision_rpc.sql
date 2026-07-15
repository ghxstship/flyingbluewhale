-- Closes the two follow-ups left open by 20260715130000_approvals_decision_rls.sql.
--
-- 1. ATOMICITY. recordDecision wrote approval_decisions and then advanced
--    approval_instances.state in TWO separate PostgREST statements — no
--    transaction. A failure between them (RLS, CHECK, contention, a dropped
--    connection) left the pair inconsistent: a decision on record against an
--    instance still sitting open. 20260715130000 made the failure LOUD rather
--    than silent, which was the urgent half, but the write is still not atomic.
--    PostgREST can't span statements in a transaction, so the fix is an RPC:
--    a plpgsql function is a single transaction, so both writes commit or
--    neither does.
--
--    SECURITY DEFINER (needed so the function owns the writes) BYPASSES RLS, so
--    this re-checks authority itself — same discipline as
--    public.approve_time_off_request ("We re-check rather than rely on RLS
--    because SECURITY DEFINER bypasses it"). It re-checks MORE than the old
--    client path did:
--      · caller is authenticated,
--      · caller is manager-band in the instance's org (the isManagerPlus gate),
--      · the instance is not already terminal (was unchecked — a second decider
--        could re-decide a closed approval and re-stamp closed_at),
--      · the step belongs to THIS instance's policy. step_id arrives from a
--        hidden form field and approval_decisions.step_id's FK only proves the
--        step EXISTS — a crafted POST could previously attach a decision to any
--        step in any org's policy.
--    SELECT ... FOR UPDATE locks the instance so concurrent deciders serialize
--    instead of racing the state advance.
--
--    The RLS policies from 20260715130000 are KEPT: they still govern direct
--    table access (defence in depth, and any non-RPC writer).
--
-- 2. approval_delegations — the last instance of the *_party_id inversion.
--    uas_del_self admitted the self branch only when delegator_party_id was one
--    of the caller's parties.id, but createDelegation writes session.userId (the
--    auth uid) — and it ALWAYS writes the caller (the delegator is not
--    selectable in the form). So the self branch never matched and the policy
--    fell through to its is_org_admin branch: delegations were admin-only even
--    though the app gate is isManagerPlus. Same root cause as uas_dec_decider
--    (fixed in 20260715130000); this is the third and final table.
--
--    Also org-scopes the self branch. Previously "delegator is me" alone
--    satisfied the WITH CHECK, so a caller could insert a delegation carrying an
--    arbitrary org_id — including an org they are not a member of — polluting
--    that org's delegation list. The self branch now also requires is_org_member.

begin;

-- ── 1. Atomic decision ────────────────────────────────────────────────────────
create or replace function public.record_approval_decision(
  p_instance_id uuid,
  p_step_id uuid,
  p_decision text,
  p_notes text default null
) returns public.approval_instances
  language plpgsql
  security definer
  set search_path to 'public'
as $$
declare
  v_inst public.approval_instances%rowtype;
  v_uid uuid := (select auth.uid());
  v_next text;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  -- Lock the instance: concurrent deciders serialize here rather than racing
  -- the state advance below.
  select * into v_inst from public.approval_instances where id = p_instance_id for update;
  if not found then
    raise exception 'approval instance % not found', p_instance_id;
  end if;

  -- SECURITY DEFINER bypasses RLS — re-check authority explicitly. Mirrors the
  -- isManagerPlus app gate and the approval_instances write band.
  if not private.has_org_role(
    v_inst.org_id,
    array['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]
  ) then
    raise exception 'caller lacks manager-band authority on org %', v_inst.org_id;
  end if;

  -- A closed approval is past its decision window.
  if v_inst.state in ('approved', 'rejected', 'closed', 'cancelled') then
    raise exception 'approval instance % is already % and cannot take a decision', p_instance_id, v_inst.state;
  end if;

  -- The step must belong to this instance's policy (the FK only proves it exists).
  if not exists (
    select 1 from public.approval_steps s
    where s.id = p_step_id and s.policy_id = v_inst.policy_id
  ) then
    raise exception 'step % does not belong to the policy of instance %', p_step_id, p_instance_id;
  end if;

  insert into public.approval_decisions (instance_id, step_id, decider_party_id, decision, notes)
  values (p_instance_id, p_step_id, v_uid, p_decision, nullif(p_notes, ''));

  -- decision → instance state. This is the ONLY home for the mapping (the
  -- client-side instanceStateForDecision() it replaced is deleted, so the two
  -- can't drift); 'recused' leaves the instance open.
  v_next := case p_decision
    when 'approved' then 'approved'
    when 'rejected' then 'rejected'
    when 'returned' then 'returned'
    else null
  end;

  if v_next is not null then
    update public.approval_instances
    set state = v_next,
        closed_at = case when v_next in ('approved', 'rejected') then now() else closed_at end
    where id = p_instance_id
    returning * into v_inst;
  end if;

  return v_inst;
end;
$$;

alter function public.record_approval_decision(uuid, uuid, text, text) owner to postgres;
-- Operators call this as themselves; the function re-checks the band internally.
revoke all on function public.record_approval_decision(uuid, uuid, text, text) from public;
revoke all on function public.record_approval_decision(uuid, uuid, text, text) from anon;
grant execute on function public.record_approval_decision(uuid, uuid, text, text) to authenticated;
grant execute on function public.record_approval_decision(uuid, uuid, text, text) to service_role;

comment on function public.record_approval_decision(uuid, uuid, text, text) is
  'Atomically record an approval decision and advance its instance state. SECURITY DEFINER + EXECUTE TO authenticated is intentional — the function re-checks manager-band authority on the instance org, rejects terminal instances, and verifies the step belongs to the instance policy. Replaces the non-atomic two-statement client path.';

-- ── 2. approval_delegations self-service ─────────────────────────────────────
drop policy if exists uas_del_self on public.approval_delegations;
create policy uas_del_self on public.approval_delegations
  as permissive
  for all
  to public
  using (
    (
      (
        delegator_party_id = (select auth.uid())
        or delegator_party_id in (
          select p.id from public.parties p where p.auth_user_id = (select auth.uid())
        )
      )
      and private.is_org_member(org_id)
    )
    or private.is_org_admin(org_id)
  )
  with check (
    (
      (
        delegator_party_id = (select auth.uid())
        or delegator_party_id in (
          select p.id from public.parties p where p.auth_user_id = (select auth.uid())
        )
      )
      and private.is_org_member(org_id)
    )
    or private.is_org_admin(org_id)
  );

commit;
