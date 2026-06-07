-- ============================================================================
-- 0073 — Keep legacy spent_cents in sync with XPMS actual_cents
-- ============================================================================
--
-- The XPMS migration (0070) introduced budgets.actual_cents as the
-- canonical "actual spend" column, computed automatically by the
-- expenses-rollup trigger (0072). Several pre-XPMS readers continue
-- to query the legacy budgets.spent_cents field directly:
--
--   • /console/dashboards — Portfolio KPI rollup
--   • /console/projects/[projectId]/overview — project metrics
--   • /console/projects/[projectId]/finance — project finance hub
--   • /p/[slug]/producer/pnl — portal P&L page
--   • /console/campaigns — campaign spend rollup
--   • DataTable consumers on /console/finance/budgets (list page)
--
-- Updating each reader to coalesce(actual_cents, spent_cents) would
-- be a large surface-area refactor. Instead this migration teaches
-- the expenses trigger to write to BOTH columns so legacy readers see
-- correct values without code changes. The XPMS-aware code can keep
-- reading actual_cents directly; legacy code keeps reading spent_cents.
--
-- ============================================================================

create or replace function private.budgets_recompute_actual(
  p_org_id uuid,
  p_project_id uuid,
  p_department text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  total_cents bigint;
begin
  if p_project_id is null or p_department is null then return; end if;

  select coalesce(sum(amount_cents), 0)
    into total_cents
    from public.expenses
   where org_id = p_org_id
     and project_id = p_project_id
     and department = p_department
     and status in ('approved', 'reimbursed');

  -- Keep BOTH columns in sync — legacy readers query spent_cents,
  -- XPMS readers query actual_cents, but they hold the same value.
  update public.budgets
     set actual_cents = total_cents,
         spent_cents = total_cents
   where org_id = p_org_id
     and project_id = p_project_id
     and department = p_department;
end;
$$;

-- One-time backfill: where actual_cents is non-zero, copy to
-- spent_cents so legacy readers see the trigger's results immediately.
-- Where spent_cents is non-zero but actual_cents is null (legacy rows
-- with manual reconciliation but no expenses linked), copy the other
-- direction so XPMS readers see the legacy value.

update public.budgets
   set spent_cents = actual_cents
 where actual_cents is not null
   and actual_cents > 0
   and (spent_cents is null or spent_cents = 0);

update public.budgets
   set actual_cents = spent_cents
 where spent_cents is not null
   and spent_cents > 0
   and (actual_cents is null or actual_cents = 0);

comment on column public.budgets.spent_cents is
  'LEGACY — kept in sync with actual_cents by the expenses trigger (0073). New code should prefer actual_cents.';
