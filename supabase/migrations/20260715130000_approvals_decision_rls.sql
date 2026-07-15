-- Follow-up to 20260714120000_approval_instances_write_rls.sql. That migration
-- unblocked "Route To Approvals" (opening an instance); this one unblocks the
-- other half of the engine — RECORDING A DECISION on it. Both gaps made
-- recordDecision (studio/governance/approvals/[id]/actions.ts) a no-op:
--
-- 1. approval_decisions INSERT — uas_dec_decider (baseline) checked ONLY
--      decider_party_id IN (select id from parties where auth_user_id = auth.uid())
--    but recordDecision writes `decider_party_id: session.userId` — the AUTH USER
--    id, not a parties.id (the action says so: "party_id columns have no FK → map
--    to the current user"). A parties.id never equals an auth uid, so the check
--    failed for EVERY persona — including admins — and no decision could ever be
--    recorded from the UI. The auth-uid convention is the de facto canon: all 6
--    approval_decisions rows on the live DB hold an auth user id (they were seeded
--    via service role, bypassing RLS), the column carries NO FK to parties, no UI
--    reads it, and the app never provisions parties rows (only 30 of 51 parties
--    have an auth_user_id at all; most operators have none). Requiring a parties.id
--    would mean building party provisioning — a far larger change that would also
--    redefine an existing table. So the POLICY moves to the app's convention:
--    accept the caller's auth uid, and still accept a parties.id the caller owns
--    so the original party-based intent keeps working where parties DO exist.
--
--    Same class as approval_delegations.uas_del_self (createDelegation also writes
--    session.userId into delegator_party_id) — that one only survives via its
--    is_org_admin OR-branch, which is why the governance e2e drives it as admin.
--    NOT changed here: it is not broken, only admin-restricted.
--
--    SECURITY — this also closes a cross-tenant write hole. uas_dec_decider had NO
--    org scoping whatsoever: any authenticated user holding a parties row could
--    insert a decision against ANY org's instance if they knew its id (the app
--    checks the org first, but RLS must not depend on that). approval_decisions has
--    no org_id, so the new policy scopes through the parent instance and requires
--    the caller to be manager-band in THAT instance's org — mirroring the
--    isManagerPlus app gate.
--
-- 2. approval_instances UPDATE — no UPDATE/ALL policy existed, so the
--    decision → instance state advance (approved/rejected/returned + closed_at)
--    was RLS-denied. recordDecision ignored the error, so the instance silently
--    stayed open forever after a decision. Granted on the same operator-write band
--    as the INSERT policy (owner/admin/manager/controller/collaborator), org-scoped,
--    and the app now surfaces the error instead of swallowing it.

begin;

-- The decision → instance state advance (recordDecision).
drop policy if exists approval_instances_update on public.approval_instances;
create policy approval_instances_update on public.approval_instances
  as permissive
  for update
  to authenticated
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

-- Recording a decision. Replaces the parties-only, org-unscoped uas_dec_decider.
drop policy if exists uas_dec_decider on public.approval_decisions;
drop policy if exists approval_decisions_insert on public.approval_decisions;
create policy approval_decisions_insert on public.approval_decisions
  as permissive
  for insert
  to authenticated
  with check (
    -- The decider must be the caller: their auth uid (what the app writes) or a
    -- parties row they own (the original UAS intent, still honored).
    (
      decider_party_id = (select auth.uid())
      or decider_party_id in (
        select p.id from public.parties p where p.auth_user_id = (select auth.uid())
      )
    )
    -- ...and the decision must land on an instance in an org where the caller is
    -- manager-band. approval_decisions has no org_id — scope via the parent.
    and exists (
      select 1
      from public.approval_instances ai
      where ai.id = approval_decisions.instance_id
        and private.has_org_role(ai.org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text])
    )
  );

commit;
