DO $migrate$ BEGIN
  -- Enable RLS on the PostGIS spatial_ref_sys table.
--
-- ⚠️ Cannot be applied via MCP / supabase migrate — the table is owned
-- by `postgres` and modifying its policies requires the supabase_admin
-- role. Run via Dashboard → SQL Editor; runbook entry in
-- docs/runbooks/seaworthy-ops.md (section 4).
--
-- spatial_ref_sys is a static reference table (EPSG projection codes +
-- WKT definitions) — there's no tenant data in it and PostGIS expects
-- it to be world-readable at the SQL level. The advisor flags it as an
-- ERROR because RLS is off, but the proper remediation per Supabase's
-- own guidance is to enable RLS and add a permissive read policy.

alter table public.spatial_ref_sys enable row level security;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;

DO $migrate$ BEGIN
  drop policy if exists spatial_ref_sys_public_read on public.spatial_ref_sys;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy spatial_ref_sys_public_read on public.spatial_ref_sys
  for select to public
  using (true);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;

DO $migrate$ BEGIN
  comment on policy spatial_ref_sys_public_read on public.spatial_ref_sys is
  'PostGIS reference table — EPSG projection codes are public knowledge. '
  'RLS-on with permissive read clears the rls_disabled_in_public advisor '
  'ERROR while preserving the world-readable contract PostGIS expects.';
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
