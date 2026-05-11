DO $migrate$ BEGIN
  -- Consolidate multiple-permissive SELECT policies (advisor 0010).
--
-- Pattern across 33 tables:
--   - Policy A: FOR ALL  using admin_check  → permissive on SELECT too
--   - Policy B: FOR SELECT using org_member → also permissive on SELECT
--
-- Postgres evaluates RLS as the OR of all matching policies, so two SELECT
-- gates means every row is filtered through both — twice the function-call
-- overhead even though the wider one (org_member) already covers the
-- narrower one (admin). We split each FOR ALL admin policy into three
-- explicit FOR INSERT / UPDATE / DELETE policies and keep the SELECT
-- policy untouched.
--
-- Before: 2 SELECT-applicable policies. After: 1.
-- Function-call cost on SELECT halves; no behavior change because admins
-- are by definition org members and were already caught by the org_member
-- SELECT policy.
--
-- Part 1 covers the 5 simplest tables (drop FOR ALL, recreate as three
-- FOR <cmd> policies). Parts 2 + 3 cover the remaining 32 tables.

-- ───────── accounting_periods ─────────
drop policy if exists ulg_period_admin on public.accounting_periods;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy ulg_period_admin_insert on public.accounting_periods for insert with check (private.is_org_admin(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy ulg_period_admin_update on public.accounting_periods for update using (private.is_org_admin(org_id)) with check (private.is_org_admin(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy ulg_period_admin_delete on public.accounting_periods for delete using (private.is_org_admin(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;

DO $migrate$ BEGIN
  -- ───────── addresses ─────────
drop policy if exists ugs_addr_write on public.addresses;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy ugs_addr_write_insert on public.addresses for insert with check (org_id is not null and private.is_org_member(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy ugs_addr_write_update on public.addresses for update using (org_id is not null and private.is_org_member(org_id)) with check (org_id is not null and private.is_org_member(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy ugs_addr_write_delete on public.addresses for delete using (org_id is not null and private.is_org_member(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;

DO $migrate$ BEGIN
  -- ───────── ai_agents ─────────
drop policy if exists ai_agents_admin_write on public.ai_agents;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy ai_agents_admin_insert on public.ai_agents for insert with check (private.has_org_role(org_id, array['owner','admin']));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy ai_agents_admin_update on public.ai_agents for update using (private.has_org_role(org_id, array['owner','admin'])) with check (private.has_org_role(org_id, array['owner','admin']));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy ai_agents_admin_delete on public.ai_agents for delete using (private.has_org_role(org_id, array['owner','admin']));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;

DO $migrate$ BEGIN
  -- ───────── automation_subscriptions ─────────
drop policy if exists subs_admin_write on public.automation_subscriptions;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy subs_admin_insert on public.automation_subscriptions for insert with check (private.has_org_role(org_id, array['owner','admin','manager']));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy subs_admin_update on public.automation_subscriptions for update using (private.has_org_role(org_id, array['owner','admin','manager'])) with check (private.has_org_role(org_id, array['owner','admin','manager']));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy subs_admin_delete on public.automation_subscriptions for delete using (private.has_org_role(org_id, array['owner','admin','manager']));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;

DO $migrate$ BEGIN
  -- ───────── chart_of_accounts ─────────
drop policy if exists ulg_coa_admin on public.chart_of_accounts;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy ulg_coa_admin_insert on public.chart_of_accounts for insert with check (private.is_org_admin(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy ulg_coa_admin_update on public.chart_of_accounts for update using (private.is_org_admin(org_id)) with check (private.is_org_admin(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy ulg_coa_admin_delete on public.chart_of_accounts for delete using (private.is_org_admin(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
