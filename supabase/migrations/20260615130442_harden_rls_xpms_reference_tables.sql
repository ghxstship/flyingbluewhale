-- Enterprise hardening: enable RLS on the XPMS reference/dimension tables that
-- were public-without-RLS (rls_disabled_in_public advisor ERRORs). These hold
-- global non-org reference data (priced atoms, metrics, permits, package
-- bridges) read by SECURITY DEFINER functions (resolve_atom / explode_package)
-- which bypass RLS, so enabling RLS does not affect that path. Direct reads are
-- console (authenticated) only — granted read-only here. Writes are restricted
-- to migrations (postgres bypasses RLS). Staging is internal ETL: RLS on, no
-- policy (deny all direct access).

alter table public.xpms_catalog enable row level security;
alter table public.dim_metric enable row level security;
alter table public.dim_permit enable row level security;
alter table public.bridge_package_atom enable row level security;
alter table public.bridge_atom_metric enable row level security;
alter table public.bridge_atom_permit enable row level security;
alter table public.xpms_catalog_staging enable row level security;

do $$ begin
  create policy xpms_catalog_read on public.xpms_catalog for select to authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy dim_metric_read on public.dim_metric for select to authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy dim_permit_read on public.dim_permit for select to authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy bridge_package_atom_read on public.bridge_package_atom for select to authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy bridge_atom_metric_read on public.bridge_atom_metric for select to authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy bridge_atom_permit_read on public.bridge_atom_permit for select to authenticated using (true);
exception when duplicate_object then null; end $$;
-- xpms_catalog_staging: intentionally no policy (RLS-enabled deny-all for direct access).
