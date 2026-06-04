-- ============================================================================
-- 0072 — Expenses → budgets.actual_cents rollup trigger
-- ============================================================================
--
-- Phase 3 of the XPMS Universal Budget Template migration. Wires the
-- Expenses ledger into the Budget actuals so the ACTUAL column on each
-- budget row reflects approved spend without manual data entry.
--
-- Rollup rule (mirrors the XPMS Summary sheet):
--
--   budgets.actual_cents = sum of public.expenses.amount_cents
--                         where status in ('approved', 'reimbursed')
--                           and project_id matches
--                           and department matches
--
-- Trigger fires on every expense insert/update/delete and recomputes
-- the targeted budget rows (the old row's match + the new row's match)
-- so reassignments + deletes balance correctly.
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

  update public.budgets
     set actual_cents = total_cents
   where org_id = p_org_id
     and project_id = p_project_id
     and department = p_department;
end;
$$;

create or replace function private.expenses_rollup_actual()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- On delete + update, recompute the OLD row's bucket so its
  -- contribution is removed.
  if tg_op in ('UPDATE', 'DELETE') then
    if old.project_id is not null and old.department is not null then
      perform private.budgets_recompute_actual(old.org_id, old.project_id, old.department);
    end if;
  end if;

  -- On insert + update, recompute the NEW row's bucket so its
  -- contribution is included.
  if tg_op in ('INSERT', 'UPDATE') then
    if new.project_id is not null and new.department is not null then
      perform private.budgets_recompute_actual(new.org_id, new.project_id, new.department);
    end if;
  end if;

  return null;
end;
$$;

drop trigger if exists tg_expenses_rollup_actual on public.expenses;
create trigger tg_expenses_rollup_actual
  after insert or update or delete on public.expenses
  for each row execute function private.expenses_rollup_actual();

-- One-time backfill so the existing budgets reflect their current
-- approved/reimbursed expense totals immediately.

with totals as (
  select org_id, project_id, department, sum(amount_cents) as total
    from public.expenses
   where project_id is not null
     and department is not null
     and status in ('approved', 'reimbursed')
   group by org_id, project_id, department
)
update public.budgets b
   set actual_cents = t.total
  from totals t
 where b.org_id = t.org_id
   and b.project_id = t.project_id
   and b.department = t.department;

comment on function private.expenses_rollup_actual is
  'XPMS Expenses → budgets.actual_cents rollup. Fires on every expense write; recomputes both old + new buckets so reassignments balance.';
comment on function private.budgets_recompute_actual is
  'Recompute budgets.actual_cents for a single (org, project, department) bucket from approved/reimbursed expenses.';
