-- ============================================================================
-- 20260605160100 — deliverable_history snapshot trigger → SECURITY DEFINER
-- ============================================================================
-- DEPLOYMENT-READINESS REMEDIATION (found by E2E-LRP simulation 2026-06-05,
-- exposed once the status→fulfillment_state column bug was fixed).
--
-- `public.deliverable_history` has RLS enabled but NO insert policy (it is a
-- system-written audit table). The submit-snapshot trigger ran as the invoking
-- user, so its INSERT was blocked by RLS — i.e. submitting any deliverable
-- failed with "new row violates row-level security policy for table
-- deliverable_history". Make the trigger SECURITY DEFINER so the history write
-- runs with table-owner rights (the canonical pattern for audit/history
-- triggers). Reads of deliverable_history remain RLS-gated.
-- ============================================================================

create or replace function public.snapshot_deliverable_on_submit()
returns trigger
language plpgsql
security definer
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
