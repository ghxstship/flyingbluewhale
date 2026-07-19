-- Remove the legacy category-bucketed budget-sync machinery orphaned by M3
-- (20260718163937_drop_legacy_category_columns), which dropped expenses.category
-- and budgets.category but left these three objects still referencing the gone column.
--
-- Prod impact before this fix: every expense INSERT/UPDATE/DELETE fired
-- `sync_budget_spent_on_expense` -> tg_sync_budget_spent_on_expense(), which reads
-- `new.category`, raising `record "new" has no field "category"` (SQLSTATE 42703) and
-- breaking expense creation at /studio/finance/expenses/new. Paying an invoice hit the
-- same break inside sync_budget_for_bucket (called with a null category by the invoice
-- trigger). All three objects are dead code: the category budget model is fully
-- superseded by the XPMS department rollup (private.expenses_rollup_actual ->
-- private.budgets_recompute_actual, still armed via tg_expenses_rollup_actual), which is
-- the SSOT for budgets.spent_cents / actual_cents.

drop trigger if exists sync_budget_spent_on_expense on public.expenses;
drop trigger if exists sync_budget_spent_on_invoice on public.invoices;
drop function if exists public.tg_sync_budget_spent_on_expense();
drop function if exists public.tg_sync_budget_spent_on_invoice();
drop function if exists public.sync_budget_for_bucket(uuid, uuid, text);
