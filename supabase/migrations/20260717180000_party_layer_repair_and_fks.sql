-- Party-layer repair + FK canon (the 2026-07-17 FK/3NF audit, party class).
--
-- Every `*_party_id` column holds a `parties.id`. The audit found the live DB
-- disagreeing: 106 rows across 15 tables carried raw AUTH USER ids (7 users),
-- `clients.id` (5) or `vendors.id` (1) — write paths and seeds skipped the
-- party resolution, and with no FK both uuid spaces were silently accepted.
-- Same class as 20260716001500 (messages.author_party_id), now closed for the
-- WHOLE layer: 31 unconstrained party columns across 27 tables get FKs.
--
-- Repair rules are ORG-CHECKED (the 20260716001500 lesson: an unchecked map
-- plants a foreign tenant's party):
--   · An auth uid maps to the caller's party ONLY in the org that owns the
--     corrupt row (parties.auth_user_id + parties.org_id must both match).
--   · A member without a party gets one created IN that org — membership is
--     the authority to hold a party there (`uis_parties_org`).
--   · A NON-member's rows (seed-authored by test+owner/test+admin, who live in
--     the Test * orgs) get an UNLINKED provenance party in the row's org:
--     display identity preserved, auth_user_id deliberately NULL so the repair
--     grants no cross-tenant access. NULLing was the honest value in
--     20260716001500, but these columns are NOT NULL.
--   · clients/vendors referenced by party columns get `organization` parties
--     created in THEIR OWN org, and the map applies only where that org equals
--     the corrupt row's org.
--   · Org-less tables (availability_windows; post_mortems with a dangling
--     incident) map an auth uid only when it resolves to EXACTLY ONE live
--     party platform-wide — ambiguity means no repair.
--
-- Also replaces record_approval_decision: the RPC wrote auth.uid() straight
-- into decider_party_id (the app-side inversion, reproduced in SQL). It now
-- resolves/creates the caller's party in the instance org.

begin;

-- ── 1. Scan: every orphaned party value, with the org that owns the row ─────
create temp table _pr_rows (tbl text, col text, bad uuid, ctx_org uuid) on commit drop;

insert into _pr_rows (tbl, col, bad, ctx_org)
select 'accounts','party_id', t.party_id, t.org_id from public.accounts t
  where t.party_id is not null and not exists (select 1 from public.parties p where p.id=t.party_id)
union all
select 'approval_decisions','decider_party_id', t.decider_party_id,
  (select ai.org_id from public.approval_instances ai where ai.id=t.instance_id)
  from public.approval_decisions t
  where t.decider_party_id is not null and not exists (select 1 from public.parties p where p.id=t.decider_party_id)
union all
select 'approval_delegations','delegatee_party_id', t.delegatee_party_id, t.org_id from public.approval_delegations t
  where t.delegatee_party_id is not null and not exists (select 1 from public.parties p where p.id=t.delegatee_party_id)
union all
select 'approval_delegations','delegator_party_id', t.delegator_party_id, t.org_id from public.approval_delegations t
  where t.delegator_party_id is not null and not exists (select 1 from public.parties p where p.id=t.delegator_party_id)
union all
select 'availability_windows','party_id', t.party_id, null::uuid from public.availability_windows t
  where t.party_id is not null and not exists (select 1 from public.parties p where p.id=t.party_id)
union all
select 'contract_parties','party_id', t.party_id,
  (select ct.org_id from public.contracts ct where ct.id=t.contract_id)
  from public.contract_parties t
  where t.party_id is not null and not exists (select 1 from public.parties p where p.id=t.party_id)
union all
select 'contract_signatures','signer_party_id', t.signer_party_id,
  (select ct.org_id from public.contracts ct where ct.id=t.contract_id)
  from public.contract_signatures t
  where t.signer_party_id is not null and not exists (select 1 from public.parties p where p.id=t.signer_party_id)
union all
select 'message_mentions','mentioned_party_id', t.mentioned_party_id,
  (select mc.org_id from public.messages m join public.message_channels mc on mc.id=m.channel_id where m.id=t.message_id)
  from public.message_mentions t
  where t.mentioned_party_id is not null and not exists (select 1 from public.parties p where p.id=t.mentioned_party_id)
union all
select 'message_reactions','party_id', t.party_id,
  (select mc.org_id from public.messages m join public.message_channels mc on mc.id=m.channel_id where m.id=t.message_id)
  from public.message_reactions t
  where t.party_id is not null and not exists (select 1 from public.parties p where p.id=t.party_id)
union all
select 'message_read_receipts','party_id', t.party_id,
  (select mc.org_id from public.messages m join public.message_channels mc on mc.id=m.channel_id where m.id=t.message_id)
  from public.message_read_receipts t
  where t.party_id is not null and not exists (select 1 from public.parties p where p.id=t.party_id)
union all
select 'opportunities','party_id', t.party_id, t.org_id from public.opportunities t
  where t.party_id is not null and not exists (select 1 from public.parties p where p.id=t.party_id)
union all
select 'pay_rates','party_id', t.party_id, t.org_id from public.pay_rates t
  where t.party_id is not null and not exists (select 1 from public.parties p where p.id=t.party_id)
union all
select 'post_mortems','facilitator_party_id', t.facilitator_party_id,
  (select i.org_id from public.incidents i where i.id=t.incident_id)
  from public.post_mortems t
  where t.facilitator_party_id is not null and not exists (select 1 from public.parties p where p.id=t.facilitator_party_id)
union all
select 'thread_subscribers','party_id', t.party_id,
  (select th.org_id from public.comment_threads th where th.id=t.thread_id)
  from public.thread_subscribers t
  where t.party_id is not null and not exists (select 1 from public.parties p where p.id=t.party_id)
union all
select 'timesheet_approvals','approver_party_id', t.approver_party_id,
  (select ts2.org_id from public.timesheets ts2 where ts2.id=t.timesheet_id)
  from public.timesheet_approvals t
  where t.approver_party_id is not null and not exists (select 1 from public.parties p where p.id=t.approver_party_id)
union all
select 'timesheets','party_id', t.party_id, t.org_id from public.timesheets t
  where t.party_id is not null and not exists (select 1 from public.parties p where p.id=t.party_id)
union all
select 'transaction_parties','party_id', t.party_id,
  (select tx.org_id from public.transactions tx where tx.id=t.transaction_id)
  from public.transaction_parties t
  where t.party_id is not null and not exists (select 1 from public.parties p where p.id=t.party_id);

-- ── 2. Create the parties the map needs ─────────────────────────────────────

-- 2a. clients → organization parties, in the CLIENT's own org, applied only
--     where that org also owns the corrupt row (the join enforces both).
insert into public.parties (org_id, type, display_name, legal_name, metadata)
select distinct cl.org_id, 'organization'::public.party_type, cl.name, cl.name,
  jsonb_build_object('provenance','party_layer_repair_20260717','source_table','clients','source_id',cl.id::text)
from _pr_rows r
join public.clients cl on cl.id = r.bad and cl.org_id = r.ctx_org
where not exists (
  select 1 from public.parties p
  where p.org_id = cl.org_id
    and p.metadata->>'provenance' = 'party_layer_repair_20260717'
    and p.metadata->>'source_id' = cl.id::text
);

-- 2b. vendors → organization parties, same rule.
insert into public.parties (org_id, type, display_name, legal_name, metadata)
select distinct v.org_id, 'organization'::public.party_type, v.name, v.name,
  jsonb_build_object('provenance','party_layer_repair_20260717','source_table','vendors','source_id',v.id::text)
from _pr_rows r
join public.vendors v on v.id = r.bad and v.org_id = r.ctx_org
where not exists (
  select 1 from public.parties p
  where p.org_id = v.org_id
    and p.metadata->>'provenance' = 'party_layer_repair_20260717'
    and p.metadata->>'source_id' = v.id::text
);

-- 2c. auth users who ARE live members of the row's org but have no party
--     there → linked person party (membership is the authority to hold one).
insert into public.parties (org_id, type, display_name, auth_user_id, primary_email, metadata)
select distinct r.ctx_org, 'person'::public.party_type,
  coalesce(nullif(pu.name,''), nullif(split_part(coalesce(u.email,''),'@',1),''), 'Member'),
  u.id, u.email,
  jsonb_build_object('provenance','party_layer_repair_20260717','source_table','auth.users','source_id',u.id::text)
from _pr_rows r
join auth.users u on u.id = r.bad
join public.memberships m on m.org_id = r.ctx_org and m.user_id = u.id and m.deleted_at is null
left join public.users pu on pu.id = u.id
where r.ctx_org is not null
  and not exists (
    select 1 from public.parties p
    where p.org_id = r.ctx_org and p.auth_user_id = u.id and p.deleted_at is null
  );

-- 2d. auth users who are NOT members of the row's org (seed-authored debris:
--     test+owner / test+admin acted in Demo Events Co. via service-role seeds)
--     → UNLINKED provenance party in the row's org. auth_user_id stays NULL on
--     purpose: linking would hand a foreign tenant's user a party-keyed
--     foothold in this org. The identity is preserved as display data only.
insert into public.parties (org_id, type, display_name, primary_email, metadata)
select distinct r.ctx_org, 'person'::public.party_type,
  coalesce(nullif(pu.name,''), nullif(split_part(coalesce(u.email,''),'@',1),''), 'Former member'),
  u.email,
  jsonb_build_object('provenance','party_layer_repair_20260717','source_table','auth.users','source_id',u.id::text,
                     'unlinked','non-member of this org; seed-authored rows')
from _pr_rows r
join auth.users u on u.id = r.bad
left join public.users pu on pu.id = u.id
where r.ctx_org is not null
  and not exists (
    select 1 from public.memberships m
    where m.org_id = r.ctx_org and m.user_id = u.id and m.deleted_at is null
  )
  and not exists (
    select 1 from public.parties p
    where p.org_id = r.ctx_org
      and p.metadata->>'provenance' = 'party_layer_repair_20260717'
      and p.metadata->>'source_id' = u.id::text
  );

-- ── 3. Build the org-checked map and apply it ───────────────────────────────
create temp table _pmap on commit drop as
select r.bad, r.ctx_org, p.id as party
from (select distinct bad, ctx_org from _pr_rows where ctx_org is not null) r
join public.parties p on p.org_id = r.ctx_org and p.deleted_at is null
  and (
    p.auth_user_id = r.bad
    or (p.metadata->>'provenance' = 'party_layer_repair_20260717' and p.metadata->>'source_id' = r.bad::text)
  );

-- One party per (bad value, org) or the repair is ambiguous — stop.
do $$
begin
  if exists (select 1 from _pmap group by bad, ctx_org having count(*) > 1) then
    raise exception 'party repair map is ambiguous — a bad value resolves to multiple parties in one org';
  end if;
end $$;

-- Org-less fallback map: an auth uid usable ONLY when it resolves to exactly
-- one live linked party anywhere on the platform.
create temp table _pmap_unique on commit drop as
select x.bad, min(x.party::text)::uuid as party
from (
  select distinct r.bad, p.id as party
  from (select distinct bad from _pr_rows where ctx_org is null) r
  join public.parties p on p.auth_user_id = r.bad and p.deleted_at is null
) x
group by x.bad
having count(*) = 1;

-- Org-checked updates (the map join carries the org equality).
update public.accounts t set party_id = m.party
  from _pmap m where t.party_id = m.bad and m.ctx_org = t.org_id
  and not exists (select 1 from public.parties p where p.id = t.party_id);
update public.approval_decisions t set decider_party_id = m.party
  from _pmap m where t.decider_party_id = m.bad
  and m.ctx_org = (select ai.org_id from public.approval_instances ai where ai.id = t.instance_id)
  and not exists (select 1 from public.parties p where p.id = t.decider_party_id);
update public.approval_delegations t set delegatee_party_id = m.party
  from _pmap m where t.delegatee_party_id = m.bad and m.ctx_org = t.org_id
  and not exists (select 1 from public.parties p where p.id = t.delegatee_party_id);
update public.approval_delegations t set delegator_party_id = m.party
  from _pmap m where t.delegator_party_id = m.bad and m.ctx_org = t.org_id
  and not exists (select 1 from public.parties p where p.id = t.delegator_party_id);
update public.contract_parties t set party_id = m.party
  from _pmap m where t.party_id = m.bad
  and m.ctx_org = (select ct.org_id from public.contracts ct where ct.id = t.contract_id)
  and not exists (select 1 from public.parties p where p.id = t.party_id);
update public.contract_signatures t set signer_party_id = m.party
  from _pmap m where t.signer_party_id = m.bad
  and m.ctx_org = (select ct.org_id from public.contracts ct where ct.id = t.contract_id)
  and not exists (select 1 from public.parties p where p.id = t.signer_party_id);
update public.message_mentions t set mentioned_party_id = m.party
  from _pmap m where t.mentioned_party_id = m.bad
  and m.ctx_org = (select mc.org_id from public.messages ms join public.message_channels mc on mc.id = ms.channel_id where ms.id = t.message_id)
  and not exists (select 1 from public.parties p where p.id = t.mentioned_party_id);
update public.message_reactions t set party_id = m.party
  from _pmap m where t.party_id = m.bad
  and m.ctx_org = (select mc.org_id from public.messages ms join public.message_channels mc on mc.id = ms.channel_id where ms.id = t.message_id)
  and not exists (select 1 from public.parties p where p.id = t.party_id);
update public.message_read_receipts t set party_id = m.party
  from _pmap m where t.party_id = m.bad
  and m.ctx_org = (select mc.org_id from public.messages ms join public.message_channels mc on mc.id = ms.channel_id where ms.id = t.message_id)
  and not exists (select 1 from public.parties p where p.id = t.party_id);
update public.opportunities t set party_id = m.party
  from _pmap m where t.party_id = m.bad and m.ctx_org = t.org_id
  and not exists (select 1 from public.parties p where p.id = t.party_id);
update public.pay_rates t set party_id = m.party
  from _pmap m where t.party_id = m.bad and m.ctx_org = t.org_id
  and not exists (select 1 from public.parties p where p.id = t.party_id);
update public.post_mortems t set facilitator_party_id = m.party
  from _pmap m where t.facilitator_party_id = m.bad
  and m.ctx_org = (select i.org_id from public.incidents i where i.id = t.incident_id)
  and not exists (select 1 from public.parties p where p.id = t.facilitator_party_id);
update public.thread_subscribers t set party_id = m.party
  from _pmap m where t.party_id = m.bad
  and m.ctx_org = (select th.org_id from public.comment_threads th where th.id = t.thread_id)
  and not exists (select 1 from public.parties p where p.id = t.party_id);
update public.timesheet_approvals t set approver_party_id = m.party
  from _pmap m where t.approver_party_id = m.bad
  and m.ctx_org = (select ts2.org_id from public.timesheets ts2 where ts2.id = t.timesheet_id)
  and not exists (select 1 from public.parties p where p.id = t.approver_party_id);
update public.timesheets t set party_id = m.party
  from _pmap m where t.party_id = m.bad and m.ctx_org = t.org_id
  and not exists (select 1 from public.parties p where p.id = t.party_id);
update public.transaction_parties t set party_id = m.party
  from _pmap m where t.party_id = m.bad
  and m.ctx_org = (select tx.org_id from public.transactions tx where tx.id = t.transaction_id)
  and not exists (select 1 from public.parties p where p.id = t.party_id);

-- Org-less tables: unique-party rule only.
update public.availability_windows t set party_id = m.party
  from _pmap_unique m where t.party_id = m.bad
  and not exists (select 1 from public.parties p where p.id = t.party_id);
update public.post_mortems t set facilitator_party_id = m.party
  from _pmap_unique m where t.facilitator_party_id = m.bad
  and not exists (select 1 from public.parties p where p.id = t.facilitator_party_id);

-- ── 4. record_approval_decision: resolve the party, never write the uid ─────
-- Body otherwise identical to 20260715140000 (lock, authority re-check,
-- terminal guard, step/policy guard, single home for the decision→state map).
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
  v_party uuid;
  v_next text;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select * into v_inst from public.approval_instances where id = p_instance_id for update;
  if not found then
    raise exception 'approval instance % not found', p_instance_id;
  end if;

  if not private.has_org_role(
    v_inst.org_id,
    array['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]
  ) then
    raise exception 'caller lacks manager-band authority on org %', v_inst.org_id;
  end if;

  if v_inst.state in ('approved', 'rejected', 'closed', 'cancelled') then
    raise exception 'approval instance % is already % and cannot take a decision', p_instance_id, v_inst.state;
  end if;

  if not exists (
    select 1 from public.approval_steps s
    where s.id = p_step_id and s.policy_id = v_inst.policy_id
  ) then
    raise exception 'step % does not belong to the policy of instance %', p_step_id, p_instance_id;
  end if;

  -- decider_party_id is a parties.id, never the auth uid. Get-or-create the
  -- caller's party in the instance org — the manager-band check above already
  -- proved membership, which is the authority to hold a party here.
  select p.id into v_party
  from public.parties p
  where p.org_id = v_inst.org_id and p.auth_user_id = v_uid and p.deleted_at is null
  limit 1;
  if v_party is null then
    insert into public.parties (org_id, type, display_name, auth_user_id, primary_email)
    select v_inst.org_id, 'person'::public.party_type,
      coalesce(nullif(pu.name, ''), nullif(split_part(coalesce(u.email, ''), '@', 1), ''), 'Member'),
      u.id, u.email
    from auth.users u
    left join public.users pu on pu.id = u.id
    where u.id = v_uid
    returning id into v_party;
  end if;
  if v_party is null then
    raise exception 'could not resolve a party for the decider in org %', v_inst.org_id;
  end if;

  insert into public.approval_decisions (instance_id, step_id, decider_party_id, decision, notes)
  values (p_instance_id, p_step_id, v_party, p_decision, nullif(p_notes, ''));

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

comment on function public.record_approval_decision(uuid, uuid, text, text) is
  'Atomically record an approval decision and advance its instance state. SECURITY DEFINER + EXECUTE TO authenticated is intentional — the function re-checks manager-band authority on the instance org, rejects terminal instances, and verifies the step belongs to the instance policy. decider_party_id is resolved (get-or-create) through the party layer, never written as the raw auth uid.';

-- ── 5. Assert the layer is clean, then make the class impossible ────────────
do $$
declare
  spec record;
  n bigint;
begin
  for spec in
    select * from (values
      ('accounts','party_id'),('accounts','primary_owner_party_id'),
      ('approval_decisions','decider_party_id'),
      ('approval_delegations','delegatee_party_id'),('approval_delegations','delegator_party_id'),
      ('audit_events','actor_party_id'),('availability_windows','party_id'),
      ('calendar_subscriptions','party_id'),('comment_mentions','mentioned_party_id'),
      ('comment_reactions','party_id'),('contract_parties','party_id'),
      ('contract_signatures','signer_party_id'),('domain_events','actor_party_id'),
      ('event_participants','party_id'),('incident_parties','party_id'),
      ('message_mentions','mentioned_party_id'),('message_reactions','party_id'),
      ('message_read_receipts','party_id'),('opportunities','party_id'),
      ('pay_rates','party_id'),('payment_methods','party_id'),
      ('post_mortems','facilitator_party_id'),('search_queries','actor_party_id'),
      ('subscriptions','party_id'),('thread_subscribers','party_id'),
      ('timesheet_approvals','approver_party_id'),('timesheets','party_id'),
      ('transaction_parties','party_id'),('ucm_comments','author_party_id'),
      ('usr_saved_searches','party_id'),('wizard_instances','party_id')
    ) v(tbl, col)
  loop
    execute format(
      'select count(*) from public.%I t where t.%I is not null and not exists (select 1 from public.parties p where p.id = t.%I)',
      spec.tbl, spec.col, spec.col
    ) into n;
    if n > 0 then
      raise exception 'party repair incomplete: %.% still has % orphaned value(s)', spec.tbl, spec.col, n;
    end if;
  end loop;
end $$;

-- FKs. NO ACTION by default (history must survive; parties soft-delete via
-- deleted_at, so a hard delete deserves to be loud). CASCADE only on pure
-- party↔thing junctions (the channel_memberships precedent); SET NULL only on
-- nullable actor stamps (the messages.author_party_id precedent).
alter table public.accounts add constraint accounts_party_id_fkey
  foreign key (party_id) references public.parties(id);
alter table public.accounts add constraint accounts_primary_owner_party_id_fkey
  foreign key (primary_owner_party_id) references public.parties(id) on delete set null;
alter table public.approval_decisions add constraint approval_decisions_decider_party_id_fkey
  foreign key (decider_party_id) references public.parties(id);
alter table public.approval_delegations add constraint approval_delegations_delegatee_party_id_fkey
  foreign key (delegatee_party_id) references public.parties(id);
alter table public.approval_delegations add constraint approval_delegations_delegator_party_id_fkey
  foreign key (delegator_party_id) references public.parties(id);
alter table public.audit_events add constraint audit_events_actor_party_id_fkey
  foreign key (actor_party_id) references public.parties(id) on delete set null;
alter table public.availability_windows add constraint availability_windows_party_id_fkey
  foreign key (party_id) references public.parties(id);
alter table public.calendar_subscriptions add constraint calendar_subscriptions_party_id_fkey
  foreign key (party_id) references public.parties(id);
alter table public.comment_mentions add constraint comment_mentions_mentioned_party_id_fkey
  foreign key (mentioned_party_id) references public.parties(id) on delete cascade;
alter table public.comment_reactions add constraint comment_reactions_party_id_fkey
  foreign key (party_id) references public.parties(id) on delete cascade;
alter table public.contract_parties add constraint contract_parties_party_id_fkey
  foreign key (party_id) references public.parties(id);
alter table public.contract_signatures add constraint contract_signatures_signer_party_id_fkey
  foreign key (signer_party_id) references public.parties(id);
alter table public.domain_events add constraint domain_events_actor_party_id_fkey
  foreign key (actor_party_id) references public.parties(id) on delete set null;
alter table public.event_participants add constraint event_participants_party_id_fkey
  foreign key (party_id) references public.parties(id) on delete cascade;
alter table public.incident_parties add constraint incident_parties_party_id_fkey
  foreign key (party_id) references public.parties(id);
alter table public.message_mentions add constraint message_mentions_mentioned_party_id_fkey
  foreign key (mentioned_party_id) references public.parties(id) on delete cascade;
alter table public.message_reactions add constraint message_reactions_party_id_fkey
  foreign key (party_id) references public.parties(id) on delete cascade;
alter table public.message_read_receipts add constraint message_read_receipts_party_id_fkey
  foreign key (party_id) references public.parties(id) on delete cascade;
alter table public.opportunities add constraint opportunities_party_id_fkey
  foreign key (party_id) references public.parties(id);
alter table public.pay_rates add constraint pay_rates_party_id_fkey
  foreign key (party_id) references public.parties(id);
alter table public.payment_methods add constraint payment_methods_party_id_fkey
  foreign key (party_id) references public.parties(id);
alter table public.post_mortems add constraint post_mortems_facilitator_party_id_fkey
  foreign key (facilitator_party_id) references public.parties(id) on delete set null;
alter table public.search_queries add constraint search_queries_actor_party_id_fkey
  foreign key (actor_party_id) references public.parties(id) on delete set null;
alter table public.subscriptions add constraint subscriptions_party_id_fkey
  foreign key (party_id) references public.parties(id);
alter table public.thread_subscribers add constraint thread_subscribers_party_id_fkey
  foreign key (party_id) references public.parties(id) on delete cascade;
alter table public.timesheet_approvals add constraint timesheet_approvals_approver_party_id_fkey
  foreign key (approver_party_id) references public.parties(id);
alter table public.timesheets add constraint timesheets_party_id_fkey
  foreign key (party_id) references public.parties(id);
alter table public.transaction_parties add constraint transaction_parties_party_id_fkey
  foreign key (party_id) references public.parties(id);
alter table public.ucm_comments add constraint ucm_comments_author_party_id_fkey
  foreign key (author_party_id) references public.parties(id) on delete set null;
alter table public.usr_saved_searches add constraint usr_saved_searches_party_id_fkey
  foreign key (party_id) references public.parties(id);
alter table public.wizard_instances add constraint wizard_instances_party_id_fkey
  foreign key (party_id) references public.parties(id) on delete set null;

-- Covering indexes for the new FKs (the 0050 convention). Skipped where the
-- column already leads an index: accounts.party_id (acc_unique),
-- pay_rates.party_id (pr_unique), subscriptions.party_id,
-- wizard_instances.party_id.
create index if not exists idx_accounts_primary_owner_party_id on public.accounts (primary_owner_party_id);
create index if not exists idx_approval_decisions_decider_party_id on public.approval_decisions (decider_party_id);
create index if not exists idx_approval_delegations_delegatee_party_id on public.approval_delegations (delegatee_party_id);
create index if not exists idx_approval_delegations_delegator_party_id on public.approval_delegations (delegator_party_id);
create index if not exists idx_audit_events_actor_party_id on public.audit_events (actor_party_id);
create index if not exists idx_availability_windows_party_id on public.availability_windows (party_id);
create index if not exists idx_calendar_subscriptions_party_id on public.calendar_subscriptions (party_id);
create index if not exists idx_comment_mentions_mentioned_party_id on public.comment_mentions (mentioned_party_id);
create index if not exists idx_comment_reactions_party_id on public.comment_reactions (party_id);
create index if not exists idx_contract_parties_party_id on public.contract_parties (party_id);
create index if not exists idx_contract_signatures_signer_party_id on public.contract_signatures (signer_party_id);
create index if not exists idx_domain_events_actor_party_id on public.domain_events (actor_party_id);
create index if not exists idx_event_participants_party_id on public.event_participants (party_id);
create index if not exists idx_incident_parties_party_id on public.incident_parties (party_id);
create index if not exists idx_message_mentions_mentioned_party_id on public.message_mentions (mentioned_party_id);
create index if not exists idx_message_reactions_party_id on public.message_reactions (party_id);
create index if not exists idx_message_read_receipts_party_id on public.message_read_receipts (party_id);
create index if not exists idx_opportunities_party_id on public.opportunities (party_id);
create index if not exists idx_payment_methods_party_id on public.payment_methods (party_id);
create index if not exists idx_post_mortems_facilitator_party_id on public.post_mortems (facilitator_party_id);
create index if not exists idx_search_queries_actor_party_id on public.search_queries (actor_party_id);
create index if not exists idx_thread_subscribers_party_id on public.thread_subscribers (party_id);
create index if not exists idx_timesheet_approvals_approver_party_id on public.timesheet_approvals (approver_party_id);
create index if not exists idx_timesheets_party_id on public.timesheets (party_id);
create index if not exists idx_transaction_parties_party_id on public.transaction_parties (party_id);
create index if not exists idx_ucm_comments_author_party_id on public.ucm_comments (author_party_id);
create index if not exists idx_usr_saved_searches_party_id on public.usr_saved_searches (party_id);

commit;
