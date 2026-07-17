-- Time corrections + punch audit — Phase 2 of
-- docs/compvss/TIME_MANAGEMENT_LIFECYCLE_PLAN.md.
--
-- Three gaps this closes:
--
--   1. No punch-level audit. Timesheet APPROVALS are audited
--      (timesheet_approvals), but nothing records who changed a punch,
--      from what, to what, or why. For payroll that is the difference
--      between "we log edits" and "edits are logged".
--   2. Posted sheets are editable. Nothing stops a punch on a posted
--      timesheet from being mutated after payroll consumed it.
--   3. Crew have no voice. The crew timesheet portal is strictly
--      read-only (p/[slug]/crew/timesheets), so a worker who was clocked
--      in wrong has no path but to find a manager. There is no
--      worker-initiated correction anywhere in the app.
--
-- LDP: `correction_state` is the CYCLICAL lifecycle of a correction
-- request (requested -> approved -> applied), so `_state`. `audit_action`
-- is a facet. Nothing is named `status`.

-- ============================================================
-- 1. Append-only punch audit
-- ============================================================

create table if not exists public.time_entry_audit (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  -- Deliberately NO foreign key: the audit trail must outlive the row it
  -- describes. A delete is exactly the event worth keeping.
  time_entry_id uuid not null,
  -- Null for a system/trigger-authored change (e.g. a backfill).
  actor_id uuid,
  audit_action text not null check (audit_action in ('insert', 'update', 'delete')),
  before_row jsonb,
  after_row jsonb,
  changed_fields text[],
  reason text,
  occurred_at timestamptz not null default now()
);

comment on table public.time_entry_audit is
  'Append-only audit of every time_entries mutation. Written by the tg_audit_time_entry trigger, never by application code — so no code path (correction applier, import, raw SQL, or a route added next year) can mutate a punch without leaving a record. Read-only to org members; there is no INSERT/UPDATE/DELETE policy, so only the SECURITY DEFINER trigger can write.';
comment on column public.time_entry_audit.time_entry_id is
  'Intentionally not an FK — the audit row must survive deletion of the entry it describes.';
comment on column public.time_entry_audit.reason is
  'Operator-supplied justification, passed via the app.edit_reason GUC by the RPC that made the change. Null for changes made outside that path.';

create index if not exists time_entry_audit_entry_idx
  on public.time_entry_audit (time_entry_id, occurred_at desc);
create index if not exists time_entry_audit_org_idx
  on public.time_entry_audit (org_id, occurred_at desc);
create index if not exists time_entry_audit_actor_idx
  on public.time_entry_audit (actor_id) where actor_id is not null;

alter table public.time_entry_audit enable row level security;

create policy time_entry_audit_read on public.time_entry_audit
  for select using (private.is_org_member(org_id));
-- No write policy by design. The trigger is SECURITY DEFINER; nobody else
-- can insert, and nobody at all can update or delete.

create or replace function public.tg_audit_time_entry() returns trigger
  language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
declare
  v_reason text := nullif(current_setting('app.edit_reason', true), '');
  v_before jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  v_after  jsonb := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
begin
  insert into public.time_entry_audit (
    org_id, time_entry_id, actor_id, audit_action, before_row, after_row, changed_fields, reason
  ) values (
    coalesce(new.org_id, old.org_id),
    coalesce(new.id, old.id),
    auth.uid(),
    lower(tg_op),
    v_before,
    v_after,
    case when tg_op = 'UPDATE' then (
      select coalesce(array_agg(key order by key), '{}')
      from jsonb_each(v_after)
      where v_after -> key is distinct from v_before -> key
    ) end,
    v_reason
  );
  return coalesce(new, old);
end;
$$;

comment on function public.tg_audit_time_entry() is
  'Writes one time_entry_audit row per time_entries mutation. AFTER trigger so it only records changes that actually committed. Reason travels via the app.edit_reason GUC (set_config) rather than a column, so the audit cannot be bypassed by a caller that simply omits it.';

drop trigger if exists time_entries_audit on public.time_entries;
create trigger time_entries_audit
  after insert or update or delete on public.time_entries
  for each row execute function public.tg_audit_time_entry();

-- ============================================================
-- 2. Posted-sheet lock
-- ============================================================

create or replace function public.tg_guard_posted_time_entry() returns trigger
  language plpgsql set search_path to 'public', 'pg_temp' as $$
declare v_state public.utt_timesheet_state;
begin
  if old.timesheet_id is null then
    return coalesce(new, old);
  end if;
  select state into v_state from public.timesheets where id = old.timesheet_id;
  if v_state in ('posted', 'archived') then
    raise exception 'Time entry % belongs to a % timesheet and is frozen. Re-open the timesheet to edit it.',
      old.id, v_state using errcode = '42501';
  end if;
  return coalesce(new, old);
end;
$$;

comment on function public.tg_guard_posted_time_entry() is
  'Refuses mutation of a punch on a posted/archived timesheet. Enforced at the database so no code path can edit hours payroll has already consumed. Editing an APPROVED (not yet posted) sheet is allowed but re-opens it — that is handled in the application applier, not here.';

drop trigger if exists time_entries_guard_posted on public.time_entries;
create trigger time_entries_guard_posted
  before update or delete on public.time_entries
  for each row execute function public.tg_guard_posted_time_entry();

-- ============================================================
-- 3. Crew self-correction
-- ============================================================

create table if not exists public.time_entry_corrections (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  -- Null only for 'missing_entry' — there is no row to point at yet.
  time_entry_id uuid references public.time_entries(id) on delete cascade,
  timesheet_id uuid references public.timesheets(id) on delete set null,
  requester_id uuid not null references auth.users(id),

  correction_kind text not null check (correction_kind in (
    'edit_in', 'edit_out', 'edit_both', 'missing_entry', 'delete_entry', 'zone_override')),

  -- Snapshot of what the worker was disputing, so the request still reads
  -- correctly after the entry moves on.
  original_started_at timestamptz,
  original_ended_at timestamptz,
  proposed_started_at timestamptz,
  proposed_ended_at timestamptz,
  proposed_zone_id uuid references public.time_clock_zones(id),

  reason text not null check (length(btrim(reason)) >= 10),

  correction_state text not null default 'requested'
    check (correction_state in ('requested', 'approved', 'denied', 'applied', 'withdrawn')),
  decided_by uuid references auth.users(id),
  decided_at timestamptz,
  decision_notes text,
  applied_at timestamptz,
  -- Mirrors the (dormant) timesheets.approval_instance_id: a hook for
  -- routing corrections through the generic approvals engine later
  -- without a second migration.
  approval_instance_id uuid references public.approval_instances(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- SEPARATION OF DUTIES, in the schema rather than only the app: a
  -- worker cannot approve their own request even if a bug, a compromised
  -- session, or a future code path tries it.
  constraint tec_no_self_approval check (decided_by is null or decided_by <> requester_id),

  -- A missing-entry request has no entry; every other kind must name one.
  constraint tec_missing_entry_shape check (
    (correction_kind = 'missing_entry' and time_entry_id is null and proposed_started_at is not null)
    or (correction_kind <> 'missing_entry' and time_entry_id is not null)
  ),

  -- A decision must record who made it and when, together.
  constraint tec_decision_shape check (
    (correction_state in ('requested', 'withdrawn') and decided_by is null and decided_at is null)
    or (correction_state in ('approved', 'denied', 'applied') and decided_by is not null and decided_at is not null)
  )
);

comment on table public.time_entry_corrections is
  'Worker-initiated time corrections. A request never mutates the punch: it proposes a change that a manager must approve, and the applier writes the entry (audited by tg_audit_time_entry). Closes the gap where the crew timesheet portal was read-only and a worker clocked in wrong had no path but to find a manager.';
comment on constraint tec_no_self_approval on public.time_entry_corrections is
  'Separation of duties: requester <> approver, enforced at the database so the app is not the only thing standing between a worker and their own approval.';
comment on column public.time_entry_corrections.correction_state is
  'LDP cyclical lifecycle: requested -> approved -> applied, or denied/withdrawn. `applied` is deliberately distinct from `approved`: approval is a decision, application is a database effect that can fail (posted-sheet lock, concurrent edit). Collapsing them would hide those failures.';

-- One open request per entry: a worker cannot spam a queue with variants.
create unique index if not exists tec_one_open_per_entry
  on public.time_entry_corrections (time_entry_id)
  where correction_state = 'requested' and time_entry_id is not null;

create index if not exists tec_org_state_idx
  on public.time_entry_corrections (org_id, correction_state, created_at desc);
create index if not exists tec_requester_idx on public.time_entry_corrections (requester_id);
create index if not exists tec_timesheet_idx on public.time_entry_corrections (timesheet_id) where timesheet_id is not null;
create index if not exists tec_decided_by_idx on public.time_entry_corrections (decided_by) where decided_by is not null;
create index if not exists tec_proposed_zone_idx on public.time_entry_corrections (proposed_zone_id) where proposed_zone_id is not null;

alter table public.time_entry_corrections enable row level security;

-- A worker files for themselves only, and only in the initial state.
create policy tec_insert_self on public.time_entry_corrections
  for insert with check (
    private.is_org_member(org_id)
    and requester_id = (select auth.uid())
    and correction_state = 'requested'
  );

-- Workers see their own; manager band sees the org queue.
create policy tec_read on public.time_entry_corrections
  for select using (
    private.is_org_member(org_id)
    and (
      requester_id = (select auth.uid())
      or private.has_org_role(org_id, array['owner', 'admin', 'manager'])
    )
  );

-- Only the manager band decides. The self-approval CHECK still applies.
create policy tec_manager_update on public.time_entry_corrections
  for update using (private.has_org_role(org_id, array['owner', 'admin', 'manager']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager']));

-- A requester may withdraw their own request while it is still open.
create policy tec_withdraw_own on public.time_entry_corrections
  for update using (
    private.is_org_member(org_id)
    and requester_id = (select auth.uid())
    and correction_state = 'requested'
  )
  with check (
    requester_id = (select auth.uid())
    and correction_state in ('requested', 'withdrawn')
  );

create or replace trigger time_entry_corrections_touch_updated_at
  before update on public.time_entry_corrections
  for each row execute function public.touch_updated_at();
