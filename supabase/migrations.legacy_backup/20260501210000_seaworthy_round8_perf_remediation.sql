-- =====================================================================
-- seaworthy round 8 — Supabase performance advisor remediations
-- =====================================================================
-- auth_rls_initplan:               35
-- multiple_permissive_policies:    311 findings → 66 consolidated policies
-- duplicate_index:                 1
-- unused_index:                    316
-- =====================================================================

BEGIN;
-- =====================================================================
-- SECTION A — auth_rls_initplan rewrites (35 policies)
-- Wraps auth.<fn>() and current_setting() in (select ...) subqueries.
-- =====================================================================

DROP POLICY IF EXISTS "ai_messages_insert" ON public."ai_messages";
CREATE POLICY "ai_messages_insert" ON public."ai_messages"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((EXISTS ( SELECT 1
   FROM ai_conversations c
  WHERE ((c.id = ai_messages.conversation_id) AND (c.user_id = (select auth.uid()))))));

DROP POLICY IF EXISTS "ai_messages_select" ON public."ai_messages";
CREATE POLICY "ai_messages_select" ON public."ai_messages"
  AS PERMISSIVE FOR SELECT TO public
  USING ((EXISTS ( SELECT 1
   FROM ai_conversations c
  WHERE ((c.id = ai_messages.conversation_id) AND ((c.user_id = (select auth.uid())) OR has_org_role(c.org_id, ARRAY['owner'::text, 'admin'::text]))))));

DROP POLICY IF EXISTS "ai_conversations_delete" ON public."ai_conversations";
CREATE POLICY "ai_conversations_delete" ON public."ai_conversations"
  AS PERMISSIVE FOR DELETE TO public
  USING ((user_id = (select auth.uid())));

DROP POLICY IF EXISTS "ai_conversations_insert" ON public."ai_conversations";
CREATE POLICY "ai_conversations_insert" ON public."ai_conversations"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (((user_id = (select auth.uid())) AND is_org_member(org_id)));

DROP POLICY IF EXISTS "ai_conversations_select" ON public."ai_conversations";
CREATE POLICY "ai_conversations_select" ON public."ai_conversations"
  AS PERMISSIVE FOR SELECT TO public
  USING (((user_id = (select auth.uid())) OR has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));

DROP POLICY IF EXISTS "ai_conversations_update" ON public."ai_conversations";
CREATE POLICY "ai_conversations_update" ON public."ai_conversations"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((user_id = (select auth.uid())))
  WITH CHECK ((user_id = (select auth.uid())));

DROP POLICY IF EXISTS "notifications_select" ON public."notifications";
CREATE POLICY "notifications_select" ON public."notifications"
  AS PERMISSIVE FOR SELECT TO public
  USING ((user_id = (select auth.uid())));

DROP POLICY IF EXISTS "notifications_update" ON public."notifications";
CREATE POLICY "notifications_update" ON public."notifications"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((user_id = (select auth.uid())))
  WITH CHECK ((user_id = (select auth.uid())));

DROP POLICY IF EXISTS "dispatch_runs_select" ON public."dispatch_runs";
CREATE POLICY "dispatch_runs_select" ON public."dispatch_runs"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((is_org_member(org_id) OR (driver_id = (select auth.uid()))));

DROP POLICY IF EXISTS "crisis_alert_receipts_select" ON public."crisis_alert_receipts";
CREATE POLICY "crisis_alert_receipts_select" ON public."crisis_alert_receipts"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((is_org_member(org_id) OR (user_id = (select auth.uid()))));

DROP POLICY IF EXISTS "crisis_alert_receipts_update" ON public."crisis_alert_receipts";
CREATE POLICY "crisis_alert_receipts_update" ON public."crisis_alert_receipts"
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((user_id = (select auth.uid())))
  WITH CHECK ((user_id = (select auth.uid())));

DROP POLICY IF EXISTS "deliverable_comments_insert" ON public."deliverable_comments";
CREATE POLICY "deliverable_comments_insert" ON public."deliverable_comments"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (((EXISTS ( SELECT 1
   FROM deliverables d
  WHERE ((d.id = deliverable_comments.deliverable_id) AND (is_org_member(d.org_id) OR (d.submitted_by = (select auth.uid())))))) AND (user_id = (select auth.uid()))));

DROP POLICY IF EXISTS "deliverable_comments_select" ON public."deliverable_comments";
CREATE POLICY "deliverable_comments_select" ON public."deliverable_comments"
  AS PERMISSIVE FOR SELECT TO public
  USING ((EXISTS ( SELECT 1
   FROM deliverables d
  WHERE ((d.id = deliverable_comments.deliverable_id) AND (is_org_member(d.org_id) OR (d.submitted_by = (select auth.uid())))))));

DROP POLICY IF EXISTS "deliverables_select" ON public."deliverables";
CREATE POLICY "deliverables_select" ON public."deliverables"
  AS PERMISSIVE FOR SELECT TO public
  USING ((is_org_member(org_id) OR (submitted_by = (select auth.uid()))));

DROP POLICY IF EXISTS "deliverables_update_submitter" ON public."deliverables";
CREATE POLICY "deliverables_update_submitter" ON public."deliverables"
  AS PERMISSIVE FOR UPDATE TO public
  USING (((submitted_by = (select auth.uid())) AND (status = ANY (ARRAY['draft'::deliverable_status, 'revision_requested'::deliverable_status]))))
  WITH CHECK ((submitted_by = (select auth.uid())));

DROP POLICY IF EXISTS "delegations_select" ON public."delegations";
CREATE POLICY "delegations_select" ON public."delegations"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((is_org_member(org_id) OR (attache_user_id = (select auth.uid()))));

DROP POLICY IF EXISTS "user_passkeys_own_rw" ON public."user_passkeys";
CREATE POLICY "user_passkeys_own_rw" ON public."user_passkeys"
  AS PERMISSIVE FOR ALL TO public
  USING ((user_id = (select auth.uid())))
  WITH CHECK ((user_id = (select auth.uid())));

DROP POLICY IF EXISTS "invites_accept_recipient" ON public."invites";
CREATE POLICY "invites_accept_recipient" ON public."invites"
  AS PERMISSIVE FOR UPDATE TO public
  USING (((status = 'pending'::text) AND (expires_at > now()) AND (lower(email) = lower(auth.email()))))
  WITH CHECK (((status = 'accepted'::text) AND (accepted_by = (select auth.uid())) AND (lower(email) = lower(auth.email()))));

DROP POLICY IF EXISTS "invites_select_recipient" ON public."invites";
CREATE POLICY "invites_select_recipient" ON public."invites"
  AS PERMISSIVE FOR SELECT TO public
  USING (((status = 'pending'::text) AND (expires_at > now()) AND (lower(email) = lower(auth.email()))));

DROP POLICY IF EXISTS "memberships_delete_admin" ON public."memberships";
CREATE POLICY "memberships_delete_admin" ON public."memberships"
  AS PERMISSIVE FOR DELETE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text]) OR (user_id = (select auth.uid()))));

DROP POLICY IF EXISTS "memberships_select" ON public."memberships";
CREATE POLICY "memberships_select" ON public."memberships"
  AS PERMISSIVE FOR SELECT TO public
  USING (((user_id = (select auth.uid())) OR is_org_member(org_id)));

DROP POLICY IF EXISTS "accreditations_select" ON public."accreditations";
CREATE POLICY "accreditations_select" ON public."accreditations"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((is_org_member(org_id) OR (user_id = (select auth.uid()))));

DROP POLICY IF EXISTS "rate_card_orders_rw" ON public."rate_card_orders";
CREATE POLICY "rate_card_orders_rw" ON public."rate_card_orders"
  AS PERMISSIVE FOR ALL TO authenticated
  USING ((is_org_member(org_id) OR (requester_id = (select auth.uid()))))
  WITH CHECK ((is_org_member(org_id) OR (requester_id = (select auth.uid()))));

DROP POLICY IF EXISTS "workforce_members_select" ON public."workforce_members";
CREATE POLICY "workforce_members_select" ON public."workforce_members"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((is_org_member(org_id) OR (user_id = (select auth.uid()))));

DROP POLICY IF EXISTS "shifts_select" ON public."shifts";
CREATE POLICY "shifts_select" ON public."shifts"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((is_org_member(org_id) OR (EXISTS ( SELECT 1
   FROM workforce_members wm
  WHERE ((wm.id = shifts.workforce_member_id) AND (wm.user_id = (select auth.uid())))))));

DROP POLICY IF EXISTS "users_select_self" ON public."users";
CREATE POLICY "users_select_self" ON public."users"
  AS PERMISSIVE FOR SELECT TO public
  USING (((id = (select auth.uid())) OR (EXISTS ( SELECT 1
   FROM (memberships m1
     JOIN memberships m2 ON ((m1.org_id = m2.org_id)))
  WHERE ((m1.user_id = (select auth.uid())) AND (m2.user_id = users.id))))));

DROP POLICY IF EXISTS "users_update_self" ON public."users";
CREATE POLICY "users_update_self" ON public."users"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((id = (select auth.uid())))
  WITH CHECK ((id = (select auth.uid())));

DROP POLICY IF EXISTS "user_preferences_own_rw" ON public."user_preferences";
CREATE POLICY "user_preferences_own_rw" ON public."user_preferences"
  AS PERMISSIVE FOR ALL TO public
  USING ((user_id = (select auth.uid())))
  WITH CHECK ((user_id = (select auth.uid())));

DROP POLICY IF EXISTS "safeguarding_reports_select" ON public."safeguarding_reports";
CREATE POLICY "safeguarding_reports_select" ON public."safeguarding_reports"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text]) OR (reporter_id = (select auth.uid()))));

DROP POLICY IF EXISTS "dsar_requests_insert" ON public."dsar_requests";
CREATE POLICY "dsar_requests_insert" ON public."dsar_requests"
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((is_org_member(org_id) OR (requester_user_id = (select auth.uid())) OR (lower(requester_email) = lower(COALESCE(((select auth.jwt()) ->> 'email'::text), ''::text)))));

DROP POLICY IF EXISTS "dsar_requests_select" ON public."dsar_requests";
CREATE POLICY "dsar_requests_select" ON public."dsar_requests"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((is_org_member(org_id) OR (requester_user_id = (select auth.uid()))));

DROP POLICY IF EXISTS "consent_records_rw" ON public."consent_records";
CREATE POLICY "consent_records_rw" ON public."consent_records"
  AS PERMISSIVE FOR ALL TO authenticated
  USING ((is_org_member(org_id) OR (user_id = (select auth.uid()))))
  WITH CHECK ((is_org_member(org_id) OR (user_id = (select auth.uid()))));

DROP POLICY IF EXISTS "conv_msg_delete" ON public."conversation_messages";
CREATE POLICY "conv_msg_delete" ON public."conversation_messages"
  AS PERMISSIVE FOR DELETE TO public
  USING (((author_id = (select auth.uid())) OR has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));

DROP POLICY IF EXISTS "conv_msg_insert" ON public."conversation_messages";
CREATE POLICY "conv_msg_insert" ON public."conversation_messages"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((is_org_member(org_id) AND (author_id = (select auth.uid()))));

DROP POLICY IF EXISTS "conv_msg_update" ON public."conversation_messages";
CREATE POLICY "conv_msg_update" ON public."conversation_messages"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((author_id = (select auth.uid())));

-- =====================================================================
-- SECTION B — multiple_permissive_policies consolidation
-- 66 (schema, table, cmd) groups; 57 ALL-policies pre-split.
-- Steps: (1) split each ALL-policy into per-cmd slices; (2) for each group,
-- drop every member (including ALL-slices for this cmd) and create one
-- *_<cmd>_consolidated policy with deduped OR-combined quals.
-- =====================================================================

-- ----- ALL-policy splits (run before consolidations) -----

DROP POLICY IF EXISTS "accreditation_categories_rw" ON public."accreditation_categories";
CREATE POLICY "accreditation_categories_rw__select" ON public."accreditation_categories"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((is_org_member(org_id)));
CREATE POLICY "accreditation_categories_rw__insert" ON public."accreditation_categories"
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "accreditation_categories_rw__update" ON public."accreditation_categories"
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((is_org_member(org_id)))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "accreditation_categories_rw__delete" ON public."accreditation_categories"
  AS PERMISSIVE FOR DELETE TO authenticated
  USING ((is_org_member(org_id)));

DROP POLICY IF EXISTS "accreditation_changes_write" ON public."accreditation_changes";
CREATE POLICY "accreditation_changes_write__select" ON public."accreditation_changes"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "accreditation_changes_write__insert" ON public."accreditation_changes"
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "accreditation_changes_write__update" ON public."accreditation_changes"
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "accreditation_changes_write__delete" ON public."accreditation_changes"
  AS PERMISSIVE FOR DELETE TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));

DROP POLICY IF EXISTS "accreditations_admin" ON public."accreditations";
CREATE POLICY "accreditations_admin__select" ON public."accreditations"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "accreditations_admin__insert" ON public."accreditations"
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "accreditations_admin__update" ON public."accreditations"
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "accreditations_admin__delete" ON public."accreditations"
  AS PERMISSIVE FOR DELETE TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));

DROP POLICY IF EXISTS "asset_links_org_modify" ON public."asset_links";
CREATE POLICY "asset_links_org_modify__select" ON public."asset_links"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
CREATE POLICY "asset_links_org_modify__insert" ON public."asset_links"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
CREATE POLICY "asset_links_org_modify__update" ON public."asset_links"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
CREATE POLICY "asset_links_org_modify__delete" ON public."asset_links"
  AS PERMISSIVE FOR DELETE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));

DROP POLICY IF EXISTS "automations_org_modify" ON public."automations";
CREATE POLICY "automations_org_modify__select" ON public."automations"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "automations_org_modify__insert" ON public."automations"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "automations_org_modify__update" ON public."automations"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "automations_org_modify__delete" ON public."automations"
  AS PERMISSIVE FOR DELETE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));

DROP POLICY IF EXISTS "case_studies_admin" ON public."case_studies";
CREATE POLICY "case_studies_admin__select" ON public."case_studies"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "case_studies_admin__insert" ON public."case_studies"
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "case_studies_admin__update" ON public."case_studies"
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "case_studies_admin__delete" ON public."case_studies"
  AS PERMISSIVE FOR DELETE TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));

DROP POLICY IF EXISTS "cost_codes_write" ON public."cost_codes";
CREATE POLICY "cost_codes_write__select" ON public."cost_codes"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "cost_codes_write__insert" ON public."cost_codes"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "cost_codes_write__update" ON public."cost_codes"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "cost_codes_write__delete" ON public."cost_codes"
  AS PERMISSIVE FOR DELETE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));

DROP POLICY IF EXISTS "crisis_alerts_admin" ON public."crisis_alerts";
CREATE POLICY "crisis_alerts_admin__select" ON public."crisis_alerts"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "crisis_alerts_admin__insert" ON public."crisis_alerts"
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "crisis_alerts_admin__update" ON public."crisis_alerts"
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "crisis_alerts_admin__delete" ON public."crisis_alerts"
  AS PERMISSIVE FOR DELETE TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));

DROP POLICY IF EXISTS "cues_org_modify" ON public."cues";
CREATE POLICY "cues_org_modify__select" ON public."cues"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));
CREATE POLICY "cues_org_modify__insert" ON public."cues"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));
CREATE POLICY "cues_org_modify__update" ON public."cues"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));
CREATE POLICY "cues_org_modify__delete" ON public."cues"
  AS PERMISSIVE FOR DELETE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));

DROP POLICY IF EXISTS "dl_deliveries_write" ON public."daily_log_deliveries";
CREATE POLICY "dl_deliveries_write__select" ON public."daily_log_deliveries"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));
CREATE POLICY "dl_deliveries_write__insert" ON public."daily_log_deliveries"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));
CREATE POLICY "dl_deliveries_write__update" ON public."daily_log_deliveries"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));
CREATE POLICY "dl_deliveries_write__delete" ON public."daily_log_deliveries"
  AS PERMISSIVE FOR DELETE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));

DROP POLICY IF EXISTS "dl_equipment_write" ON public."daily_log_equipment";
CREATE POLICY "dl_equipment_write__select" ON public."daily_log_equipment"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));
CREATE POLICY "dl_equipment_write__insert" ON public."daily_log_equipment"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));
CREATE POLICY "dl_equipment_write__update" ON public."daily_log_equipment"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));
CREATE POLICY "dl_equipment_write__delete" ON public."daily_log_equipment"
  AS PERMISSIVE FOR DELETE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));

DROP POLICY IF EXISTS "dl_manpower_write" ON public."daily_log_manpower";
CREATE POLICY "dl_manpower_write__select" ON public."daily_log_manpower"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));
CREATE POLICY "dl_manpower_write__insert" ON public."daily_log_manpower"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));
CREATE POLICY "dl_manpower_write__update" ON public."daily_log_manpower"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));
CREATE POLICY "dl_manpower_write__delete" ON public."daily_log_manpower"
  AS PERMISSIVE FOR DELETE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));

DROP POLICY IF EXISTS "dl_photos_write" ON public."daily_log_photos";
CREATE POLICY "dl_photos_write__select" ON public."daily_log_photos"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));
CREATE POLICY "dl_photos_write__insert" ON public."daily_log_photos"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));
CREATE POLICY "dl_photos_write__update" ON public."daily_log_photos"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));
CREATE POLICY "dl_photos_write__delete" ON public."daily_log_photos"
  AS PERMISSIVE FOR DELETE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));

DROP POLICY IF EXISTS "dl_visitors_write" ON public."daily_log_visitors";
CREATE POLICY "dl_visitors_write__select" ON public."daily_log_visitors"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));
CREATE POLICY "dl_visitors_write__insert" ON public."daily_log_visitors"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));
CREATE POLICY "dl_visitors_write__update" ON public."daily_log_visitors"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));
CREATE POLICY "dl_visitors_write__delete" ON public."daily_log_visitors"
  AS PERMISSIVE FOR DELETE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));

DROP POLICY IF EXISTS "delegations_admin" ON public."delegations";
CREATE POLICY "delegations_admin__select" ON public."delegations"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "delegations_admin__insert" ON public."delegations"
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "delegations_admin__update" ON public."delegations"
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "delegations_admin__delete" ON public."delegations"
  AS PERMISSIVE FOR DELETE TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));

DROP POLICY IF EXISTS "dispatch_runs_admin" ON public."dispatch_runs";
CREATE POLICY "dispatch_runs_admin__select" ON public."dispatch_runs"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "dispatch_runs_admin__insert" ON public."dispatch_runs"
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "dispatch_runs_admin__update" ON public."dispatch_runs"
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "dispatch_runs_admin__delete" ON public."dispatch_runs"
  AS PERMISSIVE FOR DELETE TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));

DROP POLICY IF EXISTS "dsar_requests_admin" ON public."dsar_requests";
CREATE POLICY "dsar_requests_admin__select" ON public."dsar_requests"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "dsar_requests_admin__insert" ON public."dsar_requests"
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "dsar_requests_admin__update" ON public."dsar_requests"
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "dsar_requests_admin__delete" ON public."dsar_requests"
  AS PERMISSIVE FOR DELETE TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));

DROP POLICY IF EXISTS "form_defs_org_modify" ON public."form_defs";
CREATE POLICY "form_defs_org_modify__select" ON public."form_defs"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));
CREATE POLICY "form_defs_org_modify__insert" ON public."form_defs"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));
CREATE POLICY "form_defs_org_modify__update" ON public."form_defs"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));
CREATE POLICY "form_defs_org_modify__delete" ON public."form_defs"
  AS PERMISSIVE FOR DELETE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));

DROP POLICY IF EXISTS "committees_org_modify" ON public."governance_committees";
CREATE POLICY "committees_org_modify__select" ON public."governance_committees"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
CREATE POLICY "committees_org_modify__insert" ON public."governance_committees"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
CREATE POLICY "committees_org_modify__update" ON public."governance_committees"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
CREATE POLICY "committees_org_modify__delete" ON public."governance_committees"
  AS PERMISSIVE FOR DELETE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));

DROP POLICY IF EXISTS "policies_org_modify" ON public."governance_policies";
CREATE POLICY "policies_org_modify__select" ON public."governance_policies"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
CREATE POLICY "policies_org_modify__insert" ON public."governance_policies"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
CREATE POLICY "policies_org_modify__update" ON public."governance_policies"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
CREATE POLICY "policies_org_modify__delete" ON public."governance_policies"
  AS PERMISSIVE FOR DELETE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));

DROP POLICY IF EXISTS "import_runs_org_modify" ON public."import_runs";
CREATE POLICY "import_runs_org_modify__select" ON public."import_runs"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
CREATE POLICY "import_runs_org_modify__insert" ON public."import_runs"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
CREATE POLICY "import_runs_org_modify__update" ON public."import_runs"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
CREATE POLICY "import_runs_org_modify__delete" ON public."import_runs"
  AS PERMISSIVE FOR DELETE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));

DROP POLICY IF EXISTS "insp_items_write" ON public."inspection_items";
CREATE POLICY "insp_items_write__select" ON public."inspection_items"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));
CREATE POLICY "insp_items_write__insert" ON public."inspection_items"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));
CREATE POLICY "insp_items_write__update" ON public."inspection_items"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));
CREATE POLICY "insp_items_write__delete" ON public."inspection_items"
  AS PERMISSIVE FOR DELETE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));

DROP POLICY IF EXISTS "insp_tpl_items_write" ON public."inspection_template_items";
CREATE POLICY "insp_tpl_items_write__select" ON public."inspection_template_items"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));
CREATE POLICY "insp_tpl_items_write__insert" ON public."inspection_template_items"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));
CREATE POLICY "insp_tpl_items_write__update" ON public."inspection_template_items"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));
CREATE POLICY "insp_tpl_items_write__delete" ON public."inspection_template_items"
  AS PERMISSIVE FOR DELETE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));

DROP POLICY IF EXISTS "integration_connectors_admin" ON public."integration_connectors";
CREATE POLICY "integration_connectors_admin__select" ON public."integration_connectors"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
CREATE POLICY "integration_connectors_admin__insert" ON public."integration_connectors"
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
CREATE POLICY "integration_connectors_admin__update" ON public."integration_connectors"
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
CREATE POLICY "integration_connectors_admin__delete" ON public."integration_connectors"
  AS PERMISSIVE FOR DELETE TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));

DROP POLICY IF EXISTS "invoice_line_items_modify" ON public."invoice_line_items";
CREATE POLICY "invoice_line_items_modify__select" ON public."invoice_line_items"
  AS PERMISSIVE FOR SELECT TO public
  USING (((EXISTS ( SELECT 1
   FROM invoices i
  WHERE ((i.id = invoice_line_items.invoice_id) AND has_org_role(i.org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text]))))));
CREATE POLICY "invoice_line_items_modify__insert" ON public."invoice_line_items"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (((EXISTS ( SELECT 1
   FROM invoices i
  WHERE ((i.id = invoice_line_items.invoice_id) AND has_org_role(i.org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text]))))));
CREATE POLICY "invoice_line_items_modify__update" ON public."invoice_line_items"
  AS PERMISSIVE FOR UPDATE TO public
  USING (((EXISTS ( SELECT 1
   FROM invoices i
  WHERE ((i.id = invoice_line_items.invoice_id) AND has_org_role(i.org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text]))))))
  WITH CHECK (((EXISTS ( SELECT 1
   FROM invoices i
  WHERE ((i.id = invoice_line_items.invoice_id) AND has_org_role(i.org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text]))))));
CREATE POLICY "invoice_line_items_modify__delete" ON public."invoice_line_items"
  AS PERMISSIVE FOR DELETE TO public
  USING (((EXISTS ( SELECT 1
   FROM invoices i
  WHERE ((i.id = invoice_line_items.invoice_id) AND has_org_role(i.org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text]))))));

DROP POLICY IF EXISTS "kb_articles_write" ON public."kb_articles";
CREATE POLICY "kb_articles_write__select" ON public."kb_articles"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));
CREATE POLICY "kb_articles_write__insert" ON public."kb_articles"
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));
CREATE POLICY "kb_articles_write__update" ON public."kb_articles"
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));
CREATE POLICY "kb_articles_write__delete" ON public."kb_articles"
  AS PERMISSIVE FOR DELETE TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));

DROP POLICY IF EXISTS "medical_encounters_write" ON public."medical_encounters";
CREATE POLICY "medical_encounters_write__select" ON public."medical_encounters"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "medical_encounters_write__insert" ON public."medical_encounters"
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "medical_encounters_write__update" ON public."medical_encounters"
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "medical_encounters_write__delete" ON public."medical_encounters"
  AS PERMISSIVE FOR DELETE TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));

DROP POLICY IF EXISTS "org_integrations_org_modify" ON public."org_integrations";
CREATE POLICY "org_integrations_org_modify__select" ON public."org_integrations"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
CREATE POLICY "org_integrations_org_modify__insert" ON public."org_integrations"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
CREATE POLICY "org_integrations_org_modify__update" ON public."org_integrations"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
CREATE POLICY "org_integrations_org_modify__delete" ON public."org_integrations"
  AS PERMISSIVE FOR DELETE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));

DROP POLICY IF EXISTS "org_roles_org_modify" ON public."org_roles";
CREATE POLICY "org_roles_org_modify__select" ON public."org_roles"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
CREATE POLICY "org_roles_org_modify__insert" ON public."org_roles"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
CREATE POLICY "org_roles_org_modify__update" ON public."org_roles"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
CREATE POLICY "org_roles_org_modify__delete" ON public."org_roles"
  AS PERMISSIVE FOR DELETE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));

DROP POLICY IF EXISTS "pay_app_lines_write" ON public."payment_application_lines";
CREATE POLICY "pay_app_lines_write__select" ON public."payment_application_lines"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text])));
CREATE POLICY "pay_app_lines_write__insert" ON public."payment_application_lines"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text])));
CREATE POLICY "pay_app_lines_write__update" ON public."payment_application_lines"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text])));
CREATE POLICY "pay_app_lines_write__delete" ON public."payment_application_lines"
  AS PERMISSIVE FOR DELETE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text])));

DROP POLICY IF EXISTS "po_co_lines_write" ON public."po_change_order_lines";
CREATE POLICY "po_co_lines_write__select" ON public."po_change_order_lines"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text])));
CREATE POLICY "po_co_lines_write__insert" ON public."po_change_order_lines"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text])));
CREATE POLICY "po_co_lines_write__update" ON public."po_change_order_lines"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text])));
CREATE POLICY "po_co_lines_write__delete" ON public."po_change_order_lines"
  AS PERMISSIVE FOR DELETE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text])));

DROP POLICY IF EXISTS "po_chk_write" ON public."po_checklist_items";
CREATE POLICY "po_chk_write__select" ON public."po_checklist_items"
  AS PERMISSIVE FOR SELECT TO public
  USING ((is_org_member(org_id)));
CREATE POLICY "po_chk_write__insert" ON public."po_checklist_items"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((is_org_member(org_id)));
CREATE POLICY "po_chk_write__update" ON public."po_checklist_items"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((is_org_member(org_id)))
  WITH CHECK ((is_org_member(org_id)));
CREATE POLICY "po_chk_write__delete" ON public."po_checklist_items"
  AS PERMISSIVE FOR DELETE TO public
  USING ((is_org_member(org_id)));

DROP POLICY IF EXISTS "po_line_items_modify" ON public."po_line_items";
CREATE POLICY "po_line_items_modify__select" ON public."po_line_items"
  AS PERMISSIVE FOR SELECT TO public
  USING (((EXISTS ( SELECT 1
   FROM purchase_orders p
  WHERE ((p.id = po_line_items.purchase_order_id) AND has_org_role(p.org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text]))))));
CREATE POLICY "po_line_items_modify__insert" ON public."po_line_items"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (((EXISTS ( SELECT 1
   FROM purchase_orders p
  WHERE ((p.id = po_line_items.purchase_order_id) AND has_org_role(p.org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text]))))));
CREATE POLICY "po_line_items_modify__update" ON public."po_line_items"
  AS PERMISSIVE FOR UPDATE TO public
  USING (((EXISTS ( SELECT 1
   FROM purchase_orders p
  WHERE ((p.id = po_line_items.purchase_order_id) AND has_org_role(p.org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text]))))))
  WITH CHECK (((EXISTS ( SELECT 1
   FROM purchase_orders p
  WHERE ((p.id = po_line_items.purchase_order_id) AND has_org_role(p.org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text]))))));
CREATE POLICY "po_line_items_modify__delete" ON public."po_line_items"
  AS PERMISSIVE FOR DELETE TO public
  USING (((EXISTS ( SELECT 1
   FROM purchase_orders p
  WHERE ((p.id = po_line_items.purchase_order_id) AND has_org_role(p.org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text]))))));

DROP POLICY IF EXISTS "prequal_q_write" ON public."prequalification_questionnaires";
CREATE POLICY "prequal_q_write__select" ON public."prequalification_questionnaires"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "prequal_q_write__insert" ON public."prequalification_questionnaires"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "prequal_q_write__update" ON public."prequalification_questionnaires"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "prequal_q_write__delete" ON public."prequalification_questionnaires"
  AS PERMISSIVE FOR DELETE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));

DROP POLICY IF EXISTS "prequal_questions_write" ON public."prequalification_questions";
CREATE POLICY "prequal_questions_write__select" ON public."prequalification_questions"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "prequal_questions_write__insert" ON public."prequalification_questions"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "prequal_questions_write__update" ON public."prequalification_questions"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "prequal_questions_write__delete" ON public."prequalification_questions"
  AS PERMISSIVE FOR DELETE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));

DROP POLICY IF EXISTS "proj_photos_write" ON public."project_photos";
CREATE POLICY "proj_photos_write__select" ON public."project_photos"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text, 'contractor'::text])));
CREATE POLICY "proj_photos_write__insert" ON public."project_photos"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text, 'contractor'::text])));
CREATE POLICY "proj_photos_write__update" ON public."project_photos"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text, 'contractor'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text, 'contractor'::text])));
CREATE POLICY "proj_photos_write__delete" ON public."project_photos"
  AS PERMISSIVE FOR DELETE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text, 'contractor'::text])));

DROP POLICY IF EXISTS "proposal_share_links_modify" ON public."proposal_share_links";
CREATE POLICY "proposal_share_links_modify__select" ON public."proposal_share_links"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(proposal_org_id(proposal_id), ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));
CREATE POLICY "proposal_share_links_modify__insert" ON public."proposal_share_links"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((has_org_role(proposal_org_id(proposal_id), ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));
CREATE POLICY "proposal_share_links_modify__update" ON public."proposal_share_links"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((has_org_role(proposal_org_id(proposal_id), ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])))
  WITH CHECK ((has_org_role(proposal_org_id(proposal_id), ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));
CREATE POLICY "proposal_share_links_modify__delete" ON public."proposal_share_links"
  AS PERMISSIVE FOR DELETE TO public
  USING ((has_org_role(proposal_org_id(proposal_id), ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));

DROP POLICY IF EXISTS "punch_lists_write" ON public."punch_lists";
CREATE POLICY "punch_lists_write__select" ON public."punch_lists"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));
CREATE POLICY "punch_lists_write__insert" ON public."punch_lists"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));
CREATE POLICY "punch_lists_write__update" ON public."punch_lists"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));
CREATE POLICY "punch_lists_write__delete" ON public."punch_lists"
  AS PERMISSIVE FOR DELETE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));

DROP POLICY IF EXISTS "rate_card_items_admin" ON public."rate_card_items";
CREATE POLICY "rate_card_items_admin__select" ON public."rate_card_items"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "rate_card_items_admin__insert" ON public."rate_card_items"
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "rate_card_items_admin__update" ON public."rate_card_items"
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "rate_card_items_admin__delete" ON public."rate_card_items"
  AS PERMISSIVE FOR DELETE TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));

DROP POLICY IF EXISTS "rate_limit_overrides_write" ON public."rate_limit_overrides";
CREATE POLICY "rate_limit_overrides_write__select" ON public."rate_limit_overrides"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
CREATE POLICY "rate_limit_overrides_write__insert" ON public."rate_limit_overrides"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
CREATE POLICY "rate_limit_overrides_write__update" ON public."rate_limit_overrides"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
CREATE POLICY "rate_limit_overrides_write__delete" ON public."rate_limit_overrides"
  AS PERMISSIVE FOR DELETE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));

DROP POLICY IF EXISTS "rfq_resp_lines_write" ON public."rfq_response_lines";
CREATE POLICY "rfq_resp_lines_write__select" ON public."rfq_response_lines"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text])));
CREATE POLICY "rfq_resp_lines_write__insert" ON public."rfq_response_lines"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text])));
CREATE POLICY "rfq_resp_lines_write__update" ON public."rfq_response_lines"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text])));
CREATE POLICY "rfq_resp_lines_write__delete" ON public."rfq_response_lines"
  AS PERMISSIVE FOR DELETE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text])));

DROP POLICY IF EXISTS "rfqs_org_modify" ON public."rfqs";
CREATE POLICY "rfqs_org_modify__select" ON public."rfqs"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));
CREATE POLICY "rfqs_org_modify__insert" ON public."rfqs"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));
CREATE POLICY "rfqs_org_modify__update" ON public."rfqs"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));
CREATE POLICY "rfqs_org_modify__delete" ON public."rfqs"
  AS PERMISSIVE FOR DELETE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));

DROP POLICY IF EXISTS "briefing_att_write" ON public."safety_briefing_attendees";
CREATE POLICY "briefing_att_write__select" ON public."safety_briefing_attendees"
  AS PERMISSIVE FOR SELECT TO public
  USING ((is_org_member(org_id)));
CREATE POLICY "briefing_att_write__insert" ON public."safety_briefing_attendees"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((is_org_member(org_id)));
CREATE POLICY "briefing_att_write__update" ON public."safety_briefing_attendees"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((is_org_member(org_id)))
  WITH CHECK ((is_org_member(org_id)));
CREATE POLICY "briefing_att_write__delete" ON public."safety_briefing_attendees"
  AS PERMISSIVE FOR DELETE TO public
  USING ((is_org_member(org_id)));

DROP POLICY IF EXISTS "shifts_admin" ON public."shifts";
CREATE POLICY "shifts_admin__select" ON public."shifts"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));
CREATE POLICY "shifts_admin__insert" ON public."shifts"
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));
CREATE POLICY "shifts_admin__update" ON public."shifts"
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));
CREATE POLICY "shifts_admin__delete" ON public."shifts"
  AS PERMISSIVE FOR DELETE TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));

DROP POLICY IF EXISTS "site_plan_pins_write" ON public."site_plan_pins";
CREATE POLICY "site_plan_pins_write__select" ON public."site_plan_pins"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));
CREATE POLICY "site_plan_pins_write__insert" ON public."site_plan_pins"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));
CREATE POLICY "site_plan_pins_write__update" ON public."site_plan_pins"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));
CREATE POLICY "site_plan_pins_write__delete" ON public."site_plan_pins"
  AS PERMISSIVE FOR DELETE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));

DROP POLICY IF EXISTS "site_plan_rev_write" ON public."site_plan_revisions";
CREATE POLICY "site_plan_rev_write__select" ON public."site_plan_revisions"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));
CREATE POLICY "site_plan_rev_write__insert" ON public."site_plan_revisions"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));
CREATE POLICY "site_plan_rev_write__update" ON public."site_plan_revisions"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));
CREATE POLICY "site_plan_rev_write__delete" ON public."site_plan_revisions"
  AS PERMISSIVE FOR DELETE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));

DROP POLICY IF EXISTS "sponsor_entitlements_admin" ON public."sponsor_entitlements";
CREATE POLICY "sponsor_entitlements_admin__select" ON public."sponsor_entitlements"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "sponsor_entitlements_admin__insert" ON public."sponsor_entitlements"
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "sponsor_entitlements_admin__update" ON public."sponsor_entitlements"
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "sponsor_entitlements_admin__delete" ON public."sponsor_entitlements"
  AS PERMISSIVE FOR DELETE TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));

DROP POLICY IF EXISTS "submittal_rev_write" ON public."submittal_revisions";
CREATE POLICY "submittal_rev_write__select" ON public."submittal_revisions"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text])));
CREATE POLICY "submittal_rev_write__insert" ON public."submittal_revisions"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text])));
CREATE POLICY "submittal_rev_write__update" ON public."submittal_revisions"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text])));
CREATE POLICY "submittal_rev_write__delete" ON public."submittal_revisions"
  AS PERMISSIVE FOR DELETE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text])));

DROP POLICY IF EXISTS "ticket_types_admin" ON public."ticket_types";
CREATE POLICY "ticket_types_admin__select" ON public."ticket_types"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "ticket_types_admin__insert" ON public."ticket_types"
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "ticket_types_admin__update" ON public."ticket_types"
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "ticket_types_admin__delete" ON public."ticket_types"
  AS PERMISSIVE FOR DELETE TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));

DROP POLICY IF EXISTS "vp_ans_write" ON public."vendor_prequalification_answers";
CREATE POLICY "vp_ans_write__select" ON public."vendor_prequalification_answers"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text])));
CREATE POLICY "vp_ans_write__insert" ON public."vendor_prequalification_answers"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text])));
CREATE POLICY "vp_ans_write__update" ON public."vendor_prequalification_answers"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text])));
CREATE POLICY "vp_ans_write__delete" ON public."vendor_prequalification_answers"
  AS PERMISSIVE FOR DELETE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text])));

DROP POLICY IF EXISTS "wob_inv_write" ON public."work_order_broadcast_invites";
CREATE POLICY "wob_inv_write__select" ON public."work_order_broadcast_invites"
  AS PERMISSIVE FOR SELECT TO public
  USING ((is_org_member(org_id)));
CREATE POLICY "wob_inv_write__insert" ON public."work_order_broadcast_invites"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((is_org_member(org_id)));
CREATE POLICY "wob_inv_write__update" ON public."work_order_broadcast_invites"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((is_org_member(org_id)))
  WITH CHECK ((is_org_member(org_id)));
CREATE POLICY "wob_inv_write__delete" ON public."work_order_broadcast_invites"
  AS PERMISSIVE FOR DELETE TO public
  USING ((is_org_member(org_id)));

DROP POLICY IF EXISTS "workforce_members_admin" ON public."workforce_members";
CREATE POLICY "workforce_members_admin__select" ON public."workforce_members"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "workforce_members_admin__insert" ON public."workforce_members"
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "workforce_members_admin__update" ON public."workforce_members"
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
CREATE POLICY "workforce_members_admin__delete" ON public."workforce_members"
  AS PERMISSIVE FOR DELETE TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));

DROP POLICY IF EXISTS "xpms_atom_tiers_write" ON public."xpms_atom_tiers";
CREATE POLICY "xpms_atom_tiers_write__select" ON public."xpms_atom_tiers"
  AS PERMISSIVE FOR SELECT TO public
  USING (((EXISTS ( SELECT 1
   FROM xpms_atoms a
  WHERE ((a.id = xpms_atom_tiers.atom_id) AND has_org_role(a.org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text]))))));
CREATE POLICY "xpms_atom_tiers_write__insert" ON public."xpms_atom_tiers"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (((EXISTS ( SELECT 1
   FROM xpms_atoms a
  WHERE ((a.id = xpms_atom_tiers.atom_id) AND has_org_role(a.org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text]))))));
CREATE POLICY "xpms_atom_tiers_write__update" ON public."xpms_atom_tiers"
  AS PERMISSIVE FOR UPDATE TO public
  USING (((EXISTS ( SELECT 1
   FROM xpms_atoms a
  WHERE ((a.id = xpms_atom_tiers.atom_id) AND has_org_role(a.org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text]))))))
  WITH CHECK (((EXISTS ( SELECT 1
   FROM xpms_atoms a
  WHERE ((a.id = xpms_atom_tiers.atom_id) AND has_org_role(a.org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text]))))));
CREATE POLICY "xpms_atom_tiers_write__delete" ON public."xpms_atom_tiers"
  AS PERMISSIVE FOR DELETE TO public
  USING (((EXISTS ( SELECT 1
   FROM xpms_atoms a
  WHERE ((a.id = xpms_atom_tiers.atom_id) AND has_org_role(a.org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text]))))));

DROP POLICY IF EXISTS "xpms_atoms_write" ON public."xpms_atoms";
CREATE POLICY "xpms_atoms_write__select" ON public."xpms_atoms"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));
CREATE POLICY "xpms_atoms_write__insert" ON public."xpms_atoms"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));
CREATE POLICY "xpms_atoms_write__update" ON public."xpms_atoms"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));
CREATE POLICY "xpms_atoms_write__delete" ON public."xpms_atoms"
  AS PERMISSIVE FOR DELETE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));

DROP POLICY IF EXISTS "xpms_composition_write" ON public."xpms_project_composition";
CREATE POLICY "xpms_composition_write__select" ON public."xpms_project_composition"
  AS PERMISSIVE FOR SELECT TO public
  USING (((EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = xpms_project_composition.project_id) AND has_org_role(p.org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text]))))));
CREATE POLICY "xpms_composition_write__insert" ON public."xpms_project_composition"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK (((EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = xpms_project_composition.project_id) AND has_org_role(p.org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text]))))));
CREATE POLICY "xpms_composition_write__update" ON public."xpms_project_composition"
  AS PERMISSIVE FOR UPDATE TO public
  USING (((EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = xpms_project_composition.project_id) AND has_org_role(p.org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text]))))))
  WITH CHECK (((EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = xpms_project_composition.project_id) AND has_org_role(p.org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text]))))));
CREATE POLICY "xpms_composition_write__delete" ON public."xpms_project_composition"
  AS PERMISSIVE FOR DELETE TO public
  USING (((EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = xpms_project_composition.project_id) AND has_org_role(p.org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text]))))));

DROP POLICY IF EXISTS "xpms_edges_write" ON public."xpms_provenance_edges";
CREATE POLICY "xpms_edges_write__select" ON public."xpms_provenance_edges"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));
CREATE POLICY "xpms_edges_write__insert" ON public."xpms_provenance_edges"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));
CREATE POLICY "xpms_edges_write__update" ON public."xpms_provenance_edges"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));
CREATE POLICY "xpms_edges_write__delete" ON public."xpms_provenance_edges"
  AS PERMISSIVE FOR DELETE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));

DROP POLICY IF EXISTS "xpms_variance_write" ON public."xpms_variance_ledger";
CREATE POLICY "xpms_variance_write__select" ON public."xpms_variance_ledger"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));
CREATE POLICY "xpms_variance_write__insert" ON public."xpms_variance_ledger"
  AS PERMISSIVE FOR INSERT TO public
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));
CREATE POLICY "xpms_variance_write__update" ON public."xpms_variance_ledger"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));
CREATE POLICY "xpms_variance_write__delete" ON public."xpms_variance_ledger"
  AS PERMISSIVE FOR DELETE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));


-- ----- Consolidations -----

DROP POLICY IF EXISTS "accreditation_categories_read" ON public."accreditation_categories";
DROP POLICY IF EXISTS "accreditation_categories_rw__select" ON public."accreditation_categories";
CREATE POLICY "accreditation_categories_select_consolidated" ON public."accreditation_categories"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((is_org_member(org_id)));

DROP POLICY IF EXISTS "accreditation_changes_select" ON public."accreditation_changes";
DROP POLICY IF EXISTS "accreditation_changes_write__select" ON public."accreditation_changes";
CREATE POLICY "accreditation_changes_select_consolidated" ON public."accreditation_changes"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((is_org_member(org_id)) OR (has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));

DROP POLICY IF EXISTS "accreditations_admin__select" ON public."accreditations";
DROP POLICY IF EXISTS "accreditations_select" ON public."accreditations";
CREATE POLICY "accreditations_select_consolidated" ON public."accreditations"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])) OR ((is_org_member(org_id) OR (user_id = (select auth.uid())))));

DROP POLICY IF EXISTS "asset_links_org_modify__select" ON public."asset_links";
DROP POLICY IF EXISTS "asset_links_org_select" ON public."asset_links";
CREATE POLICY "asset_links_select_consolidated" ON public."asset_links"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])) OR (is_org_member(org_id)));

DROP POLICY IF EXISTS "automations_org_modify__select" ON public."automations";
DROP POLICY IF EXISTS "automations_org_select" ON public."automations";
CREATE POLICY "automations_select_consolidated" ON public."automations"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])) OR (is_org_member(org_id)));

DROP POLICY IF EXISTS "case_studies_admin__select" ON public."case_studies";
DROP POLICY IF EXISTS "case_studies_public_select" ON public."case_studies";
CREATE POLICY "case_studies_select_consolidated" ON public."case_studies"
  AS PERMISSIVE FOR SELECT TO anon, authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])) OR ((published_at IS NOT NULL)));

DROP POLICY IF EXISTS "cost_codes_select" ON public."cost_codes";
DROP POLICY IF EXISTS "cost_codes_write__select" ON public."cost_codes";
CREATE POLICY "cost_codes_select_consolidated" ON public."cost_codes"
  AS PERMISSIVE FOR SELECT TO public
  USING ((is_org_member(org_id)) OR (has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));

DROP POLICY IF EXISTS "crisis_alerts_admin__select" ON public."crisis_alerts";
DROP POLICY IF EXISTS "crisis_alerts_select" ON public."crisis_alerts";
CREATE POLICY "crisis_alerts_select_consolidated" ON public."crisis_alerts"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])) OR (is_org_member(org_id)));

DROP POLICY IF EXISTS "cues_org_modify__select" ON public."cues";
DROP POLICY IF EXISTS "cues_org_select" ON public."cues";
CREATE POLICY "cues_select_consolidated" ON public."cues"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])) OR (is_org_member(org_id)));

DROP POLICY IF EXISTS "dl_deliveries_select" ON public."daily_log_deliveries";
DROP POLICY IF EXISTS "dl_deliveries_write__select" ON public."daily_log_deliveries";
CREATE POLICY "daily_log_deliveries_select_consolidated" ON public."daily_log_deliveries"
  AS PERMISSIVE FOR SELECT TO public
  USING ((is_org_member(org_id)) OR (has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));

DROP POLICY IF EXISTS "dl_equipment_select" ON public."daily_log_equipment";
DROP POLICY IF EXISTS "dl_equipment_write__select" ON public."daily_log_equipment";
CREATE POLICY "daily_log_equipment_select_consolidated" ON public."daily_log_equipment"
  AS PERMISSIVE FOR SELECT TO public
  USING ((is_org_member(org_id)) OR (has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));

DROP POLICY IF EXISTS "dl_manpower_select" ON public."daily_log_manpower";
DROP POLICY IF EXISTS "dl_manpower_write__select" ON public."daily_log_manpower";
CREATE POLICY "daily_log_manpower_select_consolidated" ON public."daily_log_manpower"
  AS PERMISSIVE FOR SELECT TO public
  USING ((is_org_member(org_id)) OR (has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));

DROP POLICY IF EXISTS "dl_photos_select" ON public."daily_log_photos";
DROP POLICY IF EXISTS "dl_photos_write__select" ON public."daily_log_photos";
CREATE POLICY "daily_log_photos_select_consolidated" ON public."daily_log_photos"
  AS PERMISSIVE FOR SELECT TO public
  USING ((is_org_member(org_id)) OR (has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));

DROP POLICY IF EXISTS "dl_visitors_select" ON public."daily_log_visitors";
DROP POLICY IF EXISTS "dl_visitors_write__select" ON public."daily_log_visitors";
CREATE POLICY "daily_log_visitors_select_consolidated" ON public."daily_log_visitors"
  AS PERMISSIVE FOR SELECT TO public
  USING ((is_org_member(org_id)) OR (has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));

DROP POLICY IF EXISTS "delegations_admin__select" ON public."delegations";
DROP POLICY IF EXISTS "delegations_select" ON public."delegations";
CREATE POLICY "delegations_select_consolidated" ON public."delegations"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])) OR ((is_org_member(org_id) OR (attache_user_id = (select auth.uid())))));

DROP POLICY IF EXISTS "deliverables_update_reviewer" ON public."deliverables";
DROP POLICY IF EXISTS "deliverables_update_submitter" ON public."deliverables";
CREATE POLICY "deliverables_update_consolidated" ON public."deliverables"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])) OR (((submitted_by = (select auth.uid())) AND (status = ANY (ARRAY['draft'::deliverable_status, 'revision_requested'::deliverable_status])))))
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])) OR ((submitted_by = (select auth.uid()))));

DROP POLICY IF EXISTS "dispatch_runs_admin__select" ON public."dispatch_runs";
DROP POLICY IF EXISTS "dispatch_runs_select" ON public."dispatch_runs";
CREATE POLICY "dispatch_runs_select_consolidated" ON public."dispatch_runs"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])) OR ((is_org_member(org_id) OR (driver_id = (select auth.uid())))));

DROP POLICY IF EXISTS "dsar_requests_admin__insert" ON public."dsar_requests";
DROP POLICY IF EXISTS "dsar_requests_insert" ON public."dsar_requests";
CREATE POLICY "dsar_requests_insert_consolidated" ON public."dsar_requests"
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])) OR ((is_org_member(org_id) OR (requester_user_id = (select auth.uid())) OR (lower(requester_email) = lower(COALESCE(((select auth.jwt()) ->> 'email'::text), ''::text))))));

DROP POLICY IF EXISTS "dsar_requests_admin__select" ON public."dsar_requests";
DROP POLICY IF EXISTS "dsar_requests_select" ON public."dsar_requests";
CREATE POLICY "dsar_requests_select_consolidated" ON public."dsar_requests"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])) OR ((is_org_member(org_id) OR (requester_user_id = (select auth.uid())))));

DROP POLICY IF EXISTS "event_guides_select" ON public."event_guides";
DROP POLICY IF EXISTS "event_guides_select_public" ON public."event_guides";
CREATE POLICY "event_guides_select_consolidated" ON public."event_guides"
  AS PERMISSIVE FOR SELECT TO public
  USING (((is_org_member(org_id) OR ((published = true) AND (EXISTS ( SELECT 1
   FROM tickets t
  WHERE ((t.project_id = event_guides.project_id) AND (t.holder_email = auth_user_email()))))))) OR ((published = true)));

DROP POLICY IF EXISTS "form_defs_org_modify__select" ON public."form_defs";
DROP POLICY IF EXISTS "form_defs_org_select" ON public."form_defs";
CREATE POLICY "form_defs_select_consolidated" ON public."form_defs"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])) OR (is_org_member(org_id)));

DROP POLICY IF EXISTS "committees_org_modify__select" ON public."governance_committees";
DROP POLICY IF EXISTS "committees_org_select" ON public."governance_committees";
CREATE POLICY "governance_committees_select_consolidated" ON public."governance_committees"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])) OR (is_org_member(org_id)));

DROP POLICY IF EXISTS "policies_org_modify__select" ON public."governance_policies";
DROP POLICY IF EXISTS "policies_org_select" ON public."governance_policies";
CREATE POLICY "governance_policies_select_consolidated" ON public."governance_policies"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])) OR (is_org_member(org_id)));

DROP POLICY IF EXISTS "guide_comments_select" ON public."guide_comments";
DROP POLICY IF EXISTS "guide_comments_select_public" ON public."guide_comments";
CREATE POLICY "guide_comments_select_consolidated" ON public."guide_comments"
  AS PERMISSIVE FOR SELECT TO public
  USING ((is_org_member(org_id)) OR ((EXISTS ( SELECT 1
   FROM event_guides g
  WHERE ((g.id = guide_comments.guide_id) AND (g.published = true))))));

DROP POLICY IF EXISTS "import_runs_org_modify__select" ON public."import_runs";
DROP POLICY IF EXISTS "import_runs_org_select" ON public."import_runs";
CREATE POLICY "import_runs_select_consolidated" ON public."import_runs"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])) OR (is_org_member(org_id)));

DROP POLICY IF EXISTS "insp_items_select" ON public."inspection_items";
DROP POLICY IF EXISTS "insp_items_write__select" ON public."inspection_items";
CREATE POLICY "inspection_items_select_consolidated" ON public."inspection_items"
  AS PERMISSIVE FOR SELECT TO public
  USING ((is_org_member(org_id)) OR (has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));

DROP POLICY IF EXISTS "insp_tpl_items_select" ON public."inspection_template_items";
DROP POLICY IF EXISTS "insp_tpl_items_write__select" ON public."inspection_template_items";
CREATE POLICY "inspection_template_items_select_consolidated" ON public."inspection_template_items"
  AS PERMISSIVE FOR SELECT TO public
  USING ((is_org_member(org_id)) OR (has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));

DROP POLICY IF EXISTS "integration_connectors_admin__select" ON public."integration_connectors";
DROP POLICY IF EXISTS "integration_connectors_read" ON public."integration_connectors";
CREATE POLICY "integration_connectors_select_consolidated" ON public."integration_connectors"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])) OR (is_org_member(org_id)));

DROP POLICY IF EXISTS "invites_select_admin" ON public."invites";
DROP POLICY IF EXISTS "invites_select_recipient" ON public."invites";
CREATE POLICY "invites_select_consolidated" ON public."invites"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'developer'::text])) OR (((status = 'pending'::text) AND (expires_at > now()) AND (lower(email) = lower((select auth.email()))))));

DROP POLICY IF EXISTS "invites_accept_recipient" ON public."invites";
DROP POLICY IF EXISTS "invites_update_admin" ON public."invites";
CREATE POLICY "invites_update_consolidated" ON public."invites"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((((status = 'pending'::text) AND (expires_at > now()) AND (lower(email) = lower((select auth.email()))))) OR (has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'developer'::text])))
  WITH CHECK ((((status = 'accepted'::text) AND (accepted_by = (select auth.uid())) AND (lower(email) = lower((select auth.email()))))) OR (has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'developer'::text])));

DROP POLICY IF EXISTS "invoice_line_items_modify__select" ON public."invoice_line_items";
DROP POLICY IF EXISTS "invoice_line_items_select" ON public."invoice_line_items";
CREATE POLICY "invoice_line_items_select_consolidated" ON public."invoice_line_items"
  AS PERMISSIVE FOR SELECT TO public
  USING (((EXISTS ( SELECT 1
   FROM invoices i
  WHERE ((i.id = invoice_line_items.invoice_id) AND has_org_role(i.org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text]))))) OR ((EXISTS ( SELECT 1
   FROM invoices i
  WHERE ((i.id = invoice_line_items.invoice_id) AND is_org_member(i.org_id))))));

DROP POLICY IF EXISTS "kb_articles_select" ON public."kb_articles";
DROP POLICY IF EXISTS "kb_articles_write__select" ON public."kb_articles";
CREATE POLICY "kb_articles_select_consolidated" ON public."kb_articles"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((is_org_member(org_id)) OR (has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));

DROP POLICY IF EXISTS "medical_encounters_select" ON public."medical_encounters";
DROP POLICY IF EXISTS "medical_encounters_write__select" ON public."medical_encounters";
CREATE POLICY "medical_encounters_select_consolidated" ON public."medical_encounters"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));

DROP POLICY IF EXISTS "org_integrations_org_modify__select" ON public."org_integrations";
DROP POLICY IF EXISTS "org_integrations_org_select" ON public."org_integrations";
CREATE POLICY "org_integrations_select_consolidated" ON public."org_integrations"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])) OR (is_org_member(org_id)));

DROP POLICY IF EXISTS "org_roles_org_modify__select" ON public."org_roles";
DROP POLICY IF EXISTS "org_roles_org_select" ON public."org_roles";
CREATE POLICY "org_roles_select_consolidated" ON public."org_roles"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])) OR (is_org_member(org_id)));

DROP POLICY IF EXISTS "pay_app_lines_select" ON public."payment_application_lines";
DROP POLICY IF EXISTS "pay_app_lines_write__select" ON public."payment_application_lines";
CREATE POLICY "payment_application_lines_select_consolidated" ON public."payment_application_lines"
  AS PERMISSIVE FOR SELECT TO public
  USING ((is_org_member(org_id)) OR (has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text])));

DROP POLICY IF EXISTS "po_co_lines_select" ON public."po_change_order_lines";
DROP POLICY IF EXISTS "po_co_lines_write__select" ON public."po_change_order_lines";
CREATE POLICY "po_change_order_lines_select_consolidated" ON public."po_change_order_lines"
  AS PERMISSIVE FOR SELECT TO public
  USING ((is_org_member(org_id)) OR (has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text])));

DROP POLICY IF EXISTS "po_chk_select" ON public."po_checklist_items";
DROP POLICY IF EXISTS "po_chk_write__select" ON public."po_checklist_items";
CREATE POLICY "po_checklist_items_select_consolidated" ON public."po_checklist_items"
  AS PERMISSIVE FOR SELECT TO public
  USING ((is_org_member(org_id)));

DROP POLICY IF EXISTS "po_line_items_modify__select" ON public."po_line_items";
DROP POLICY IF EXISTS "po_line_items_select" ON public."po_line_items";
CREATE POLICY "po_line_items_select_consolidated" ON public."po_line_items"
  AS PERMISSIVE FOR SELECT TO public
  USING (((EXISTS ( SELECT 1
   FROM purchase_orders p
  WHERE ((p.id = po_line_items.purchase_order_id) AND has_org_role(p.org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text]))))) OR ((EXISTS ( SELECT 1
   FROM purchase_orders p
  WHERE ((p.id = po_line_items.purchase_order_id) AND is_org_member(p.org_id))))));

DROP POLICY IF EXISTS "prequal_q_select" ON public."prequalification_questionnaires";
DROP POLICY IF EXISTS "prequal_q_write__select" ON public."prequalification_questionnaires";
CREATE POLICY "prequalification_questionnaires_select_consolidated" ON public."prequalification_questionnaires"
  AS PERMISSIVE FOR SELECT TO public
  USING ((is_org_member(org_id)) OR (has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));

DROP POLICY IF EXISTS "prequal_questions_select" ON public."prequalification_questions";
DROP POLICY IF EXISTS "prequal_questions_write__select" ON public."prequalification_questions";
CREATE POLICY "prequalification_questions_select_consolidated" ON public."prequalification_questions"
  AS PERMISSIVE FOR SELECT TO public
  USING ((is_org_member(org_id)) OR (has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));

DROP POLICY IF EXISTS "proj_photos_select" ON public."project_photos";
DROP POLICY IF EXISTS "proj_photos_write__select" ON public."project_photos";
CREATE POLICY "project_photos_select_consolidated" ON public."project_photos"
  AS PERMISSIVE FOR SELECT TO public
  USING ((is_org_member(org_id)) OR (has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text, 'contractor'::text])));

DROP POLICY IF EXISTS "projects_select" ON public."projects";
DROP POLICY IF EXISTS "projects_select_if_guide_published" ON public."projects";
CREATE POLICY "projects_select_consolidated" ON public."projects"
  AS PERMISSIVE FOR SELECT TO public
  USING ((is_org_member(org_id)) OR ((EXISTS ( SELECT 1
   FROM event_guides g
  WHERE ((g.project_id = projects.id) AND (g.published = true))))));

DROP POLICY IF EXISTS "proposal_share_links_modify__select" ON public."proposal_share_links";
DROP POLICY IF EXISTS "proposal_share_links_public_select" ON public."proposal_share_links";
DROP POLICY IF EXISTS "proposal_share_links_select" ON public."proposal_share_links";
CREATE POLICY "proposal_share_links_select_consolidated" ON public."proposal_share_links"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(proposal_org_id(proposal_id), ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])) OR (((revoked_at IS NULL) AND ((expires_at IS NULL) OR (expires_at > now())))) OR (is_org_member(proposal_org_id(proposal_id))));

DROP POLICY IF EXISTS "proposal_share_links_modify__update" ON public."proposal_share_links";
DROP POLICY IF EXISTS "proposal_share_links_public_bump" ON public."proposal_share_links";
CREATE POLICY "proposal_share_links_update_consolidated" ON public."proposal_share_links"
  AS PERMISSIVE FOR UPDATE TO public
  USING ((has_org_role(proposal_org_id(proposal_id), ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])) OR (((revoked_at IS NULL) AND ((expires_at IS NULL) OR (expires_at > now())))))
  WITH CHECK ((has_org_role(proposal_org_id(proposal_id), ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])) OR (((revoked_at IS NULL) AND ((expires_at IS NULL) OR (expires_at > now())))));

DROP POLICY IF EXISTS "proposals_select" ON public."proposals";
DROP POLICY IF EXISTS "proposals_select_by_share_token" ON public."proposals";
CREATE POLICY "proposals_select_consolidated" ON public."proposals"
  AS PERMISSIVE FOR SELECT TO public
  USING ((is_org_member(org_id)) OR ((EXISTS ( SELECT 1
   FROM proposal_share_links s
  WHERE ((s.proposal_id = proposals.id) AND (s.revoked_at IS NULL) AND ((s.expires_at IS NULL) OR (s.expires_at > now())))))));

DROP POLICY IF EXISTS "punch_lists_select" ON public."punch_lists";
DROP POLICY IF EXISTS "punch_lists_write__select" ON public."punch_lists";
CREATE POLICY "punch_lists_select_consolidated" ON public."punch_lists"
  AS PERMISSIVE FOR SELECT TO public
  USING ((is_org_member(org_id)) OR (has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));

DROP POLICY IF EXISTS "rate_card_items_admin__select" ON public."rate_card_items";
DROP POLICY IF EXISTS "rate_card_items_select" ON public."rate_card_items";
CREATE POLICY "rate_card_items_select_consolidated" ON public."rate_card_items"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])) OR (is_org_member(org_id)));

DROP POLICY IF EXISTS "rate_limit_overrides_read" ON public."rate_limit_overrides";
DROP POLICY IF EXISTS "rate_limit_overrides_write__select" ON public."rate_limit_overrides";
CREATE POLICY "rate_limit_overrides_select_consolidated" ON public."rate_limit_overrides"
  AS PERMISSIVE FOR SELECT TO public
  USING ((is_org_member(org_id)) OR (has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));

DROP POLICY IF EXISTS "rfq_resp_lines_select" ON public."rfq_response_lines";
DROP POLICY IF EXISTS "rfq_resp_lines_write__select" ON public."rfq_response_lines";
CREATE POLICY "rfq_response_lines_select_consolidated" ON public."rfq_response_lines"
  AS PERMISSIVE FOR SELECT TO public
  USING ((is_org_member(org_id)) OR (has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text])));

DROP POLICY IF EXISTS "rfqs_org_modify__select" ON public."rfqs";
DROP POLICY IF EXISTS "rfqs_org_select" ON public."rfqs";
CREATE POLICY "rfqs_select_consolidated" ON public."rfqs"
  AS PERMISSIVE FOR SELECT TO public
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])) OR (is_org_member(org_id)));

DROP POLICY IF EXISTS "briefing_att_select" ON public."safety_briefing_attendees";
DROP POLICY IF EXISTS "briefing_att_write__select" ON public."safety_briefing_attendees";
CREATE POLICY "safety_briefing_attendees_select_consolidated" ON public."safety_briefing_attendees"
  AS PERMISSIVE FOR SELECT TO public
  USING ((is_org_member(org_id)));

DROP POLICY IF EXISTS "shifts_admin__select" ON public."shifts";
DROP POLICY IF EXISTS "shifts_select" ON public."shifts";
CREATE POLICY "shifts_select_consolidated" ON public."shifts"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])) OR ((is_org_member(org_id) OR (EXISTS ( SELECT 1
   FROM workforce_members wm
  WHERE ((wm.id = shifts.workforce_member_id) AND (wm.user_id = (select auth.uid()))))))));

DROP POLICY IF EXISTS "site_plan_pins_select" ON public."site_plan_pins";
DROP POLICY IF EXISTS "site_plan_pins_write__select" ON public."site_plan_pins";
CREATE POLICY "site_plan_pins_select_consolidated" ON public."site_plan_pins"
  AS PERMISSIVE FOR SELECT TO public
  USING ((is_org_member(org_id)) OR (has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'crew'::text])));

DROP POLICY IF EXISTS "site_plan_rev_select" ON public."site_plan_revisions";
DROP POLICY IF EXISTS "site_plan_rev_write__select" ON public."site_plan_revisions";
CREATE POLICY "site_plan_revisions_select_consolidated" ON public."site_plan_revisions"
  AS PERMISSIVE FOR SELECT TO public
  USING ((is_org_member(org_id)) OR (has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));

DROP POLICY IF EXISTS "sponsor_entitlements_admin__select" ON public."sponsor_entitlements";
DROP POLICY IF EXISTS "sponsor_entitlements_select" ON public."sponsor_entitlements";
CREATE POLICY "sponsor_entitlements_select_consolidated" ON public."sponsor_entitlements"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])) OR (is_org_member(org_id)));

DROP POLICY IF EXISTS "submittal_rev_select" ON public."submittal_revisions";
DROP POLICY IF EXISTS "submittal_rev_write__select" ON public."submittal_revisions";
CREATE POLICY "submittal_revisions_select_consolidated" ON public."submittal_revisions"
  AS PERMISSIVE FOR SELECT TO public
  USING ((is_org_member(org_id)) OR (has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text])));

DROP POLICY IF EXISTS "ticket_types_admin__select" ON public."ticket_types";
DROP POLICY IF EXISTS "ticket_types_select" ON public."ticket_types";
CREATE POLICY "ticket_types_select_consolidated" ON public."ticket_types"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])) OR (is_org_member(org_id)));

DROP POLICY IF EXISTS "vp_ans_select" ON public."vendor_prequalification_answers";
DROP POLICY IF EXISTS "vp_ans_write__select" ON public."vendor_prequalification_answers";
CREATE POLICY "vendor_prequalification_answers_select_consolidated" ON public."vendor_prequalification_answers"
  AS PERMISSIVE FOR SELECT TO public
  USING ((is_org_member(org_id)) OR (has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text, 'contractor'::text])));

DROP POLICY IF EXISTS "wob_inv_select" ON public."work_order_broadcast_invites";
DROP POLICY IF EXISTS "wob_inv_write__select" ON public."work_order_broadcast_invites";
CREATE POLICY "work_order_broadcast_invites_select_consolidated" ON public."work_order_broadcast_invites"
  AS PERMISSIVE FOR SELECT TO public
  USING ((is_org_member(org_id)));

DROP POLICY IF EXISTS "workforce_members_admin__select" ON public."workforce_members";
DROP POLICY IF EXISTS "workforce_members_select" ON public."workforce_members";
CREATE POLICY "workforce_members_select_consolidated" ON public."workforce_members"
  AS PERMISSIVE FOR SELECT TO authenticated
  USING ((has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])) OR ((is_org_member(org_id) OR (user_id = (select auth.uid())))));

DROP POLICY IF EXISTS "xpms_atom_tiers_select" ON public."xpms_atom_tiers";
DROP POLICY IF EXISTS "xpms_atom_tiers_write__select" ON public."xpms_atom_tiers";
CREATE POLICY "xpms_atom_tiers_select_consolidated" ON public."xpms_atom_tiers"
  AS PERMISSIVE FOR SELECT TO public
  USING (((EXISTS ( SELECT 1
   FROM xpms_atoms a
  WHERE ((a.id = xpms_atom_tiers.atom_id) AND is_org_member(a.org_id))))) OR ((EXISTS ( SELECT 1
   FROM xpms_atoms a
  WHERE ((a.id = xpms_atom_tiers.atom_id) AND has_org_role(a.org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text]))))));

DROP POLICY IF EXISTS "xpms_atoms_select" ON public."xpms_atoms";
DROP POLICY IF EXISTS "xpms_atoms_write__select" ON public."xpms_atoms";
CREATE POLICY "xpms_atoms_select_consolidated" ON public."xpms_atoms"
  AS PERMISSIVE FOR SELECT TO public
  USING ((is_org_member(org_id)) OR (has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));

DROP POLICY IF EXISTS "xpms_composition_select" ON public."xpms_project_composition";
DROP POLICY IF EXISTS "xpms_composition_write__select" ON public."xpms_project_composition";
CREATE POLICY "xpms_project_composition_select_consolidated" ON public."xpms_project_composition"
  AS PERMISSIVE FOR SELECT TO public
  USING (((EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = xpms_project_composition.project_id) AND is_org_member(p.org_id))))) OR ((EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = xpms_project_composition.project_id) AND has_org_role(p.org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text]))))));

DROP POLICY IF EXISTS "xpms_edges_select" ON public."xpms_provenance_edges";
DROP POLICY IF EXISTS "xpms_edges_write__select" ON public."xpms_provenance_edges";
CREATE POLICY "xpms_provenance_edges_select_consolidated" ON public."xpms_provenance_edges"
  AS PERMISSIVE FOR SELECT TO public
  USING ((is_org_member(org_id)) OR (has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));

DROP POLICY IF EXISTS "xpms_variance_select" ON public."xpms_variance_ledger";
DROP POLICY IF EXISTS "xpms_variance_write__select" ON public."xpms_variance_ledger";
CREATE POLICY "xpms_variance_ledger_select_consolidated" ON public."xpms_variance_ledger"
  AS PERMISSIVE FOR SELECT TO public
  USING ((is_org_member(org_id)) OR (has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text, 'collaborator'::text])));

-- =====================================================================
-- SECTION C — duplicate_index (1)
-- =====================================================================

DROP INDEX IF EXISTS public.idx_budgets_project_id;

-- =====================================================================
-- SECTION D — unused_index drops (316)
-- =====================================================================

DROP INDEX IF EXISTS public."idx_orgs_stripe_customer";
DROP INDEX IF EXISTS public."idx_service_requests_assigned";
DROP INDEX IF EXISTS public."idx_service_requests_response_breach";
DROP INDEX IF EXISTS public."idx_service_requests_resolution_breach";
DROP INDEX IF EXISTS public."proposals_org_idx";
DROP INDEX IF EXISTS public."invoice_line_items_invoice_idx";
DROP INDEX IF EXISTS public."credentials_crew_idx";
DROP INDEX IF EXISTS public."ai_conversations_user_idx";
DROP INDEX IF EXISTS public."ai_messages_conversation_idx";
DROP INDEX IF EXISTS public."deliverable_templates_org_type_idx";
DROP INDEX IF EXISTS public."stage_plots_project_idx";
DROP INDEX IF EXISTS public."incidents_project_idx";
DROP INDEX IF EXISTS public."webhook_deliveries_claim_idx";
DROP INDEX IF EXISTS public."webhook_deliveries_endpoint_idx";
DROP INDEX IF EXISTS public."guide_comments_parent_idx";
DROP INDEX IF EXISTS public."memberships_deleted_idx";
DROP INDEX IF EXISTS public."deliverables_type_idx";
DROP INDEX IF EXISTS public."deliverables_status_idx";
DROP INDEX IF EXISTS public."deliverables_deadline_idx";
DROP INDEX IF EXISTS public."deliverable_comments_idx";
DROP INDEX IF EXISTS public."deliverable_history_idx";
DROP INDEX IF EXISTS public."users_deleted_idx";
DROP INDEX IF EXISTS public."webauthn_challenges_lookup";
DROP INDEX IF EXISTS public."webauthn_challenges_email_lookup";
DROP INDEX IF EXISTS public."invites_token_idx";
DROP INDEX IF EXISTS public."invites_email_idx";
DROP INDEX IF EXISTS public."idempotency_keys_expires_idx";
DROP INDEX IF EXISTS public."idempotency_keys_user_idx";
DROP INDEX IF EXISTS public."proposal_signatures_proposal_idx";
DROP INDEX IF EXISTS public."proposal_versions_proposal_idx";
DROP INDEX IF EXISTS public."proposal_events_proposal_idx";
DROP INDEX IF EXISTS public."access_scans_venue_idx";
DROP INDEX IF EXISTS public."access_scans_accred_idx";
DROP INDEX IF EXISTS public."job_queue_claim_idx";
DROP INDEX IF EXISTS public."job_queue_org_state_idx";
DROP INDEX IF EXISTS public."job_queue_state_dead_idx";
DROP INDEX IF EXISTS public."access_scans_zone_idx";
DROP INDEX IF EXISTS public."accreditation_changes_accred_idx";
DROP INDEX IF EXISTS public."ad_manifests_delegation_idx";
DROP INDEX IF EXISTS public."delegation_entries_delegation_idx";
DROP INDEX IF EXISTS public."dispatch_runs_destination_idx";
DROP INDEX IF EXISTS public."dispatch_runs_origin_idx";
DROP INDEX IF EXISTS public."environmental_events_venue_idx";
DROP INDEX IF EXISTS public."usage_events_org_metric_time_idx";
DROP INDEX IF EXISTS public."usage_events_occurred_at_idx";
DROP INDEX IF EXISTS public."shifts_member_idx";
DROP INDEX IF EXISTS public."audit_log_target_idx";
DROP INDEX IF EXISTS public."idx_leads_assigned_to";
DROP INDEX IF EXISTS public."idx_proposals_project_id";
DROP INDEX IF EXISTS public."idx_proposals_client_id";
DROP INDEX IF EXISTS public."idx_proposals_created_by";
DROP INDEX IF EXISTS public."idx_expenses_project_id";
DROP INDEX IF EXISTS public."idx_expenses_submitter_id";
DROP INDEX IF EXISTS public."idx_budgets_project_id";
DROP INDEX IF EXISTS public."idx_time_entries_project_id";
DROP INDEX IF EXISTS public."idx_mileage_logs_user_id";
DROP INDEX IF EXISTS public."idx_requisitions_requester_id";
DROP INDEX IF EXISTS public."idx_purchase_orders_requisition_id";
DROP INDEX IF EXISTS public."idx_rentals_equipment_id";
DROP INDEX IF EXISTS public."idx_tasks_created_by";
DROP INDEX IF EXISTS public."idx_crew_members_user_id";
DROP INDEX IF EXISTS public."idx_deliverables_org_id";
DROP INDEX IF EXISTS public."idx_deliverables_reviewed_by";
DROP INDEX IF EXISTS public."idx_deliverable_comments_user_id";
DROP INDEX IF EXISTS public."idx_deliverable_history_changed_by";
DROP INDEX IF EXISTS public."idx_event_guides_created_by";
DROP INDEX IF EXISTS public."idx_proposal_share_links_created_by";
DROP INDEX IF EXISTS public."idx_proposal_versions_changed_by";
DROP INDEX IF EXISTS public."idx_projects_created_by";
DROP INDEX IF EXISTS public."idx_tickets_scanned_by";
DROP INDEX IF EXISTS public."idx_ticket_scans_scanner_id";
DROP INDEX IF EXISTS public."tickets_status_idx";
DROP INDEX IF EXISTS public."projects_org_idx";
DROP INDEX IF EXISTS public."projects_status_idx";
DROP INDEX IF EXISTS public."ticket_scans_ticket_idx";
DROP INDEX IF EXISTS public."medical_encounters_venue_idx";
DROP INDEX IF EXISTS public."rate_card_orders_delegation_idx";
DROP INDEX IF EXISTS public."export_runs_created_at_idx";
DROP INDEX IF EXISTS public."rosters_venue_idx";
DROP INDEX IF EXISTS public."shifts_roster_idx";
DROP INDEX IF EXISTS public."shifts_zone_idx";
DROP INDEX IF EXISTS public."venue_certifications_venue_idx";
DROP INDEX IF EXISTS public."venue_zones_parent_idx";
DROP INDEX IF EXISTS public."visa_cases_delegation_idx";
DROP INDEX IF EXISTS public."workforce_deployments_venue_idx";
DROP INDEX IF EXISTS public."workforce_deployments_zone_idx";
DROP INDEX IF EXISTS public."workforce_members_venue_idx";
DROP INDEX IF EXISTS public."idx_api_keys_org";
DROP INDEX IF EXISTS public."idx_asset_links_credential";
DROP INDEX IF EXISTS public."idx_cues_org_status";
DROP INDEX IF EXISTS public."idx_rfqs_org_status";
DROP INDEX IF EXISTS public."proposal_phase_states_org_idx";
DROP INDEX IF EXISTS public."proposal_gate_items_phase_idx";
DROP INDEX IF EXISTS public."proposal_change_orders_state_idx";
DROP INDEX IF EXISTS public."proposal_revision_rounds_target_idx";
DROP INDEX IF EXISTS public."proposal_revisions_round_idx";
DROP INDEX IF EXISTS public."proposal_approvals_state_idx";
DROP INDEX IF EXISTS public."proposal_files_category_idx";
DROP INDEX IF EXISTS public."idx_service_sla_policies_org";
DROP INDEX IF EXISTS public."idx_service_requests_project";
DROP INDEX IF EXISTS public."idx_service_requests_venue";
DROP INDEX IF EXISTS public."idx_service_request_events_request";
DROP INDEX IF EXISTS public."idx_maint_sched_org_active";
DROP INDEX IF EXISTS public."idx_maint_sched_next";
DROP INDEX IF EXISTS public."idx_maint_jobs_schedule";
DROP INDEX IF EXISTS public."idx_guard_tours_org_status";
DROP INDEX IF EXISTS public."idx_itil_changes_org_status";
DROP INDEX IF EXISTS public."idx_campaigns_org_status";
DROP INDEX IF EXISTS public."idx_itil_problems_org_status";
DROP INDEX IF EXISTS public."offer_letters_org_idx";
DROP INDEX IF EXISTS public."offer_letters_role_idx";
DROP INDEX IF EXISTS public."idx_conversations_org";
DROP INDEX IF EXISTS public."idx_daily_logs_project_date";
DROP INDEX IF EXISTS public."idx_rfis_project_status";
DROP INDEX IF EXISTS public."idx_punch_lists_project";
DROP INDEX IF EXISTS public."idx_budgets_project";
DROP INDEX IF EXISTS public."expenses_atom_idx";
DROP INDEX IF EXISTS public."po_line_items_xtc_idx";
DROP INDEX IF EXISTS public."po_line_items_atom_idx";
DROP INDEX IF EXISTS public."idx_rfq_responses_req";
DROP INDEX IF EXISTS public."invoice_line_items_xtc_idx";
DROP INDEX IF EXISTS public."invoice_line_items_atom_idx";
DROP INDEX IF EXISTS public."budgets_xtc_idx";
DROP INDEX IF EXISTS public."idx_incidents_osha_recordable";
DROP INDEX IF EXISTS public."idx_briefing_attendees_briefing";
DROP INDEX IF EXISTS public."idx_project_photos_project_taken";
DROP INDEX IF EXISTS public."idx_project_photos_album";
DROP INDEX IF EXISTS public."idx_guide_comments_org_id";
DROP INDEX IF EXISTS public."idx_time_entries_cost_code";
DROP INDEX IF EXISTS public."idx_idempotency_keys_org_id";
DROP INDEX IF EXISTS public."idx_venue_design_specs_venue";
DROP INDEX IF EXISTS public."idx_governance_policies_owner_user_id";
DROP INDEX IF EXISTS public."idx_guard_tours_guard_id";
DROP INDEX IF EXISTS public."idx_venue_build_log_venue_date";
DROP INDEX IF EXISTS public."idx_guard_tours_venue_id";
DROP INDEX IF EXISTS public."idx_guide_comments_author_user_id";
DROP INDEX IF EXISTS public."idx_inspection_items_org_id";
DROP INDEX IF EXISTS public."idx_inspection_items_template_item_id";
DROP INDEX IF EXISTS public."idx_inspection_template_items_org_id";
DROP INDEX IF EXISTS public."idx_inspection_templates_created_by";
DROP INDEX IF EXISTS public."idx_inspections_inspector_id";
DROP INDEX IF EXISTS public."idx_venue_vop_venue";
DROP INDEX IF EXISTS public."idx_case_studies_published";
DROP INDEX IF EXISTS public."idx_venue_handover_venue";
DROP INDEX IF EXISTS public."idx_inspections_signed_by";
DROP INDEX IF EXISTS public."idx_venue_closeout_venue";
DROP INDEX IF EXISTS public."idx_inspections_template_id";
DROP INDEX IF EXISTS public."idx_invites_accepted_by";
DROP INDEX IF EXISTS public."idx_invites_invited_by";
DROP INDEX IF EXISTS public."idx_itil_changes_assigned_to";
DROP INDEX IF EXISTS public."idx_itil_changes_requested_by";
DROP INDEX IF EXISTS public."idx_itil_changes_service_request_id";
DROP INDEX IF EXISTS public."idx_itil_problems_assigned_to";
DROP INDEX IF EXISTS public."idx_itil_problems_linked_change_id";
DROP INDEX IF EXISTS public."xtc_codes_section_idx";
DROP INDEX IF EXISTS public."xpms_atoms_org_idx";
DROP INDEX IF EXISTS public."xpms_atoms_project_idx";
DROP INDEX IF EXISTS public."xpms_atoms_xtc_idx";
DROP INDEX IF EXISTS public."xpms_atoms_phase_idx";
DROP INDEX IF EXISTS public."xpms_atoms_state_idx";
DROP INDEX IF EXISTS public."xpms_atoms_uac_origin_idx";
DROP INDEX IF EXISTS public."xpms_atoms_tags_gin";
DROP INDEX IF EXISTS public."xpms_atoms_payload_gin";
DROP INDEX IF EXISTS public."xpms_atom_tiers_tier_idx";
DROP INDEX IF EXISTS public."xpms_variance_org_idx";
DROP INDEX IF EXISTS public."xpms_variance_uac_idx";
DROP INDEX IF EXISTS public."xpms_variance_tpc_idx";
DROP INDEX IF EXISTS public."xpms_variance_reason_idx";
DROP INDEX IF EXISTS public."xpms_edges_org_idx";
DROP INDEX IF EXISTS public."xpms_edges_from_idx";
DROP INDEX IF EXISTS public."xpms_edges_to_idx";
DROP INDEX IF EXISTS public."xpms_edges_kind_idx";
DROP INDEX IF EXISTS public."projects_xpms_phase_idx";
DROP INDEX IF EXISTS public."xpms_composition_tier_idx";
DROP INDEX IF EXISTS public."time_entries_xtc_idx";
DROP INDEX IF EXISTS public."time_entries_atom_idx";
DROP INDEX IF EXISTS public."expenses_xtc_idx";
DROP INDEX IF EXISTS public."idx_daily_log_deliveries_org_id";
DROP INDEX IF EXISTS public."idx_daily_log_deliveries_received_by";
DROP INDEX IF EXISTS public."crew_members_atom_idx";
DROP INDEX IF EXISTS public."equipment_atom_idx";
DROP INDEX IF EXISTS public."fabrication_orders_atom_idx";
DROP INDEX IF EXISTS public."rentals_atom_idx";
DROP INDEX IF EXISTS public."tasks_atom_idx";
DROP INDEX IF EXISTS public."xpms_atoms_created_by_idx";
DROP INDEX IF EXISTS public."xpms_atoms_owner_user_id_idx";
DROP INDEX IF EXISTS public."xpms_atoms_lineage_root_id_idx";
DROP INDEX IF EXISTS public."xpms_atoms_division_code_idx";
DROP INDEX IF EXISTS public."xpms_atoms_section_code_idx";
DROP INDEX IF EXISTS public."xpms_provenance_edges_created_by_idx";
DROP INDEX IF EXISTS public."xpms_variance_ledger_recorded_by_idx";
DROP INDEX IF EXISTS public."cost_codes_xtc_code_idx";
DROP INDEX IF EXISTS public."crew_members_xtc_code_idx";
DROP INDEX IF EXISTS public."equipment_xtc_code_idx";
DROP INDEX IF EXISTS public."fabrication_orders_xtc_code_idx";
DROP INDEX IF EXISTS public."idx_automations_created_by";
DROP INDEX IF EXISTS public."idx_campaigns_owner_id";
DROP INDEX IF EXISTS public."idx_conversation_messages_author_id";
DROP INDEX IF EXISTS public."idx_conversation_messages_org_id";
DROP INDEX IF EXISTS public."idx_cues_created_by";
DROP INDEX IF EXISTS public."idx_cues_event_id";
DROP INDEX IF EXISTS public."idx_cues_owner_id";
DROP INDEX IF EXISTS public."idx_daily_log_deliveries_vendor_id";
DROP INDEX IF EXISTS public."idx_daily_log_equipment_equipment_id";
DROP INDEX IF EXISTS public."idx_daily_log_equipment_org_id";
DROP INDEX IF EXISTS public."idx_daily_log_manpower_org_id";
DROP INDEX IF EXISTS public."idx_daily_log_manpower_vendor_id";
DROP INDEX IF EXISTS public."idx_daily_log_photos_org_id";
DROP INDEX IF EXISTS public."idx_daily_log_photos_taken_by";
DROP INDEX IF EXISTS public."idx_daily_log_visitors_org_id";
DROP INDEX IF EXISTS public."idx_daily_logs_approved_by";
DROP INDEX IF EXISTS public."idx_daily_logs_submitted_by";
DROP INDEX IF EXISTS public."idx_form_defs_created_by";
DROP INDEX IF EXISTS public."idx_governance_committees_chair_user_id";
DROP INDEX IF EXISTS public."idx_itil_problems_linked_incident_id";
DROP INDEX IF EXISTS public."idx_itil_problems_reporter_id";
DROP INDEX IF EXISTS public."idx_maintenance_jobs_completed_by";
DROP INDEX IF EXISTS public."idx_maintenance_schedules_owner_id";
DROP INDEX IF EXISTS public."idx_offer_letter_activity_actor_user_id";
DROP INDEX IF EXISTS public."idx_offer_letter_activity_org_id";
DROP INDEX IF EXISTS public."idx_offer_letters_created_by";
DROP INDEX IF EXISTS public."idx_offer_letters_per_diem_rate_card_item_id";
DROP INDEX IF EXISTS public."idx_offer_letters_rate_card_item_id";
DROP INDEX IF EXISTS public."idx_offer_letters_reports_to_crew_member_id";
DROP INDEX IF EXISTS public."idx_offer_letters_venue_id";
DROP INDEX IF EXISTS public."idx_org_offer_letter_settings_signing_authority";
DROP INDEX IF EXISTS public."idx_payment_application_lines_org_id";
DROP INDEX IF EXISTS public."idx_payment_application_lines_po_line_item_id";
DROP INDEX IF EXISTS public."idx_payment_applications_approved_by";
DROP INDEX IF EXISTS public."idx_payment_applications_project_id";
DROP INDEX IF EXISTS public."idx_payment_applications_vendor_id";
DROP INDEX IF EXISTS public."idx_playbooks_owner_id";
DROP INDEX IF EXISTS public."idx_po_change_order_lines_org_id";
DROP INDEX IF EXISTS public."idx_po_change_order_lines_po_change_order_id";
DROP INDEX IF EXISTS public."idx_po_change_orders_approved_by";
DROP INDEX IF EXISTS public."idx_po_checklist_items_completed_by";
DROP INDEX IF EXISTS public."idx_po_checklist_items_org_id";
DROP INDEX IF EXISTS public."idx_prequalification_questions_org_id";
DROP INDEX IF EXISTS public."idx_project_photos_location_id";
DROP INDEX IF EXISTS public."idx_project_photos_org_id";
DROP INDEX IF EXISTS public."idx_project_photos_taken_by";
DROP INDEX IF EXISTS public."idx_projects_primary_venue_id";
DROP INDEX IF EXISTS public."idx_proposal_activity_actor_id";
DROP INDEX IF EXISTS public."idx_proposal_activity_org_id";
DROP INDEX IF EXISTS public."idx_proposal_approvals_org_id";
DROP INDEX IF EXISTS public."idx_proposal_approvals_signed_by";
DROP INDEX IF EXISTS public."idx_proposal_change_orders_decided_by";
DROP INDEX IF EXISTS public."idx_proposal_change_orders_org_id";
DROP INDEX IF EXISTS public."idx_proposal_change_orders_requested_by";
DROP INDEX IF EXISTS public."idx_proposal_files_org_id";
DROP INDEX IF EXISTS public."idx_proposal_files_uploaded_by";
DROP INDEX IF EXISTS public."idx_proposal_gate_items_done_by";
DROP INDEX IF EXISTS public."idx_proposal_gate_items_org_id";
DROP INDEX IF EXISTS public."idx_proposal_phase_states_approved_by";
DROP INDEX IF EXISTS public."idx_proposal_revision_rounds_created_by";
DROP INDEX IF EXISTS public."idx_proposal_revision_rounds_decided_by";
DROP INDEX IF EXISTS public."idx_proposal_revision_rounds_org_id";
DROP INDEX IF EXISTS public."idx_proposal_revisions_created_by";
DROP INDEX IF EXISTS public."idx_proposal_revisions_org_id";
DROP INDEX IF EXISTS public."idx_proposal_revisions_proposal_id";
DROP INDEX IF EXISTS public."idx_punch_items_closed_by";
DROP INDEX IF EXISTS public."idx_punch_items_punch_list_id";
DROP INDEX IF EXISTS public."idx_punch_items_site_plan_id";
DROP INDEX IF EXISTS public."idx_punch_items_vendor_id";
DROP INDEX IF EXISTS public."idx_punch_lists_org_id";
DROP INDEX IF EXISTS public."idx_rfis_answered_by";
DROP INDEX IF EXISTS public."idx_rfis_asked_by";
DROP INDEX IF EXISTS public."idx_rfis_linked_deliverable_id";
DROP INDEX IF EXISTS public."idx_rfis_linked_po_id";
DROP INDEX IF EXISTS public."idx_rfis_linked_site_plan_id";
DROP INDEX IF EXISTS public."idx_rfq_response_lines_org_id";
DROP INDEX IF EXISTS public."idx_rfq_response_lines_rfq_response_id";
DROP INDEX IF EXISTS public."idx_rfq_responses_awarded_by";
DROP INDEX IF EXISTS public."idx_rfq_responses_vendor_id";
DROP INDEX IF EXISTS public."idx_rfqs_awarded_to_vendor_id";
DROP INDEX IF EXISTS public."idx_rfqs_created_by";
DROP INDEX IF EXISTS public."idx_rfqs_project_id";
DROP INDEX IF EXISTS public."idx_safety_briefing_attendees_crew_member_id";
DROP INDEX IF EXISTS public."idx_safety_briefing_attendees_org_id";
DROP INDEX IF EXISTS public."idx_safety_briefings_briefer_id";
DROP INDEX IF EXISTS public."idx_safety_briefings_org_id";
DROP INDEX IF EXISTS public."idx_safety_briefings_shift_id";
DROP INDEX IF EXISTS public."idx_service_request_events_actor_id";
DROP INDEX IF EXISTS public."idx_service_request_events_org_id";
DROP INDEX IF EXISTS public."idx_service_requests_requester_id";
DROP INDEX IF EXISTS public."idx_service_requests_zone_id";
DROP INDEX IF EXISTS public."idx_site_plan_pins_org_id";
DROP INDEX IF EXISTS public."idx_site_plan_revisions_org_id";
DROP INDEX IF EXISTS public."idx_site_plan_revisions_uploaded_by";
DROP INDEX IF EXISTS public."idx_site_plans_current_revision_id";
DROP INDEX IF EXISTS public."idx_site_plans_venue_id";
DROP INDEX IF EXISTS public."idx_submittal_revisions_org_id";
DROP INDEX IF EXISTS public."idx_submittal_revisions_stamped_by";
DROP INDEX IF EXISTS public."idx_submittal_revisions_submitted_by";
DROP INDEX IF EXISTS public."idx_submittals_ball_in_court_id";
DROP INDEX IF EXISTS public."idx_submittals_vendor_id";
DROP INDEX IF EXISTS public."idx_threats_owner_id";
DROP INDEX IF EXISTS public."idx_user_preferences_last_org_id";
DROP INDEX IF EXISTS public."idx_vendor_prequalification_answers_org_id";
DROP INDEX IF EXISTS public."idx_vendor_prequalification_answers_question_id";
DROP INDEX IF EXISTS public."idx_vendor_prequalifications_approved_by";
DROP INDEX IF EXISTS public."idx_vendor_prequalifications_questionnaire_id";
DROP INDEX IF EXISTS public."idx_venue_closeout_items_assignee_id";
DROP INDEX IF EXISTS public."idx_venue_closeout_items_org_id";
DROP INDEX IF EXISTS public."idx_venue_design_specs_bom_requisition_id";
DROP INDEX IF EXISTS public."idx_venue_design_specs_org_id";
DROP INDEX IF EXISTS public."idx_venue_handover_items_assignee_id";
DROP INDEX IF EXISTS public."idx_venue_handover_items_org_id";
DROP INDEX IF EXISTS public."idx_venue_vop_sections_approved_by";
DROP INDEX IF EXISTS public."idx_webhook_deliveries_org_id";
DROP INDEX IF EXISTS public."idx_webhook_endpoints_created_by";
DROP INDEX IF EXISTS public."idx_work_order_broadcast_invites_org_id";
DROP INDEX IF EXISTS public."idx_work_order_broadcast_invites_vendor_id";
DROP INDEX IF EXISTS public."idx_work_order_broadcasts_awarded_by";
DROP INDEX IF EXISTS public."idx_work_order_broadcasts_awarded_to_vendor_id";
DROP INDEX IF EXISTS public."idx_work_order_broadcasts_requisition_id";

COMMIT;
