-- D1-class (authorization) SWEEP: app-vs-RLS role-band inversion across the
-- whole public schema. Companion to the per-table fixes already shipped:
--   · 20260612180000_proposal_rls_manager_grant.sql      (proposals/projects/share-links)
--   · 20260613182535_convert_seed_rls_manager_grant.sql  (invoices/budgets/deliverables)
--   · 20260625120000_tasks_rls_manager_grant.sql         (tasks)
--
-- The defect class
-- ----------------
-- RLS write policies (INSERT / UPDATE / ALL) gate via
-- private.has_org_role(org_id, required[]), which matches
--   role::text = ANY(required) OR persona = ANY(required).
-- The canonical OPERATOR-WRITE band is
--   ['owner','admin','manager','controller','collaborator'].
-- `manager` (isManagerPlus in src/lib/auth.ts) is a STRICT superset of the
-- `collaborator` co-producer authority (projects/tasks/crew + finance), and
-- sits above the `controller` finance role for write purposes. A band that
-- admits `collaborator` (a LOWER operator band) and/or `controller` while
-- OMITTING `manager` is an INVERSION: a real role=manager operator whom the
-- app already authorized is rejected at the DB with
--   "new row violates row-level security policy".
-- Masked in the demo org because seeded memberships carry persona='owner'
-- (matched via the persona branch); surfaces for non-owner-persona managers.
--
-- The audit
-- ---------
-- pg_policies was swept for every public INSERT/UPDATE/ALL policy whose
-- has_org_role band contains 'collaborator' OR 'controller' but NOT 'manager'.
-- Deliberately-narrow ['owner','admin'] bands (settings/billing/delete-only)
-- were EXCLUDED — they intentionally exclude manager AND collaborator, so
-- they are not inversions. 212 offending policies across 124 tables were
-- found (97 INSERT, 97 UPDATE, 18 ALL).
--
-- The fix
-- -------
-- Each offending policy is recreated VERBATIM except that 'manager'::text is
-- inserted into its has_org_role band immediately after 'admin'::text (the
-- canonical band order owner, admin, manager, controller, collaborator, ...).
-- Every surrounding predicate is preserved exactly: USING vs WITH CHECK
-- asymmetry (e.g. insurance_policies_rw / trademarks_rw keep is_org_member in
-- USING), OR-chains (dsar_requests_insert_consolidated), EXISTS-subquery
-- wrappers (the *_assignment_details_iud policies gate on a.org_id), the
-- {public}/{authenticated} grantee, and the permissive flag. Bands that admit
-- additional lower roles (crew/contractor) keep them.
--
-- DELETE policies and SELECT policies were NOT touched — the defect class is
-- specifically operator WRITE. DELETE bands are intentionally narrower by
-- design (no manager hard-delete path).
--
-- Generated from a pg_policies introspection sweep; guarded against
-- regression by src/lib/proposal-rls-manager-canon.test.ts.

begin;

drop policy if exists accounting_period_state_transitions_insert_controller on public.accounting_period_state_transitions;
create policy accounting_period_state_transitions_insert_controller on public.accounting_period_state_transitions
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists accreditation_categories_rw__insert on public.accreditation_categories;
create policy accreditation_categories_rw__insert on public.accreditation_categories
  as permissive
  for insert
  to authenticated
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists accreditation_categories_rw__update on public.accreditation_categories;
create policy accreditation_categories_rw__update on public.accreditation_categories
  as permissive
  for update
  to authenticated
  using (private.is_org_member(org_id))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists accreditation_changes_write__insert on public.accreditation_changes;
create policy accreditation_changes_write__insert on public.accreditation_changes
  as permissive
  for insert
  to authenticated
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists accreditation_changes_write__update on public.accreditation_changes;
create policy accreditation_changes_write__update on public.accreditation_changes
  as permissive
  for update
  to authenticated
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists accreditations_admin__insert on public.accreditations;
create policy accreditations_admin__insert on public.accreditations
  as permissive
  for insert
  to authenticated
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists accreditations_admin__update on public.accreditations;
create policy accreditations_admin__update on public.accreditations
  as permissive
  for update
  to authenticated
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists assessment_questions_write on public.assessment_questions;
create policy assessment_questions_write on public.assessment_questions
  as permissive
  for all
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists assessments_write on public.assessments;
create policy assessments_write on public.assessments
  as permissive
  for all
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists assignment_events_insert on public.assignment_events;
create policy assignment_events_insert on public.assignment_events
  as permissive
  for insert
  to authenticated
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]));

drop policy if exists assignment_external_holders_insert on public.assignment_external_holders;
create policy assignment_external_holders_insert on public.assignment_external_holders
  as permissive
  for insert
  to authenticated
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists assignment_external_holders_update on public.assignment_external_holders;
create policy assignment_external_holders_update on public.assignment_external_holders
  as permissive
  for update
  to authenticated
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists assignment_scan_codes_insert on public.assignment_scan_codes;
create policy assignment_scan_codes_insert on public.assignment_scan_codes
  as permissive
  for insert
  to authenticated
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists assignment_scan_codes_update on public.assignment_scan_codes;
create policy assignment_scan_codes_update on public.assignment_scan_codes
  as permissive
  for update
  to authenticated
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]));

drop policy if exists assignments_insert on public.assignments;
create policy assignments_insert on public.assignments
  as permissive
  for insert
  to authenticated
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists assignments_update on public.assignments;
create policy assignments_update on public.assignments
  as permissive
  for update
  to authenticated
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists automations_org_modify__insert on public.automations;
create policy automations_org_modify__insert on public.automations
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists automations_org_modify__update on public.automations;
create policy automations_org_modify__update on public.automations
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists campaigns_insert on public.campaigns;
create policy campaigns_insert on public.campaigns
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists campaigns_update on public.campaigns;
create policy campaigns_update on public.campaigns
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists case_studies_admin__insert on public.case_studies;
create policy case_studies_admin__insert on public.case_studies
  as permissive
  for insert
  to authenticated
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists case_studies_admin__update on public.case_studies;
create policy case_studies_admin__update on public.case_studies
  as permissive
  for update
  to authenticated
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists certification_holders_write on public.certification_holders;
create policy certification_holders_write on public.certification_holders
  as permissive
  for all
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists certification_holders_insert on public.certification_holders;
create policy certification_holders_insert on public.certification_holders
  as permissive
  for insert
  to public
  with check ((private.is_org_member(org_id) AND ((user_id = ( SELECT auth.uid() AS uid)) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]))));

drop policy if exists certification_recerts_write on public.certification_recerts;
create policy certification_recerts_write on public.certification_recerts
  as permissive
  for all
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists clients_insert on public.clients;
create policy clients_insert on public.clients
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists clients_update on public.clients;
create policy clients_update on public.clients
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists conversations_update on public.conversations;
create policy conversations_update on public.conversations
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists cost_codes_write__insert on public.cost_codes;
create policy cost_codes_write__insert on public.cost_codes
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists cost_codes_write__update on public.cost_codes;
create policy cost_codes_write__update on public.cost_codes
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists course_enrollments_update on public.course_enrollments;
create policy course_enrollments_update on public.course_enrollments
  as permissive
  for update
  to public
  using (((user_id = ( SELECT auth.uid() AS uid)) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text])))
  with check (((user_id = ( SELECT auth.uid() AS uid)) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text])));

drop policy if exists course_modules_write on public.course_modules;
create policy course_modules_write on public.course_modules
  as permissive
  for all
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists credential_assignment_details_iud on public.credential_assignment_details;
create policy credential_assignment_details_iud on public.credential_assignment_details
  as permissive
  for all
  to authenticated
  using ((EXISTS ( SELECT 1
   FROM assignments a
  WHERE ((a.id = credential_assignment_details.assignment_id) AND private.has_org_role(a.org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text])))))
  with check ((EXISTS ( SELECT 1
   FROM assignments a
  WHERE ((a.id = credential_assignment_details.assignment_id) AND private.has_org_role(a.org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text])))));

drop policy if exists credentials_insert on public.credentials;
create policy credentials_insert on public.credentials
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists credentials_update on public.credentials;
create policy credentials_update on public.credentials
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists crew_members_insert on public.crew_members;
create policy crew_members_insert on public.crew_members
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists crew_members_update on public.crew_members;
create policy crew_members_update on public.crew_members
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists crisis_alerts_admin__insert on public.crisis_alerts;
create policy crisis_alerts_admin__insert on public.crisis_alerts
  as permissive
  for insert
  to authenticated
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists crisis_alerts_admin__update on public.crisis_alerts;
create policy crisis_alerts_admin__update on public.crisis_alerts
  as permissive
  for update
  to authenticated
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists cues_org_modify__insert on public.cues;
create policy cues_org_modify__insert on public.cues
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]));

drop policy if exists cues_org_modify__update on public.cues;
create policy cues_org_modify__update on public.cues
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]));

drop policy if exists dl_deliveries_write__insert on public.daily_log_deliveries;
create policy dl_deliveries_write__insert on public.daily_log_deliveries
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]));

drop policy if exists dl_deliveries_write__update on public.daily_log_deliveries;
create policy dl_deliveries_write__update on public.daily_log_deliveries
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]));

drop policy if exists dl_equipment_write__insert on public.daily_log_equipment;
create policy dl_equipment_write__insert on public.daily_log_equipment
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]));

drop policy if exists dl_equipment_write__update on public.daily_log_equipment;
create policy dl_equipment_write__update on public.daily_log_equipment
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]));

drop policy if exists dl_manpower_write__insert on public.daily_log_manpower;
create policy dl_manpower_write__insert on public.daily_log_manpower
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]));

drop policy if exists dl_manpower_write__update on public.daily_log_manpower;
create policy dl_manpower_write__update on public.daily_log_manpower
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]));

drop policy if exists dl_photos_write__insert on public.daily_log_photos;
create policy dl_photos_write__insert on public.daily_log_photos
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]));

drop policy if exists dl_photos_write__update on public.daily_log_photos;
create policy dl_photos_write__update on public.daily_log_photos
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]));

drop policy if exists dl_visitors_write__insert on public.daily_log_visitors;
create policy dl_visitors_write__insert on public.daily_log_visitors
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]));

drop policy if exists dl_visitors_write__update on public.daily_log_visitors;
create policy dl_visitors_write__update on public.daily_log_visitors
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]));

drop policy if exists daily_logs_insert on public.daily_logs;
create policy daily_logs_insert on public.daily_logs
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]));

drop policy if exists daily_logs_update on public.daily_logs;
create policy daily_logs_update on public.daily_logs
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]));

drop policy if exists delegations_admin__insert on public.delegations;
create policy delegations_admin__insert on public.delegations
  as permissive
  for insert
  to authenticated
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists delegations_admin__update on public.delegations;
create policy delegations_admin__update on public.delegations
  as permissive
  for update
  to authenticated
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists deliverable_state_transitions_insert_collab on public.deliverable_state_transitions;
create policy deliverable_state_transitions_insert_collab on public.deliverable_state_transitions
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists deliverable_templates_insert on public.deliverable_templates;
create policy deliverable_templates_insert on public.deliverable_templates
  as permissive
  for insert
  to authenticated
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists deliverable_templates_update on public.deliverable_templates;
create policy deliverable_templates_update on public.deliverable_templates
  as permissive
  for update
  to authenticated
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists dispatch_runs_admin__insert on public.dispatch_runs;
create policy dispatch_runs_admin__insert on public.dispatch_runs
  as permissive
  for insert
  to authenticated
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists dispatch_runs_admin__update on public.dispatch_runs;
create policy dispatch_runs_admin__update on public.dispatch_runs
  as permissive
  for update
  to authenticated
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists document_state_transitions_insert_collab on public.document_state_transitions;
create policy document_state_transitions_insert_collab on public.document_state_transitions
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists dsar_requests_insert_consolidated on public.dsar_requests;
create policy dsar_requests_insert_consolidated on public.dsar_requests
  as permissive
  for insert
  to authenticated
  with check ((private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]) OR (private.is_org_member(org_id) OR (requester_user_id = ( SELECT auth.uid() AS uid)) OR (lower(requester_email) = lower(COALESCE((( SELECT auth.jwt() AS jwt) ->> 'email'::text), ''::text))))));

drop policy if exists dsar_requests_admin__update on public.dsar_requests;
create policy dsar_requests_admin__update on public.dsar_requests
  as permissive
  for update
  to authenticated
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists equipment_insert on public.equipment;
create policy equipment_insert on public.equipment
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists equipment_update on public.equipment;
create policy equipment_update on public.equipment
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists event_guides_insert on public.event_guides;
create policy event_guides_insert on public.event_guides
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists event_guides_update on public.event_guides;
create policy event_guides_update on public.event_guides
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists events_insert on public.events;
create policy events_insert on public.events
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists events_update on public.events;
create policy events_update on public.events
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists expenses_insert on public.expenses;
create policy expenses_insert on public.expenses
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists expenses_update on public.expenses;
create policy expenses_update on public.expenses
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists fabrication_orders_insert on public.fabrication_orders;
create policy fabrication_orders_insert on public.fabrication_orders
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists fabrication_orders_update on public.fabrication_orders;
create policy fabrication_orders_update on public.fabrication_orders
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists form_defs_org_modify__insert on public.form_defs;
create policy form_defs_org_modify__insert on public.form_defs
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists form_defs_org_modify__update on public.form_defs;
create policy form_defs_org_modify__update on public.form_defs
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists guard_tours_insert on public.guard_tours;
create policy guard_tours_insert on public.guard_tours
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists guard_tours_update on public.guard_tours;
create policy guard_tours_update on public.guard_tours
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists incidents_update on public.incidents;
create policy incidents_update on public.incidents
  as permissive
  for update
  to authenticated
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists insp_items_write__insert on public.inspection_items;
create policy insp_items_write__insert on public.inspection_items
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]));

drop policy if exists insp_items_write__update on public.inspection_items;
create policy insp_items_write__update on public.inspection_items
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]));

drop policy if exists insp_tpl_items_write__insert on public.inspection_template_items;
create policy insp_tpl_items_write__insert on public.inspection_template_items
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists insp_tpl_items_write__update on public.inspection_template_items;
create policy insp_tpl_items_write__update on public.inspection_template_items
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists insp_tpl_insert on public.inspection_templates;
create policy insp_tpl_insert on public.inspection_templates
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists insp_tpl_update on public.inspection_templates;
create policy insp_tpl_update on public.inspection_templates
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists inspections_insert on public.inspections;
create policy inspections_insert on public.inspections
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]));

drop policy if exists inspections_update on public.inspections;
create policy inspections_update on public.inspections
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]));

drop policy if exists insurance_policies_rw on public.insurance_policies;
create policy insurance_policies_rw on public.insurance_policies
  as permissive
  for all
  to authenticated
  using (private.is_org_member(org_id))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists invoice_line_items_modify__insert on public.invoice_line_items;
create policy invoice_line_items_modify__insert on public.invoice_line_items
  as permissive
  for insert
  to public
  with check ((EXISTS ( SELECT 1
   FROM invoices i
  WHERE ((i.id = invoice_line_items.invoice_id) AND private.has_org_role(i.org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text])))));

drop policy if exists invoice_line_items_modify__update on public.invoice_line_items;
create policy invoice_line_items_modify__update on public.invoice_line_items
  as permissive
  for update
  to public
  using ((EXISTS ( SELECT 1
   FROM invoices i
  WHERE ((i.id = invoice_line_items.invoice_id) AND private.has_org_role(i.org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text])))))
  with check ((EXISTS ( SELECT 1
   FROM invoices i
  WHERE ((i.id = invoice_line_items.invoice_id) AND private.has_org_role(i.org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text])))));

drop policy if exists itil_changes_insert on public.itil_changes;
create policy itil_changes_insert on public.itil_changes
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists itil_changes_update on public.itil_changes;
create policy itil_changes_update on public.itil_changes
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists itil_problems_insert on public.itil_problems;
create policy itil_problems_insert on public.itil_problems
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists itil_problems_update on public.itil_problems;
create policy itil_problems_update on public.itil_problems
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists kb_articles_write__insert on public.kb_articles;
create policy kb_articles_write__insert on public.kb_articles
  as permissive
  for insert
  to authenticated
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists kb_articles_write__update on public.kb_articles;
create policy kb_articles_write__update on public.kb_articles
  as permissive
  for update
  to authenticated
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists leads_insert on public.leads;
create policy leads_insert on public.leads
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists leads_update on public.leads;
create policy leads_update on public.leads
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists legend_certifications_write on public.legend_certifications;
create policy legend_certifications_write on public.legend_certifications
  as permissive
  for all
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists legend_courses_write on public.legend_courses;
create policy legend_courses_write on public.legend_courses
  as permissive
  for all
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists legend_crew_members_write on public.legend_crew_members;
create policy legend_crew_members_write on public.legend_crew_members
  as permissive
  for all
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists legend_crews_write on public.legend_crews;
create policy legend_crews_write on public.legend_crews
  as permissive
  for all
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists legend_live_sessions_write on public.legend_live_sessions;
create policy legend_live_sessions_write on public.legend_live_sessions
  as permissive
  for all
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists legend_session_registrations_update on public.legend_session_registrations;
create policy legend_session_registrations_update on public.legend_session_registrations
  as permissive
  for update
  to public
  using (((user_id = ( SELECT auth.uid() AS uid)) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text])))
  with check (((user_id = ( SELECT auth.uid() AS uid)) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text])));

drop policy if exists lessons_write on public.lessons;
create policy lessons_write on public.lessons
  as permissive
  for all
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists locations_insert on public.locations;
create policy locations_insert on public.locations
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists locations_update on public.locations;
create policy locations_update on public.locations
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists lodging_assignment_details_iud on public.lodging_assignment_details;
create policy lodging_assignment_details_iud on public.lodging_assignment_details
  as permissive
  for all
  to authenticated
  using ((EXISTS ( SELECT 1
   FROM assignments a
  WHERE ((a.id = lodging_assignment_details.assignment_id) AND private.has_org_role(a.org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text])))))
  with check ((EXISTS ( SELECT 1
   FROM assignments a
  WHERE ((a.id = lodging_assignment_details.assignment_id) AND private.has_org_role(a.org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text])))));

drop policy if exists maint_sched_insert on public.maintenance_schedules;
create policy maint_sched_insert on public.maintenance_schedules
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists maint_sched_update on public.maintenance_schedules;
create policy maint_sched_update on public.maintenance_schedules
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists medical_encounters_write__insert on public.medical_encounters;
create policy medical_encounters_write__insert on public.medical_encounters
  as permissive
  for insert
  to authenticated
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists medical_encounters_write__update on public.medical_encounters;
create policy medical_encounters_write__update on public.medical_encounters
  as permissive
  for update
  to authenticated
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists mileage_logs_insert on public.mileage_logs;
create policy mileage_logs_insert on public.mileage_logs
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists mileage_logs_update on public.mileage_logs;
create policy mileage_logs_update on public.mileage_logs
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists msa_state_transitions_insert_collab on public.msa_state_transitions;
create policy msa_state_transitions_insert_collab on public.msa_state_transitions
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists onboarding_step_state_transitions_insert_collab on public.onboarding_step_state_transitions;
create policy onboarding_step_state_transitions_insert_collab on public.onboarding_step_state_transitions
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists pay_app_lines_write__insert on public.payment_application_lines;
create policy pay_app_lines_write__insert on public.payment_application_lines
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text]));

drop policy if exists pay_app_lines_write__update on public.payment_application_lines;
create policy pay_app_lines_write__update on public.payment_application_lines
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text]));

drop policy if exists pay_apps_update on public.payment_applications;
create policy pay_apps_update on public.payment_applications
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text]));

drop policy if exists playbooks_insert on public.playbooks;
create policy playbooks_insert on public.playbooks
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists playbooks_update on public.playbooks;
create policy playbooks_update on public.playbooks
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists po_co_lines_write__insert on public.po_change_order_lines;
create policy po_co_lines_write__insert on public.po_change_order_lines
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text]));

drop policy if exists po_co_lines_write__update on public.po_change_order_lines;
create policy po_co_lines_write__update on public.po_change_order_lines
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text]));

drop policy if exists po_co_update on public.po_change_orders;
create policy po_co_update on public.po_change_orders
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text]));

drop policy if exists po_line_items_modify__insert on public.po_line_items;
create policy po_line_items_modify__insert on public.po_line_items
  as permissive
  for insert
  to public
  with check ((EXISTS ( SELECT 1
   FROM purchase_orders p
  WHERE ((p.id = po_line_items.purchase_order_id) AND private.has_org_role(p.org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text])))));

drop policy if exists po_line_items_modify__update on public.po_line_items;
create policy po_line_items_modify__update on public.po_line_items
  as permissive
  for update
  to public
  using ((EXISTS ( SELECT 1
   FROM purchase_orders p
  WHERE ((p.id = po_line_items.purchase_order_id) AND private.has_org_role(p.org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text])))))
  with check ((EXISTS ( SELECT 1
   FROM purchase_orders p
  WHERE ((p.id = po_line_items.purchase_order_id) AND private.has_org_role(p.org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text])))));

drop policy if exists prequal_q_write__insert on public.prequalification_questionnaires;
create policy prequal_q_write__insert on public.prequalification_questionnaires
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists prequal_q_write__update on public.prequalification_questionnaires;
create policy prequal_q_write__update on public.prequalification_questionnaires
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists prequal_questions_write__insert on public.prequalification_questions;
create policy prequal_questions_write__insert on public.prequalification_questions
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists prequal_questions_write__update on public.prequalification_questions;
create policy prequal_questions_write__update on public.prequalification_questions
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists production_phase_transitions_insert_collab on public.production_phase_transitions;
create policy production_phase_transitions_insert_collab on public.production_phase_transitions
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists project_phase_transitions_insert_collab on public.project_phase_transitions;
create policy project_phase_transitions_insert_collab on public.project_phase_transitions
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists proj_photos_write__insert on public.project_photos;
create policy proj_photos_write__insert on public.project_photos
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text, 'contractor'::text]));

drop policy if exists proj_photos_write__update on public.project_photos;
create policy proj_photos_write__update on public.project_photos
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text, 'contractor'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text, 'contractor'::text]));

drop policy if exists punch_items_update on public.punch_items;
create policy punch_items_update on public.punch_items
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text, 'contractor'::text]));

drop policy if exists punch_lists_write__insert on public.punch_lists;
create policy punch_lists_write__insert on public.punch_lists
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists punch_lists_write__update on public.punch_lists;
create policy punch_lists_write__update on public.punch_lists
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists purchase_orders_insert on public.purchase_orders;
create policy purchase_orders_insert on public.purchase_orders
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists purchase_orders_update on public.purchase_orders;
create policy purchase_orders_update on public.purchase_orders
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists rate_card_items_admin__insert on public.rate_card_items;
create policy rate_card_items_admin__insert on public.rate_card_items
  as permissive
  for insert
  to authenticated
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists rate_card_items_admin__update on public.rate_card_items;
create policy rate_card_items_admin__update on public.rate_card_items
  as permissive
  for update
  to authenticated
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists rentals_insert on public.rentals;
create policy rentals_insert on public.rentals
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists rentals_update on public.rentals;
create policy rentals_update on public.rentals
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists requisitions_insert on public.requisitions;
create policy requisitions_insert on public.requisitions
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists requisitions_update on public.requisitions;
create policy requisitions_update on public.requisitions
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists rfis_update on public.rfis;
create policy rfis_update on public.rfis
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text, 'contractor'::text]));

drop policy if exists rfq_resp_lines_write__insert on public.rfq_response_lines;
create policy rfq_resp_lines_write__insert on public.rfq_response_lines
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text]));

drop policy if exists rfq_resp_lines_write__update on public.rfq_response_lines;
create policy rfq_resp_lines_write__update on public.rfq_response_lines
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text]));

drop policy if exists rfq_resp_update on public.rfq_responses;
create policy rfq_resp_update on public.rfq_responses
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text]));

drop policy if exists rfqs_org_modify__insert on public.rfqs;
create policy rfqs_org_modify__insert on public.rfqs
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists rfqs_org_modify__update on public.rfqs;
create policy rfqs_org_modify__update on public.rfqs
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists risks_insert on public.risks;
create policy risks_insert on public.risks
  as permissive
  for insert
  to authenticated
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists risks_update on public.risks;
create policy risks_update on public.risks
  as permissive
  for update
  to authenticated
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists briefings_insert on public.safety_briefings;
create policy briefings_insert on public.safety_briefings
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]));

drop policy if exists briefings_update on public.safety_briefings;
create policy briefings_update on public.safety_briefings
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]));

drop policy if exists service_sla_policies_insert on public.service_sla_policies;
create policy service_sla_policies_insert on public.service_sla_policies
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists service_sla_policies_update on public.service_sla_policies;
create policy service_sla_policies_update on public.service_sla_policies
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists shifts_admin__insert on public.shifts;
create policy shifts_admin__insert on public.shifts
  as permissive
  for insert
  to authenticated
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists shifts_admin__update on public.shifts;
create policy shifts_admin__update on public.shifts
  as permissive
  for update
  to authenticated
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists site_plan_pins_write__insert on public.site_plan_pins;
create policy site_plan_pins_write__insert on public.site_plan_pins
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]));

drop policy if exists site_plan_pins_write__update on public.site_plan_pins;
create policy site_plan_pins_write__update on public.site_plan_pins
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]));

drop policy if exists site_plan_rev_write__insert on public.site_plan_revisions;
create policy site_plan_rev_write__insert on public.site_plan_revisions
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists site_plan_rev_write__update on public.site_plan_revisions;
create policy site_plan_rev_write__update on public.site_plan_revisions
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists site_plans_insert on public.site_plans;
create policy site_plans_insert on public.site_plans
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists site_plans_update on public.site_plans;
create policy site_plans_update on public.site_plans
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists sponsor_entitlements_admin__insert on public.sponsor_entitlements;
create policy sponsor_entitlements_admin__insert on public.sponsor_entitlements
  as permissive
  for insert
  to authenticated
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists sponsor_entitlements_admin__update on public.sponsor_entitlements;
create policy sponsor_entitlements_admin__update on public.sponsor_entitlements
  as permissive
  for update
  to authenticated
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists stage_plots_insert on public.stage_plots;
create policy stage_plots_insert on public.stage_plots
  as permissive
  for insert
  to authenticated
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists stage_plots_update on public.stage_plots;
create policy stage_plots_update on public.stage_plots
  as permissive
  for update
  to authenticated
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists submittal_rev_write__insert on public.submittal_revisions;
create policy submittal_rev_write__insert on public.submittal_revisions
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text]));

drop policy if exists submittal_rev_write__update on public.submittal_revisions;
create policy submittal_rev_write__update on public.submittal_revisions
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text]));

drop policy if exists submittals_update on public.submittals;
create policy submittals_update on public.submittals
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text]));

drop policy if exists subscription_state_transitions_insert_admin on public.subscription_state_transitions;
create policy subscription_state_transitions_insert_admin on public.subscription_state_transitions
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists subscriptions_admin_insert on public.subscriptions;
create policy subscriptions_admin_insert on public.subscriptions
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists subscriptions_admin_update on public.subscriptions;
create policy subscriptions_admin_update on public.subscriptions
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists threats_insert on public.threats;
create policy threats_insert on public.threats
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists threats_update on public.threats;
create policy threats_update on public.threats
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists ticket_assignment_details_iud on public.ticket_assignment_details;
create policy ticket_assignment_details_iud on public.ticket_assignment_details
  as permissive
  for all
  to authenticated
  using ((EXISTS ( SELECT 1
   FROM assignments a
  WHERE ((a.id = ticket_assignment_details.assignment_id) AND private.has_org_role(a.org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text])))))
  with check ((EXISTS ( SELECT 1
   FROM assignments a
  WHERE ((a.id = ticket_assignment_details.assignment_id) AND private.has_org_role(a.org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text])))));

drop policy if exists time_entries_insert on public.time_entries;
create policy time_entries_insert on public.time_entries
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists time_entries_update on public.time_entries;
create policy time_entries_update on public.time_entries
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists trademarks_rw on public.trademarks;
create policy trademarks_rw on public.trademarks
  as permissive
  for all
  to authenticated
  using (private.is_org_member(org_id))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists travel_assignment_details_iud on public.travel_assignment_details;
create policy travel_assignment_details_iud on public.travel_assignment_details
  as permissive
  for all
  to authenticated
  using ((EXISTS ( SELECT 1
   FROM assignments a
  WHERE ((a.id = travel_assignment_details.assignment_id) AND private.has_org_role(a.org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text])))))
  with check ((EXISTS ( SELECT 1
   FROM assignments a
  WHERE ((a.id = travel_assignment_details.assignment_id) AND private.has_org_role(a.org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text])))));

drop policy if exists vehicle_assignment_details_iud on public.vehicle_assignment_details;
create policy vehicle_assignment_details_iud on public.vehicle_assignment_details
  as permissive
  for all
  to authenticated
  using ((EXISTS ( SELECT 1
   FROM assignments a
  WHERE ((a.id = vehicle_assignment_details.assignment_id) AND private.has_org_role(a.org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text])))))
  with check ((EXISTS ( SELECT 1
   FROM assignments a
  WHERE ((a.id = vehicle_assignment_details.assignment_id) AND private.has_org_role(a.org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text])))));

drop policy if exists vp_ans_write__insert on public.vendor_prequalification_answers;
create policy vp_ans_write__insert on public.vendor_prequalification_answers
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text]));

drop policy if exists vp_ans_write__update on public.vendor_prequalification_answers;
create policy vp_ans_write__update on public.vendor_prequalification_answers
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text]));

drop policy if exists vp_insert on public.vendor_prequalifications;
create policy vp_insert on public.vendor_prequalifications
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists vp_update on public.vendor_prequalifications;
create policy vp_update on public.vendor_prequalifications
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text]));

drop policy if exists vendors_insert on public.vendors;
create policy vendors_insert on public.vendors
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists vendors_update on public.vendors;
create policy vendors_update on public.vendors
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists venue_build_log_insert on public.venue_build_log;
create policy venue_build_log_insert on public.venue_build_log
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]));

drop policy if exists venue_build_log_update on public.venue_build_log;
create policy venue_build_log_update on public.venue_build_log
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]));

drop policy if exists venue_closeout_insert on public.venue_closeout_items;
create policy venue_closeout_insert on public.venue_closeout_items
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]));

drop policy if exists venue_closeout_update on public.venue_closeout_items;
create policy venue_closeout_update on public.venue_closeout_items
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]));

drop policy if exists venue_design_specs_insert on public.venue_design_specs;
create policy venue_design_specs_insert on public.venue_design_specs
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists venue_design_specs_update on public.venue_design_specs;
create policy venue_design_specs_update on public.venue_design_specs
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists venue_handover_insert on public.venue_handover_items;
create policy venue_handover_insert on public.venue_handover_items
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]));

drop policy if exists venue_handover_update on public.venue_handover_items;
create policy venue_handover_update on public.venue_handover_items
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text, 'crew'::text]));

drop policy if exists venue_vop_insert on public.venue_vop_sections;
create policy venue_vop_insert on public.venue_vop_sections
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists venue_vop_update on public.venue_vop_sections;
create policy venue_vop_update on public.venue_vop_sections
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists wob_insert on public.work_order_broadcasts;
create policy wob_insert on public.work_order_broadcasts
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists wob_update on public.work_order_broadcasts;
create policy wob_update on public.work_order_broadcasts
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists workforce_members_admin__insert on public.workforce_members;
create policy workforce_members_admin__insert on public.workforce_members
  as permissive
  for insert
  to authenticated
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists workforce_members_admin__update on public.workforce_members;
create policy workforce_members_admin__update on public.workforce_members
  as permissive
  for update
  to authenticated
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text]));

drop policy if exists xpms_atom_tiers_write__insert on public.xpms_atom_tiers;
create policy xpms_atom_tiers_write__insert on public.xpms_atom_tiers
  as permissive
  for insert
  to public
  with check ((EXISTS ( SELECT 1
   FROM xpms_atoms a
  WHERE ((a.id = xpms_atom_tiers.atom_id) AND private.has_org_role(a.org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text])))));

drop policy if exists xpms_atom_tiers_write__update on public.xpms_atom_tiers;
create policy xpms_atom_tiers_write__update on public.xpms_atom_tiers
  as permissive
  for update
  to public
  using ((EXISTS ( SELECT 1
   FROM xpms_atoms a
  WHERE ((a.id = xpms_atom_tiers.atom_id) AND private.has_org_role(a.org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text])))))
  with check ((EXISTS ( SELECT 1
   FROM xpms_atoms a
  WHERE ((a.id = xpms_atom_tiers.atom_id) AND private.has_org_role(a.org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text])))));

drop policy if exists xpms_atoms_write__insert on public.xpms_atoms;
create policy xpms_atoms_write__insert on public.xpms_atoms
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists xpms_atoms_write__update on public.xpms_atoms;
create policy xpms_atoms_write__update on public.xpms_atoms
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists xpms_composition_write__insert on public.xpms_project_composition;
create policy xpms_composition_write__insert on public.xpms_project_composition
  as permissive
  for insert
  to public
  with check ((EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = xpms_project_composition.project_id) AND private.has_org_role(p.org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text])))));

drop policy if exists xpms_composition_write__update on public.xpms_project_composition;
create policy xpms_composition_write__update on public.xpms_project_composition
  as permissive
  for update
  to public
  using ((EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = xpms_project_composition.project_id) AND private.has_org_role(p.org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text])))))
  with check ((EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = xpms_project_composition.project_id) AND private.has_org_role(p.org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text])))));

drop policy if exists xpms_edges_write__insert on public.xpms_provenance_edges;
create policy xpms_edges_write__insert on public.xpms_provenance_edges
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists xpms_edges_write__update on public.xpms_provenance_edges;
create policy xpms_edges_write__update on public.xpms_provenance_edges
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists xpms_variance_write__insert on public.xpms_variance_ledger;
create policy xpms_variance_write__insert on public.xpms_variance_ledger
  as permissive
  for insert
  to public
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

drop policy if exists xpms_variance_write__update on public.xpms_variance_ledger;
create policy xpms_variance_write__update on public.xpms_variance_ledger
  as permissive
  for update
  to public
  using (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]))
  with check (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text, 'controller'::text, 'collaborator'::text]));

commit;
