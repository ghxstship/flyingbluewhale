-- Org-level payment-terms template defaults (plumb-line DUP-1/DUP-6).
-- Nullable: NULL means "use the system default", resolved app-side via
-- src/lib/payment-terms.ts (resolveDepositPct / resolveBalanceTerms). This is
-- the "template" layer between the per-instance value (e.g.
-- proposals.deposit_percent) and the hardcoded system default.
alter table public.orgs
  add column if not exists default_deposit_pct smallint,
  add column if not exists default_balance_terms text;

alter table public.orgs
  add constraint orgs_default_deposit_pct_check
    check (default_deposit_pct is null or (default_deposit_pct >= 0 and default_deposit_pct <= 100));

alter table public.orgs
  add constraint orgs_default_balance_terms_check
    check (default_balance_terms is null or char_length(default_balance_terms) <= 64);

comment on column public.orgs.default_deposit_pct is 'Org-wide template default deposit %. NULL falls back to the system default in payment-terms.ts.';
comment on column public.orgs.default_balance_terms is 'Org-wide template default balance-terms code (e.g. load_in). NULL falls back to the system default.';
