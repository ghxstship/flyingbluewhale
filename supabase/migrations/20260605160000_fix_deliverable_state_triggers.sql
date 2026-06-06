-- ============================================================================
-- 20260605160000 — Fix deliverable lifecycle triggers (status → fulfillment_state)
-- ============================================================================
-- DEPLOYMENT-READINESS REMEDIATION (found by E2E-LRP simulation 2026-06-05).
--
-- When `deliverables.status`/`deliverable_state` were consolidated into
-- `fulfillment_state` (unified-assignments rename), three trigger functions
-- were left referencing the dropped columns. Result: EVERY update to a
-- deliverable raised `record "new" has no field "status"` — the deliverable
-- doc lifecycle (submit/review/approve/deliver) was broken in production.
--
--   1. private.sync_deliverable_state  — obsolete dual-write shim (both
--      status + deliverable_state are gone). Drop trigger + function.
--   2. public.enforce_deliverable_deadline — `new.status`  → `new.fulfillment_state`
--   3. public.snapshot_deliverable_on_submit — `*.status`  → `*.fulfillment_state`
-- ============================================================================

-- 1 · drop the obsolete sync shim (it synced two columns that no longer exist)
drop trigger if exists deliverables_sync_state on public.deliverables;
drop function if exists private.sync_deliverable_state();

-- 2 · deadline enforcement on submit
create or replace function public.enforce_deliverable_deadline()
returns trigger
language plpgsql
set search_path to 'public', 'pg_temp'
as $function$
begin
  if new.fulfillment_state = 'submitted' and new.deadline is not null and now() > new.deadline then
    raise exception 'Cannot submit after deadline: %', new.deadline;
  end if;
  return new;
end;
$function$;

-- 3 · version snapshot on submit transition
create or replace function public.snapshot_deliverable_on_submit()
returns trigger
language plpgsql
set search_path to 'public', 'pg_temp'
as $function$
begin
  if (old.fulfillment_state is distinct from new.fulfillment_state) and new.fulfillment_state = 'submitted' then
    new.version = old.version + 1;
    new.submitted_at = now();
    insert into deliverable_history (deliverable_id, version, data, changed_by)
    values (new.id, new.version, new.data, coalesce(new.submitted_by, old.submitted_by, auth.uid()));
  end if;
  return new;
end;
$function$;

-- 4 · while here: pin the Event-Kit trigger search_path (clears the lint the
--     kit framework introduced; matches the repo's hardened-function norm)
alter function private.kit_lines_compute_estimate() set search_path = 'public', 'pg_temp';
