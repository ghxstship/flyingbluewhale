-- kit 31 (COMPVSS Field v2.7) · record-level swipe-action stores + party self check-in.
--
-- 1) Per-member inbox row state: flag + archive live on the membership row
--    (same home as pinned_at / muted_at / last_read_at; RLS: own-row update).
alter table public.chat_room_members
  add column if not exists flagged_at timestamptz,
  add column if not exists archived_at timestamptz;

-- 2) Notification flag (read_at / deleted_at already exist; own-row RLS).
alter table public.notifications
  add column if not exists flagged_at timestamptz;

-- 3) Task flag + archive (tasks carried NO soft-delete column; archive is the
--    kit's non-destructive hide, so it gets its own timestamp rather than
--    overloading a delete). RLS: assignee may update own rows (tasks_update).
alter table public.tasks
  add column if not exists flagged_at timestamptz,
  add column if not exists archived_at timestamptz;

-- 4) Party self check-in. assignments_update RLS is manager-band only, so the
--    holder of an issued asset could never return their own gear (the swipe
--    canon's "Check In, only when Out"). SECURITY DEFINER RPC, same pattern as
--    approve_time_off_request: verifies the caller IS the party, restricts the
--    transition to the physical arc (issued/transferred/delivered -> returned),
--    and writes the append-only assignment_events state_change in the same
--    transaction.
create or replace function public.checkin_my_assignment(p_assignment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v public.assignments%rowtype;
begin
  select * into v
    from public.assignments
   where id = p_assignment_id
     and deleted_at is null
     and party_kind = 'user'
     and party_user_id = (select auth.uid())
   for update;
  if not found then
    raise exception 'assignment % not found or not yours', p_assignment_id;
  end if;
  if v.fulfillment_state not in ('issued', 'transferred', 'delivered') then
    raise exception 'assignment % is % and cannot be checked in', p_assignment_id, v.fulfillment_state;
  end if;
  update public.assignments
     set fulfillment_state = 'returned', updated_at = now()
   where id = v.id;
  insert into public.assignment_events (org_id, assignment_id, event_kind, from_state, to_state, actor_user_id)
  values (v.org_id, v.id, 'state_change', v.fulfillment_state, 'returned', (select auth.uid()));
end;
$$;

revoke all on function public.checkin_my_assignment(uuid) from public;
revoke all on function public.checkin_my_assignment(uuid) from anon;
grant execute on function public.checkin_my_assignment(uuid) to authenticated;
