-- M3: drop the legacy free-text `category` columns superseded by category_code
-- (vendors) / XPMS department+discipline (budgets, expenses). App fully migrated off.
-- APPLIED 2026-07-18 (ledger 20260718163937). expenses.category was referenced by the
-- GDPR self-export view gdpr_user_expenses (security_invoker) → dropped, column dropped,
-- view recreated without category. service_requests.category intentionally retained.
drop view public.gdpr_user_expenses;
alter table public.certifications   drop column category;
alter table public.onboarding_steps drop column category;
alter table public.expenses         drop column category;
alter table public.budgets          drop column category;
alter table public.vendors          drop column category;
create view public.gdpr_user_expenses with (security_invoker=true) as
 select id, org_id, project_id, submitter_id, description, amount_cents, currency,
        expense_state as status, receipt_path, spent_at, created_at, updated_at, xtc_code, atom_id
   from expenses
  where submitter_id = (select auth.uid());
