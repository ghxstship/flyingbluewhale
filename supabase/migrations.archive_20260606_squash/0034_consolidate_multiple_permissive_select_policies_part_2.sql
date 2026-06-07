DO $migrate$ BEGIN
  -- Part 2 of multiple-permissive-policy consolidation. Same pattern as part 1:
-- replace each FOR ALL admin/write policy with three explicit FOR <cmd>
-- policies (INSERT, UPDATE, DELETE) so the SELECT side stops duplicating
-- the wider read policy.

-- ───────── agencies ─────────
drop policy if exists agencies_org_rw on public.agencies;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy agencies_org_insert on public.agencies for insert with check (private.is_org_member(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy agencies_org_update on public.agencies for update using (private.is_org_member(org_id)) with check (private.is_org_member(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy agencies_org_delete on public.agencies for delete using (private.is_org_member(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;

DO $migrate$ BEGIN
  -- ───────── availability_slots ─────────
drop policy if exists availability_slots_self_rw on public.availability_slots;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy availability_slots_self_insert on public.availability_slots for insert with check (user_id = (select auth.uid()));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy availability_slots_self_update on public.availability_slots for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy availability_slots_self_delete on public.availability_slots for delete using (user_id = (select auth.uid()));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;

DO $migrate$ BEGIN
  -- ───────── config_values ─────────
drop policy if exists ucf_values_write on public.config_values;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy ucf_values_write_insert on public.config_values for insert with check (((scope = 'org') and private.is_org_admin(scope_id)) or ((scope = 'project') and private.has_project_role(scope_id, array['owner','admin'])) or ((scope = 'user') and (scope_id = (select auth.uid()))));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy ucf_values_write_update on public.config_values for update using (((scope = 'org') and private.is_org_admin(scope_id)) or ((scope = 'project') and private.has_project_role(scope_id, array['owner','admin'])) or ((scope = 'user') and (scope_id = (select auth.uid())))) with check (((scope = 'org') and private.is_org_admin(scope_id)) or ((scope = 'project') and private.has_project_role(scope_id, array['owner','admin'])) or ((scope = 'user') and (scope_id = (select auth.uid()))));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy ucf_values_write_delete on public.config_values for delete using (((scope = 'org') and private.is_org_admin(scope_id)) or ((scope = 'project') and private.has_project_role(scope_id, array['owner','admin'])) or ((scope = 'user') and (scope_id = (select auth.uid()))));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;

DO $migrate$ BEGIN
  -- ───────── contracts ─────────
drop policy if exists uct_write on public.contracts;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy uct_write_insert on public.contracts for insert with check (private.has_org_role(org_id, array['owner','admin','manager']));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy uct_write_update on public.contracts for update using (private.has_org_role(org_id, array['owner','admin','manager'])) with check (private.has_org_role(org_id, array['owner','admin','manager']));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy uct_write_delete on public.contracts for delete using (private.has_org_role(org_id, array['owner','admin','manager']));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;

DO $migrate$ BEGIN
  -- ───────── event_milestones ─────────
drop policy if exists event_milestones_org_rw on public.event_milestones;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy event_milestones_org_insert on public.event_milestones for insert with check (private.is_org_member(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy event_milestones_org_update on public.event_milestones for update using (private.is_org_member(org_id)) with check (private.is_org_member(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy event_milestones_org_delete on public.event_milestones for delete using (private.is_org_member(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;

DO $migrate$ BEGIN
  -- ───────── form_definitions ─────────
drop policy if exists ufs_def_admin on public.form_definitions;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy ufs_def_admin_insert on public.form_definitions for insert with check (org_id is not null and private.is_org_admin(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy ufs_def_admin_update on public.form_definitions for update using (org_id is not null and private.is_org_admin(org_id)) with check (org_id is not null and private.is_org_admin(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy ufs_def_admin_delete on public.form_definitions for delete using (org_id is not null and private.is_org_admin(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;

DO $migrate$ BEGIN
  -- ───────── geofences ─────────
drop policy if exists ugs_fences_admin on public.geofences;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy ugs_fences_admin_insert on public.geofences for insert with check (private.has_org_role(org_id, array['owner','admin','manager']));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy ugs_fences_admin_update on public.geofences for update using (private.has_org_role(org_id, array['owner','admin','manager'])) with check (private.has_org_role(org_id, array['owner','admin','manager']));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy ugs_fences_admin_delete on public.geofences for delete using (private.has_org_role(org_id, array['owner','admin','manager']));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;

DO $migrate$ BEGIN
  -- ───────── id_sequences (FOR ALL admin + 2 duplicate SELECT reads) ─────────
drop policy if exists org_sequences_admin_write on public.id_sequences;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  drop policy if exists ung_sequences_read on public.id_sequences;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;  DO $migrate$ BEGIN
  -- duplicate of org_sequences_select; org_sequences_select stays
create policy org_sequences_admin_insert on public.id_sequences for insert with check (private.has_org_role(org_id, array['owner','admin','manager']));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy org_sequences_admin_update on public.id_sequences for update using (private.has_org_role(org_id, array['owner','admin','manager'])) with check (private.has_org_role(org_id, array['owner','admin','manager']));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy org_sequences_admin_delete on public.id_sequences for delete using (private.has_org_role(org_id, array['owner','admin','manager']));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;

DO $migrate$ BEGIN
  -- ───────── job_postings ─────────
drop policy if exists job_postings_org_rw on public.job_postings;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy job_postings_org_insert on public.job_postings for insert with check (private.is_org_member(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy job_postings_org_update on public.job_postings for update using (private.is_org_member(org_id)) with check (private.is_org_member(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy job_postings_org_delete on public.job_postings for delete using (private.is_org_member(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;

DO $migrate$ BEGIN
  -- ───────── knowledge_collections ─────────
drop policy if exists ukb_kc_admin on public.knowledge_collections;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy ukb_kc_admin_insert on public.knowledge_collections for insert with check (org_id is not null and private.is_org_admin(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy ukb_kc_admin_update on public.knowledge_collections for update using (org_id is not null and private.is_org_admin(org_id)) with check (org_id is not null and private.is_org_admin(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy ukb_kc_admin_delete on public.knowledge_collections for delete using (org_id is not null and private.is_org_admin(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;

DO $migrate$ BEGIN
  -- ───────── notification_templates ─────────
drop policy if exists uns_templates_admin on public.notification_templates;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy uns_templates_admin_insert on public.notification_templates for insert with check (org_id is not null and private.is_org_admin(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy uns_templates_admin_update on public.notification_templates for update using (org_id is not null and private.is_org_admin(org_id)) with check (org_id is not null and private.is_org_admin(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy uns_templates_admin_delete on public.notification_templates for delete using (org_id is not null and private.is_org_admin(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;

DO $migrate$ BEGIN
  -- ───────── open_calls ─────────
drop policy if exists open_calls_org_rw on public.open_calls;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy open_calls_org_insert on public.open_calls for insert with check (private.is_org_member(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy open_calls_org_update on public.open_calls for update using (private.is_org_member(org_id)) with check (private.is_org_member(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy open_calls_org_delete on public.open_calls for delete using (private.is_org_member(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;

DO $migrate$ BEGIN
  -- ───────── places ─────────
drop policy if exists ugs_places_write on public.places;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy ugs_places_write_insert on public.places for insert with check (private.is_org_member(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy ugs_places_write_update on public.places for update using (private.is_org_member(org_id)) with check (private.is_org_member(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy ugs_places_write_delete on public.places for delete using (private.is_org_member(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;

DO $migrate$ BEGIN
  -- ───────── project_templates ─────────
drop policy if exists tpl_admin_write on public.project_templates;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy tpl_admin_insert on public.project_templates for insert with check (org_id is not null and private.has_org_role(org_id, array['owner','admin','manager']));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy tpl_admin_update on public.project_templates for update using (org_id is not null and private.has_org_role(org_id, array['owner','admin','manager'])) with check (org_id is not null and private.has_org_role(org_id, array['owner','admin','manager']));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy tpl_admin_delete on public.project_templates for delete using (org_id is not null and private.has_org_role(org_id, array['owner','admin','manager']));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;

DO $migrate$ BEGIN
  -- ───────── record_grants ─────────
drop policy if exists record_grants_admin_write on public.record_grants;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy record_grants_admin_insert on public.record_grants for insert with check (private.has_org_role(org_id, array['owner','admin','manager']));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy record_grants_admin_update on public.record_grants for update using (private.has_org_role(org_id, array['owner','admin','manager'])) with check (private.has_org_role(org_id, array['owner','admin','manager']));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy record_grants_admin_delete on public.record_grants for delete using (private.has_org_role(org_id, array['owner','admin','manager']));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;

DO $migrate$ BEGIN
  -- ───────── regulatory_filing_records ─────────
drop policy if exists utr_filing_admin on public.regulatory_filing_records;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy utr_filing_admin_insert on public.regulatory_filing_records for insert with check (private.is_org_admin(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy utr_filing_admin_update on public.regulatory_filing_records for update using (private.is_org_admin(org_id)) with check (private.is_org_admin(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy utr_filing_admin_delete on public.regulatory_filing_records for delete using (private.is_org_admin(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;

DO $migrate$ BEGIN
  -- ───────── report_definitions ─────────
drop policy if exists urp_def_admin on public.report_definitions;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy urp_def_admin_insert on public.report_definitions for insert with check (org_id is not null and private.is_org_admin(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy urp_def_admin_update on public.report_definitions for update using (org_id is not null and private.is_org_admin(org_id)) with check (org_id is not null and private.is_org_admin(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy urp_def_admin_delete on public.report_definitions for delete using (org_id is not null and private.is_org_admin(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;

DO $migrate$ BEGIN
  -- ───────── role_permissions ─────────
drop policy if exists upr_rp_admin on public.role_permissions;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy upr_rp_admin_insert on public.role_permissions for insert with check (exists (select 1 from public.org_roles r where r.id = role_permissions.role_id and private.is_org_admin(r.org_id)));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy upr_rp_admin_update on public.role_permissions for update using (exists (select 1 from public.org_roles r where r.id = role_permissions.role_id and private.is_org_admin(r.org_id))) with check (exists (select 1 from public.org_roles r where r.id = role_permissions.role_id and private.is_org_admin(r.org_id)));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy upr_rp_admin_delete on public.role_permissions for delete using (exists (select 1 from public.org_roles r where r.id = role_permissions.role_id and private.is_org_admin(r.org_id)));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;

DO $migrate$ BEGIN
  -- ───────── subscriptions ─────────
drop policy if exists subscriptions_write_admin on public.subscriptions;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy subscriptions_admin_insert on public.subscriptions for insert with check (private.has_org_role(org_id, array['owner','admin','controller']));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy subscriptions_admin_update on public.subscriptions for update using (private.has_org_role(org_id, array['owner','admin','controller'])) with check (private.has_org_role(org_id, array['owner','admin','controller']));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy subscriptions_admin_delete on public.subscriptions for delete using (private.has_org_role(org_id, array['owner','admin','controller']));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;

DO $migrate$ BEGIN
  -- ───────── tag_assignments ─────────
drop policy if exists uts_ta_write on public.tag_assignments;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy uts_ta_write_insert on public.tag_assignments for insert with check (private.is_org_member(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy uts_ta_write_update on public.tag_assignments for update using (private.is_org_member(org_id)) with check (private.is_org_member(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy uts_ta_write_delete on public.tag_assignments for delete using (private.is_org_member(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;

DO $migrate$ BEGIN
  -- ───────── tag_namespaces ─────────
drop policy if exists uts_ns_admin on public.tag_namespaces;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy uts_ns_admin_insert on public.tag_namespaces for insert with check (org_id is not null and private.is_org_admin(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy uts_ns_admin_update on public.tag_namespaces for update using (org_id is not null and private.is_org_admin(org_id)) with check (org_id is not null and private.is_org_admin(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy uts_ns_admin_delete on public.tag_namespaces for delete using (org_id is not null and private.is_org_admin(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;

DO $migrate$ BEGIN
  -- ───────── talent_offers ─────────
drop policy if exists talent_offers_org_rw on public.talent_offers;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy talent_offers_org_insert on public.talent_offers for insert with check (private.is_org_member(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy talent_offers_org_update on public.talent_offers for update using (private.is_org_member(org_id)) with check (private.is_org_member(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy talent_offers_org_delete on public.talent_offers for delete using (private.is_org_member(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;

DO $migrate$ BEGIN
  -- ───────── team_members ─────────
drop policy if exists team_members_admin_write on public.team_members;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy team_members_admin_insert on public.team_members for insert with check ((team_id in (select t.id from public.teams t where private.has_org_role(t.org_id, array['owner','admin','manager']))) or (exists (select 1 from public.team_members tm where tm.team_id = team_members.team_id and tm.user_id = (select auth.uid()) and tm.role = 'admin')));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy team_members_admin_update on public.team_members for update using ((team_id in (select t.id from public.teams t where private.has_org_role(t.org_id, array['owner','admin','manager']))) or (exists (select 1 from public.team_members tm where tm.team_id = team_members.team_id and tm.user_id = (select auth.uid()) and tm.role = 'admin'))) with check ((team_id in (select t.id from public.teams t where private.has_org_role(t.org_id, array['owner','admin','manager']))) or (exists (select 1 from public.team_members tm where tm.team_id = team_members.team_id and tm.user_id = (select auth.uid()) and tm.role = 'admin')));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy team_members_admin_delete on public.team_members for delete using ((team_id in (select t.id from public.teams t where private.has_org_role(t.org_id, array['owner','admin','manager']))) or (exists (select 1 from public.team_members tm where tm.team_id = team_members.team_id and tm.user_id = (select auth.uid()) and tm.role = 'admin')));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;

DO $migrate$ BEGIN
  -- ───────── teams ─────────
drop policy if exists teams_admin_write on public.teams;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy teams_admin_insert on public.teams for insert with check (private.has_org_role(org_id, array['owner','admin','manager']));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy teams_admin_update on public.teams for update using (private.has_org_role(org_id, array['owner','admin','manager'])) with check (private.has_org_role(org_id, array['owner','admin','manager']));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy teams_admin_delete on public.teams for delete using (private.has_org_role(org_id, array['owner','admin','manager']));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;

DO $migrate$ BEGIN
  -- ───────── transactions ─────────
drop policy if exists utx_tx_write on public.transactions;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy utx_tx_write_insert on public.transactions for insert with check (private.has_org_role(org_id, array['owner','admin','manager']));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy utx_tx_write_update on public.transactions for update using (private.has_org_role(org_id, array['owner','admin','manager'])) with check (private.has_org_role(org_id, array['owner','admin','manager']));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy utx_tx_write_delete on public.transactions for delete using (private.has_org_role(org_id, array['owner','admin','manager']));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;

DO $migrate$ BEGIN
  -- ───────── uqm_incidents ─────────
drop policy if exists uqm_inc_write on public.uqm_incidents;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy uqm_inc_write_insert on public.uqm_incidents for insert with check (private.is_org_member(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy uqm_inc_write_update on public.uqm_incidents for update using (private.is_org_member(org_id)) with check (private.is_org_member(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy uqm_inc_write_delete on public.uqm_incidents for delete using (private.is_org_member(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;

DO $migrate$ BEGIN
  -- ───────── user_profiles ─────────
drop policy if exists user_profiles_self_rw on public.user_profiles;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy user_profiles_self_insert on public.user_profiles for insert with check (user_id = (select auth.uid()));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy user_profiles_self_update on public.user_profiles for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy user_profiles_self_delete on public.user_profiles for delete using (user_id = (select auth.uid()));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;

DO $migrate$ BEGIN
  -- ───────── wizard_definitions ─────────
drop policy if exists uwz_def_admin on public.wizard_definitions;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy uwz_def_admin_insert on public.wizard_definitions for insert with check (org_id is not null and private.is_org_admin(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy uwz_def_admin_update on public.wizard_definitions for update using (org_id is not null and private.is_org_admin(org_id)) with check (org_id is not null and private.is_org_admin(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy uwz_def_admin_delete on public.wizard_definitions for delete using (org_id is not null and private.is_org_admin(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
