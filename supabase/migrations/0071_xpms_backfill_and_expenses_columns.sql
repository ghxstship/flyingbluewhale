-- ============================================================================
-- 0071 — XPMS backfill + expenses taxonomy columns
-- ============================================================================
--
-- Phase 2 of the XPMS Universal Budget Template migration. Backfills
-- existing budgets.department from the legacy budgets.category where it
-- maps to a canonical XPMS_DEPARTMENT (matched case-insensitively). Then
-- adds the same XPMS taxonomy columns to public.expenses so the
-- Expenses sheet of the template can populate them and the actuals
-- rollup trigger (migration 0072) has the right join columns.
--
-- ============================================================================

-- Backfill budgets.department from category --------------------------------

update public.budgets
   set department = canonical
  from (
    values
      ('Executive'),
      ('Creative'),
      ('Talent'),
      ('Marketing'),
      ('Build'),
      ('Production'),
      ('Operations'),
      ('Experience'),
      ('Hospitality'),
      ('Technology')
  ) as v(canonical)
 where public.budgets.department is null
   and public.budgets.category is not null
   and lower(public.budgets.category) = lower(v.canonical);

-- Extend expenses with XPMS columns ----------------------------------------

alter table public.expenses
  add column if not exists department text,
  add column if not exists class text,
  add column if not exists item text,
  add column if not exists discipline public.budget_discipline,
  add column if not exists xpms_phase text,
  add column if not exists vendor text,
  add column if not exists expense_type text,
  add column if not exists method_of_payment text,
  add column if not exists invoice text,
  add column if not exists due_date date,
  add column if not exists payment_date date,
  add column if not exists confirmation text,
  add column if not exists flag boolean not null default false,
  add column if not exists external_notes text,
  add column if not exists internal_notes text;

-- Mirror the 8-gate xpms_phase check constraint
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'expenses_xpms_phase_check'
  ) then
    alter table public.expenses
      add constraint expenses_xpms_phase_check
      check (xpms_phase is null or xpms_phase in (
        'Discovery', 'Design', 'Advance', 'Procurement',
        'Build', 'Install', 'Operate', 'Close'
      ));
  end if;
end$$;

-- Backfill expenses.department from category by the same rule -------------

update public.expenses
   set department = canonical
  from (
    values
      ('Executive'),
      ('Creative'),
      ('Talent'),
      ('Marketing'),
      ('Build'),
      ('Production'),
      ('Operations'),
      ('Experience'),
      ('Hospitality'),
      ('Technology')
  ) as v(canonical)
 where public.expenses.department is null
   and public.expenses.category is not null
   and lower(public.expenses.category) = lower(v.canonical);

-- Indexes that the actuals rollup trigger (0072) will use ------------------

create index if not exists expenses_org_project_dept_idx
  on public.expenses (org_id, project_id, department);
create index if not exists expenses_org_project_phase_idx
  on public.expenses (org_id, project_id, xpms_phase);
create index if not exists expenses_status_idx on public.expenses (status);

comment on column public.expenses.department is
  'XPMS class label — joins to budgets.department for the actuals rollup. Backfilled from category in 0071.';
comment on column public.expenses.xpms_phase is
  'XPMS 8-Gate Lifecycle phase for the expense.';
