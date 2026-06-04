-- ============================================================================
-- 0076 — P4 hardening: deprecate legacy budget/expense columns + LDP rename
-- ============================================================================
--
-- Phase 1 of a 3-migration legacy-column removal cycle:
--   Phase 1 (this) — formal deprecation markers via COMMENT; LDP rename
--                    expenses.status → expenses.receipt_state with a sync
--                    trigger so both columns track each other.
--   Phase 2 (future) — flip every code reader to the canonical column;
--                      add NOT NULL DEFAULT NULL on the legacy column.
--   Phase 3 (future) — drop the legacy columns.
--
-- See docs/HARDENING_AUDIT.md §H "Schema hygiene".
-- ============================================================================

comment on column public.budgets.category is
  'DEPRECATED (P4) — replaced by budgets.department (XPMS enum). Migration 0070+ uses department; this column survives for legacy read compatibility only.';
comment on column public.budgets.spent_cents is
  'DEPRECATED (P4) — replaced by budgets.actual_cents (auto-computed by expenses trigger). Kept in sync by migration 0073 trigger function.';
comment on column public.budgets.xtc_code is
  'DEPRECATED (P4) — pre-XPMS classification code. No replacement; rows with xtc_code should be re-tagged with department/discipline/xpms_phase.';
comment on column public.budgets.code is
  'DEPRECATED (P4) — replaced by the budgets.id UUID. Custom codes survive on existing rows; new rows should leave NULL.';
comment on column public.budgets.notes is
  'DEPRECATED (P4) — split into budgets.external_notes (client-visible) and budgets.internal_notes (org-only) by migration 0070.';

comment on column public.expenses.category is
  'DEPRECATED (P4) — replaced by expenses.department (XPMS enum) plus discipline/xpms_phase. Migration 0071 backfilled department from category where it matched a canonical XPMS class.';
comment on column public.expenses.xtc_code is
  'DEPRECATED (P4) — pre-XPMS classification code. No replacement.';

-- LDP §NAMING DISCIPLINE rename: expenses.status → expenses.receipt_state.
alter table public.expenses
  add column if not exists receipt_state public.expense_status;

update public.expenses
   set receipt_state = status
 where receipt_state is null;

create or replace function private.expenses_sync_receipt_state()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.receipt_state is null and new.status is not null then
      new.receipt_state := new.status;
    elsif new.status is null and new.receipt_state is not null then
      new.status := new.receipt_state;
    end if;
  elsif tg_op = 'UPDATE' then
    if new.receipt_state is distinct from old.receipt_state then
      new.status := new.receipt_state;
    elsif new.status is distinct from old.status then
      new.receipt_state := new.status;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists tg_expenses_sync_receipt_state on public.expenses;
create trigger tg_expenses_sync_receipt_state
  before insert or update of status, receipt_state on public.expenses
  for each row execute function private.expenses_sync_receipt_state();

comment on column public.expenses.receipt_state is
  'LDP §NAMING DISCIPLINE — canonical post-rename column. Kept in sync with the legacy `status` column by tg_expenses_sync_receipt_state until phase 3 drops `status`.';
comment on column public.expenses.status is
  'DEPRECATED (P4) — replaced by receipt_state per LDP §NAMING DISCIPLINE (`status` banned in new tables). Kept in sync by trigger; new code should read receipt_state.';
