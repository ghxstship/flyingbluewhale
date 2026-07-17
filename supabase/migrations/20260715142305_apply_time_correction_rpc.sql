-- apply_time_correction — the transactional applier for an approved
-- correction. Phase 2 of TIME_MANAGEMENT_LIFECYCLE_PLAN.md.
--
-- Why an RPC and not application code: approving and applying must be one
-- transaction. decideTimesheet's split (audit row, then state update) is
-- exactly the shape that leaves a phantom decision behind when the second
-- write fails. Here the decision, the entry mutation, the audit reason,
-- and the re-open of an already-approved sheet either all land or none do.
--
-- SECURITY DEFINER because it sets the app.edit_reason GUC that
-- tg_audit_time_entry reads, and re-opens a timesheet the caller may not
-- otherwise update. It re-checks authority itself rather than trusting the
-- caller: manager band, same org, and never the requester.

create or replace function public.apply_time_correction(
  p_correction_id uuid,
  p_decision text,
  p_notes text default null
) returns jsonb
  language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
declare
  c public.time_entry_corrections;
  v_actor uuid := auth.uid();
  v_sheet_state public.utt_timesheet_state;
  v_reopened boolean := false;
  v_entry_id uuid;
begin
  if v_actor is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;
  if p_decision not in ('approved', 'denied') then
    raise exception 'Decision must be approved or denied, got %', p_decision using errcode = '22023';
  end if;

  -- Lock the request so two managers deciding at once cannot both win.
  select * into c from public.time_entry_corrections
   where id = p_correction_id for update;
  if not found then
    raise exception 'Correction not found' using errcode = 'P0002';
  end if;

  if not private.has_org_role(c.org_id, array['owner', 'admin', 'manager']) then
    raise exception 'Only managers can decide time corrections' using errcode = '42501';
  end if;

  -- Separation of duties, re-checked at the point of effect. The CHECK
  -- constraint also enforces it; this produces a sentence instead of a
  -- constraint-violation string.
  if c.requester_id = v_actor then
    raise exception 'You cannot decide your own correction request' using errcode = '42501';
  end if;

  if c.correction_state <> 'requested' then
    raise exception 'This correction is already %', c.correction_state using errcode = '55000';
  end if;

  if p_decision = 'denied' then
    update public.time_entry_corrections
       set correction_state = 'denied', decided_by = v_actor, decided_at = now(), decision_notes = p_notes
     where id = c.id;
    return jsonb_build_object('state', 'denied', 'reopened_timesheet', false);
  end if;

  -- Approved. Everything below is the effect.
  perform set_config(
    'app.edit_reason',
    format('Correction %s approved: %s', left(c.id::text, 8), c.reason),
    true
  );

  -- An approved-but-not-posted sheet must go back to open: the hours it
  -- blessed just changed. A posted sheet is refused by
  -- tg_guard_posted_time_entry below, which is deliberate.
  if c.timesheet_id is not null then
    select state into v_sheet_state from public.timesheets where id = c.timesheet_id;
    if v_sheet_state = 'approved' then
      update public.timesheets set state = 'open' where id = c.timesheet_id;
      v_reopened := true;
    end if;
  end if;

  if c.correction_kind = 'missing_entry' then
    insert into public.time_entries (
      org_id, user_id, started_at, ended_at, activity_category, source_channel, enforcement_state, enforcement_reason
    ) values (
      c.org_id, c.requester_id, c.proposed_started_at, c.proposed_ended_at, 'shift', 'correction',
      'overridden', format('Added by correction %s', left(c.id::text, 8))
    ) returning id into v_entry_id;

  elsif c.correction_kind = 'delete_entry' then
    -- Soft intent, hard record: the entry goes, the audit row stays (the
    -- audit table has no FK precisely for this).
    delete from public.time_entries where id = c.time_entry_id;
    v_entry_id := c.time_entry_id;

  elsif c.correction_kind = 'zone_override' then
    update public.time_entries
       set zone_id = c.proposed_zone_id,
           enforcement_state = 'overridden',
           enforcement_reason = format('Zone corrected via %s', left(c.id::text, 8))
     where id = c.time_entry_id;
    v_entry_id := c.time_entry_id;

  else
    -- edit_in / edit_out / edit_both. COALESCE so an unspecified side is
    -- left alone rather than nulled.
    update public.time_entries
       set started_at = coalesce(c.proposed_started_at, started_at),
           ended_at = coalesce(c.proposed_ended_at, ended_at),
           enforcement_state = case when enforcement_state = 'quarantined' then 'overridden' else enforcement_state end
     where id = c.time_entry_id;
    v_entry_id := c.time_entry_id;
  end if;

  update public.time_entry_corrections
     set correction_state = 'applied',
         decided_by = v_actor,
         decided_at = now(),
         decision_notes = p_notes,
         applied_at = now()
   where id = c.id;

  return jsonb_build_object(
    'state', 'applied',
    'reopened_timesheet', v_reopened,
    'time_entry_id', v_entry_id
  );
end;
$$;

comment on function public.apply_time_correction(uuid, text, text) is
  'Decide and apply a time correction in one transaction. Re-checks manager authority and separation of duties itself rather than trusting the caller. Sets app.edit_reason so tg_audit_time_entry records WHY the punch changed, and re-opens an approved (not posted) timesheet whose hours just moved. A posted sheet is refused by tg_guard_posted_time_entry, so the whole call rolls back and the correction stays approved-but-unapplied rather than reporting a success that did not happen.';

revoke all on function public.apply_time_correction(uuid, text, text) from public;
grant execute on function public.apply_time_correction(uuid, text, text) to authenticated;
