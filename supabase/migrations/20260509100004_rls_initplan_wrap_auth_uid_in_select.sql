-- Sweep 16 — wrap bare auth.uid()/role()/jwt()/email() in (SELECT ...) so
-- PostgreSQL caches the per-query value instead of re-evaluating per row.
-- Per Supabase advisor lint 'auth_rls_initplan'. 54 policies rewritten
-- across 35+ tables. Big perf improvement on multi-row reads.

-- Bulk fix: wrap bare auth.uid()/role()/jwt()/email() in (SELECT ...)
-- Per Supabase advisor lint 'auth_rls_initplan' — caches per-row eval to per-query.
-- 54 policies rewritten.

-- annotation_watchers.annotation_watchers_delete
DROP POLICY IF EXISTS annotation_watchers_delete ON public.annotation_watchers;
CREATE POLICY annotation_watchers_delete ON public.annotation_watchers FOR DELETE TO authenticated USING (((user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM annotations a
  WHERE ((a.id = annotation_watchers.annotation_id) AND private.has_org_role(a.org_id, ARRAY['owner'::text, 'admin'::text]))))));

-- annotations.annotations_update
DROP POLICY IF EXISTS annotations_update ON public.annotations;
CREATE POLICY annotations_update ON public.annotations FOR UPDATE TO authenticated USING ((private.is_org_member(org_id) AND ((created_by = (SELECT auth.uid())) OR (assigned_to = (SELECT auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text])))) WITH CHECK (private.is_org_member(org_id));

-- approval_decisions.uas_dec_decider
DROP POLICY IF EXISTS uas_dec_decider ON public.approval_decisions;
CREATE POLICY uas_dec_decider ON public.approval_decisions FOR INSERT TO public WITH CHECK ((decider_party_id IN ( SELECT parties.id
   FROM parties
  WHERE (parties.auth_user_id = (SELECT auth.uid())))));

-- approval_delegations.uas_del_self
DROP POLICY IF EXISTS uas_del_self ON public.approval_delegations;
CREATE POLICY uas_del_self ON public.approval_delegations FOR ALL TO public USING (((delegator_party_id IN ( SELECT parties.id
   FROM parties
  WHERE (parties.auth_user_id = (SELECT auth.uid())))) OR private.is_org_admin(org_id))) WITH CHECK (((delegator_party_id IN ( SELECT parties.id
   FROM parties
  WHERE (parties.auth_user_id = (SELECT auth.uid())))) OR private.is_org_admin(org_id)));

-- availability_slots.availability_slots_self_rw
DROP POLICY IF EXISTS availability_slots_self_rw ON public.availability_slots;
CREATE POLICY availability_slots_self_rw ON public.availability_slots FOR ALL TO authenticated USING ((user_id = (SELECT auth.uid()))) WITH CHECK ((user_id = (SELECT auth.uid())));

-- availability_windows.ucs_aw_party
DROP POLICY IF EXISTS ucs_aw_party ON public.availability_windows;
CREATE POLICY ucs_aw_party ON public.availability_windows FOR ALL TO public USING (((party_id IN ( SELECT parties.id
   FROM parties
  WHERE (parties.auth_user_id = (SELECT auth.uid())))) OR (EXISTS ( SELECT 1
   FROM parties p
  WHERE ((p.id = availability_windows.party_id) AND private.is_org_member(p.org_id)))))) WITH CHECK (((party_id IN ( SELECT parties.id
   FROM parties
  WHERE (parties.auth_user_id = (SELECT auth.uid())))) OR (EXISTS ( SELECT 1
   FROM parties p
  WHERE ((p.id = availability_windows.party_id) AND private.is_org_admin(p.org_id))))));

-- config_history.ucf_hist_read
DROP POLICY IF EXISTS ucf_hist_read ON public.config_history;
CREATE POLICY ucf_hist_read ON public.config_history FOR SELECT TO public USING (((scope = 'system'::text) OR ((scope = 'org'::text) AND private.is_org_admin(scope_id)) OR ((scope = 'user'::text) AND (scope_id = (SELECT auth.uid())))));

-- config_values.ucf_values_read
DROP POLICY IF EXISTS ucf_values_read ON public.config_values;
CREATE POLICY ucf_values_read ON public.config_values FOR SELECT TO public USING (((scope = 'system'::text) OR ((scope = 'org'::text) AND private.is_org_member(scope_id)) OR ((scope = 'project'::text) AND private.is_project_member(scope_id)) OR ((scope = 'user'::text) AND (scope_id = (SELECT auth.uid())))));

-- config_values.ucf_values_write
DROP POLICY IF EXISTS ucf_values_write ON public.config_values;
CREATE POLICY ucf_values_write ON public.config_values FOR ALL TO public USING ((((scope = 'org'::text) AND private.is_org_admin(scope_id)) OR ((scope = 'project'::text) AND private.has_project_role(scope_id, ARRAY['owner'::text, 'admin'::text])) OR ((scope = 'user'::text) AND (scope_id = (SELECT auth.uid()))))) WITH CHECK ((((scope = 'org'::text) AND private.is_org_admin(scope_id)) OR ((scope = 'project'::text) AND private.has_project_role(scope_id, ARRAY['owner'::text, 'admin'::text])) OR ((scope = 'user'::text) AND (scope_id = (SELECT auth.uid())))));

-- dashboards.dashboards_delete_own
DROP POLICY IF EXISTS dashboards_delete_own ON public.dashboards;
CREATE POLICY dashboards_delete_own ON public.dashboards FOR DELETE TO public USING ((private.is_org_member(org_id) AND ((created_by = (SELECT auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text]))));

-- dashboards.dashboards_select
DROP POLICY IF EXISTS dashboards_select ON public.dashboards;
CREATE POLICY dashboards_select ON public.dashboards FOR SELECT TO public USING ((private.is_org_member(org_id) AND ((scope = 'org'::view_scope) OR ((scope = 'private'::view_scope) AND (created_by = (SELECT auth.uid()))) OR (scope = 'public'::view_scope))));

-- dashboards.dashboards_update_own
DROP POLICY IF EXISTS dashboards_update_own ON public.dashboards;
CREATE POLICY dashboards_update_own ON public.dashboards FOR UPDATE TO public USING ((private.is_org_member(org_id) AND ((created_by = (SELECT auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text]))));

-- form_drafts.ufs_drafts_self
DROP POLICY IF EXISTS ufs_drafts_self ON public.form_drafts;
CREATE POLICY ufs_drafts_self ON public.form_drafts FOR ALL TO public USING ((party_id IN ( SELECT parties.id
   FROM parties
  WHERE (parties.auth_user_id = (SELECT auth.uid()))))) WITH CHECK ((party_id IN ( SELECT parties.id
   FROM parties
  WHERE (parties.auth_user_id = (SELECT auth.uid())))));

-- form_submission_values.ufs_val_org
DROP POLICY IF EXISTS ufs_val_org ON public.form_submission_values;
CREATE POLICY ufs_val_org ON public.form_submission_values FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM ufs_form_submissions s
  WHERE ((s.id = form_submission_values.submission_id) AND (private.is_org_member(s.org_id) OR (s.submitter_party_id IN ( SELECT parties.id
           FROM parties
          WHERE (parties.auth_user_id = (SELECT auth.uid()))))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ufs_form_submissions s
  WHERE (s.id = form_submission_values.submission_id))));

-- import_jobs.imp_update_owner
DROP POLICY IF EXISTS imp_update_owner ON public.import_jobs;
CREATE POLICY imp_update_owner ON public.import_jobs FOR UPDATE TO public USING ((private.is_org_member(org_id) AND ((created_by = (SELECT auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text]))));

-- job_applications.job_applications_self_insert
DROP POLICY IF EXISTS job_applications_self_insert ON public.job_applications;
CREATE POLICY job_applications_self_insert ON public.job_applications FOR INSERT TO authenticated WITH CHECK ((applicant_user_id = (SELECT auth.uid())));

-- job_applications.job_applications_self_select
DROP POLICY IF EXISTS job_applications_self_select ON public.job_applications;
CREATE POLICY job_applications_self_select ON public.job_applications FOR SELECT TO authenticated USING ((applicant_user_id = (SELECT auth.uid())));

-- job_applications.job_applications_self_update
DROP POLICY IF EXISTS job_applications_self_update ON public.job_applications;
CREATE POLICY job_applications_self_update ON public.job_applications FOR UPDATE TO authenticated USING ((applicant_user_id = (SELECT auth.uid()))) WITH CHECK ((applicant_user_id = (SELECT auth.uid())));

-- knowledge_subscribers.ukb_sub_self
DROP POLICY IF EXISTS ukb_sub_self ON public.knowledge_subscribers;
CREATE POLICY ukb_sub_self ON public.knowledge_subscribers FOR ALL TO public USING ((party_id IN ( SELECT parties.id
   FROM parties
  WHERE (parties.auth_user_id = (SELECT auth.uid()))))) WITH CHECK ((party_id IN ( SELECT parties.id
   FROM parties
  WHERE (parties.auth_user_id = (SELECT auth.uid())))));

-- message_attachments.ums_att_org
DROP POLICY IF EXISTS ums_att_org ON public.message_attachments;
CREATE POLICY ums_att_org ON public.message_attachments FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM (messages m
     JOIN channel_memberships cm ON ((cm.channel_id = m.channel_id)))
  WHERE ((m.id = message_attachments.message_id) AND (cm.party_id IN ( SELECT parties.id
           FROM parties
          WHERE (parties.auth_user_id = (SELECT auth.uid())))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM (messages m
     JOIN channel_memberships cm ON ((cm.channel_id = m.channel_id)))
  WHERE ((m.id = message_attachments.message_id) AND (cm.party_id IN ( SELECT parties.id
           FROM parties
          WHERE (parties.auth_user_id = (SELECT auth.uid()))))))));

-- message_channels.ums_ch_member
DROP POLICY IF EXISTS ums_ch_member ON public.message_channels;
CREATE POLICY ums_ch_member ON public.message_channels FOR SELECT TO public USING ((private.is_org_admin(org_id) OR (EXISTS ( SELECT 1
   FROM channel_memberships cm
  WHERE ((cm.channel_id = message_channels.id) AND (cm.party_id IN ( SELECT parties.id
           FROM parties
          WHERE (parties.auth_user_id = (SELECT auth.uid())))))))));

-- message_mentions.ums_mn_org
DROP POLICY IF EXISTS ums_mn_org ON public.message_mentions;
CREATE POLICY ums_mn_org ON public.message_mentions FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM (messages m
     JOIN channel_memberships cm ON ((cm.channel_id = m.channel_id)))
  WHERE ((m.id = message_mentions.message_id) AND (cm.party_id IN ( SELECT parties.id
           FROM parties
          WHERE (parties.auth_user_id = (SELECT auth.uid())))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM (messages m
     JOIN channel_memberships cm ON ((cm.channel_id = m.channel_id)))
  WHERE ((m.id = message_mentions.message_id) AND (cm.party_id IN ( SELECT parties.id
           FROM parties
          WHERE (parties.auth_user_id = (SELECT auth.uid()))))))));

-- message_reactions.ums_rx_org
DROP POLICY IF EXISTS ums_rx_org ON public.message_reactions;
CREATE POLICY ums_rx_org ON public.message_reactions FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM (messages m
     JOIN channel_memberships cm ON ((cm.channel_id = m.channel_id)))
  WHERE ((m.id = message_reactions.message_id) AND (cm.party_id IN ( SELECT parties.id
           FROM parties
          WHERE (parties.auth_user_id = (SELECT auth.uid())))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM (messages m
     JOIN channel_memberships cm ON ((cm.channel_id = m.channel_id)))
  WHERE ((m.id = message_reactions.message_id) AND (cm.party_id IN ( SELECT parties.id
           FROM parties
          WHERE (parties.auth_user_id = (SELECT auth.uid()))))))));

-- message_read_receipts.ums_rr_self
DROP POLICY IF EXISTS ums_rr_self ON public.message_read_receipts;
CREATE POLICY ums_rr_self ON public.message_read_receipts FOR ALL TO public USING ((party_id IN ( SELECT parties.id
   FROM parties
  WHERE (parties.auth_user_id = (SELECT auth.uid()))))) WITH CHECK ((party_id IN ( SELECT parties.id
   FROM parties
  WHERE (parties.auth_user_id = (SELECT auth.uid())))));

-- messages.ums_msg_member
DROP POLICY IF EXISTS ums_msg_member ON public.messages;
CREATE POLICY ums_msg_member ON public.messages FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM channel_memberships cm
  WHERE ((cm.channel_id = messages.channel_id) AND (cm.party_id IN ( SELECT parties.id
           FROM parties
          WHERE (parties.auth_user_id = (SELECT auth.uid()))))))));

-- messages.ums_msg_post
DROP POLICY IF EXISTS ums_msg_post ON public.messages;
CREATE POLICY ums_msg_post ON public.messages FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM channel_memberships cm
  WHERE ((cm.channel_id = messages.channel_id) AND (cm.party_id IN ( SELECT parties.id
           FROM parties
          WHERE (parties.auth_user_id = (SELECT auth.uid()))))))));

-- notification_preferences.uns_prefs_self
DROP POLICY IF EXISTS uns_prefs_self ON public.notification_preferences;
CREATE POLICY uns_prefs_self ON public.notification_preferences FOR ALL TO public USING ((user_id = (SELECT auth.uid()))) WITH CHECK ((user_id = (SELECT auth.uid())));

-- open_call_submissions.open_call_submissions_self_insert
DROP POLICY IF EXISTS open_call_submissions_self_insert ON public.open_call_submissions;
CREATE POLICY open_call_submissions_self_insert ON public.open_call_submissions FOR INSERT TO authenticated WITH CHECK ((submitter_user_id = (SELECT auth.uid())));

-- open_call_submissions.open_call_submissions_self_select
DROP POLICY IF EXISTS open_call_submissions_self_select ON public.open_call_submissions;
CREATE POLICY open_call_submissions_self_select ON public.open_call_submissions FOR SELECT TO authenticated USING ((submitter_user_id = (SELECT auth.uid())));

-- project_members.project_members_delete
DROP POLICY IF EXISTS project_members_delete ON public.project_members;
CREATE POLICY project_members_delete ON public.project_members FOR DELETE TO authenticated USING (((user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = project_members.project_id) AND private.is_org_manager_plus(p.org_id))))));

-- project_members.project_members_select
DROP POLICY IF EXISTS project_members_select ON public.project_members;
CREATE POLICY project_members_select ON public.project_members FOR SELECT TO authenticated USING (((user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = project_members.project_id) AND private.is_org_member(p.org_id))))));

-- push_subscriptions.push_subs_self_delete
DROP POLICY IF EXISTS push_subs_self_delete ON public.push_subscriptions;
CREATE POLICY push_subs_self_delete ON public.push_subscriptions FOR DELETE TO public USING ((user_id = (SELECT auth.uid())));

-- push_subscriptions.push_subs_self_insert
DROP POLICY IF EXISTS push_subs_self_insert ON public.push_subscriptions;
CREATE POLICY push_subs_self_insert ON public.push_subscriptions FOR INSERT TO public WITH CHECK ((user_id = (SELECT auth.uid())));

-- push_subscriptions.push_subs_self_select
DROP POLICY IF EXISTS push_subs_self_select ON public.push_subscriptions;
CREATE POLICY push_subs_self_select ON public.push_subscriptions FOR SELECT TO public USING ((user_id = (SELECT auth.uid())));

-- push_subscriptions.push_subs_self_update
DROP POLICY IF EXISTS push_subs_self_update ON public.push_subscriptions;
CREATE POLICY push_subs_self_update ON public.push_subscriptions FOR UPDATE TO public USING ((user_id = (SELECT auth.uid()))) WITH CHECK ((user_id = (SELECT auth.uid())));

-- report_runs.urp_runs_init
DROP POLICY IF EXISTS urp_runs_init ON public.report_runs;
CREATE POLICY urp_runs_init ON public.report_runs FOR INSERT TO public WITH CHECK ((private.is_org_member(org_id) AND (initiated_by = (SELECT auth.uid()))));

-- reviews.reviews_reviewer_self
DROP POLICY IF EXISTS reviews_reviewer_self ON public.reviews;
CREATE POLICY reviews_reviewer_self ON public.reviews FOR ALL TO authenticated USING ((reviewer_user_id = (SELECT auth.uid()))) WITH CHECK ((reviewer_user_id = (SELECT auth.uid())));

-- saved_searches.saved_searches_self_rw
DROP POLICY IF EXISTS saved_searches_self_rw ON public.saved_searches;
CREATE POLICY saved_searches_self_rw ON public.saved_searches FOR ALL TO authenticated USING ((user_id = (SELECT auth.uid()))) WITH CHECK ((user_id = (SELECT auth.uid())));

-- share_links.share_links_revoke
DROP POLICY IF EXISTS share_links_revoke ON public.share_links;
CREATE POLICY share_links_revoke ON public.share_links FOR UPDATE TO public USING ((private.is_org_member(org_id) AND ((created_by = (SELECT auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text]))));

-- slack_user_links.slack_user_self
DROP POLICY IF EXISTS slack_user_self ON public.slack_user_links;
CREATE POLICY slack_user_self ON public.slack_user_links FOR ALL TO public USING ((user_id = (SELECT auth.uid()))) WITH CHECK ((user_id = (SELECT auth.uid())));

-- talent_offers.talent_offers_recipient_select
DROP POLICY IF EXISTS talent_offers_recipient_select ON public.talent_offers;
CREATE POLICY talent_offers_recipient_select ON public.talent_offers FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM talent_profiles tp
  WHERE ((tp.id = talent_offers.talent_profile_id) AND (tp.user_id = (SELECT auth.uid()))))));

-- talent_profiles.talent_profiles_self_select
DROP POLICY IF EXISTS talent_profiles_self_select ON public.talent_profiles;
CREATE POLICY talent_profiles_self_select ON public.talent_profiles FOR SELECT TO authenticated USING ((user_id = (SELECT auth.uid())));

-- talent_profiles.talent_profiles_self_update
DROP POLICY IF EXISTS talent_profiles_self_update ON public.talent_profiles;
CREATE POLICY talent_profiles_self_update ON public.talent_profiles FOR UPDATE TO authenticated USING ((user_id = (SELECT auth.uid()))) WITH CHECK ((user_id = (SELECT auth.uid())));

-- team_members.team_members_admin_write
DROP POLICY IF EXISTS team_members_admin_write ON public.team_members;
CREATE POLICY team_members_admin_write ON public.team_members FOR ALL TO public USING (((team_id IN ( SELECT teams.id
   FROM teams
  WHERE private.has_org_role(teams.org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text]))) OR (EXISTS ( SELECT 1
   FROM team_members tm
  WHERE ((tm.team_id = team_members.team_id) AND (tm.user_id = (SELECT auth.uid())) AND (tm.role = 'admin'::text)))))) WITH CHECK (((team_id IN ( SELECT teams.id
   FROM teams
  WHERE private.has_org_role(teams.org_id, ARRAY['owner'::text, 'admin'::text, 'manager'::text]))) OR (EXISTS ( SELECT 1
   FROM team_members tm
  WHERE ((tm.team_id = team_members.team_id) AND (tm.user_id = (SELECT auth.uid())) AND (tm.role = 'admin'::text))))));

-- timesheets.utt_ts_party
DROP POLICY IF EXISTS utt_ts_party ON public.timesheets;
CREATE POLICY utt_ts_party ON public.timesheets FOR SELECT TO public USING ((private.is_org_admin(org_id) OR (party_id IN ( SELECT parties.id
   FROM parties
  WHERE (parties.auth_user_id = (SELECT auth.uid()))))));

-- timesheets.utt_ts_party_write
DROP POLICY IF EXISTS utt_ts_party_write ON public.timesheets;
CREATE POLICY utt_ts_party_write ON public.timesheets FOR INSERT TO public WITH CHECK ((party_id IN ( SELECT parties.id
   FROM parties
  WHERE (parties.auth_user_id = (SELECT auth.uid())))));

-- timezone_overrides.ulc_tz_self
DROP POLICY IF EXISTS ulc_tz_self ON public.timezone_overrides;
CREATE POLICY ulc_tz_self ON public.timezone_overrides FOR ALL TO public USING ((((scope = 'user'::text) AND (scope_id = (SELECT auth.uid()))) OR ((scope = 'org'::text) AND private.is_org_admin(scope_id)) OR ((scope = 'project'::text) AND private.has_project_role(scope_id, ARRAY['owner'::text, 'admin'::text])))) WITH CHECK ((((scope = 'user'::text) AND (scope_id = (SELECT auth.uid()))) OR ((scope = 'org'::text) AND private.is_org_admin(scope_id)) OR ((scope = 'project'::text) AND private.has_project_role(scope_id, ARRAY['owner'::text, 'admin'::text]))));

-- ufs_form_submissions.ufs_sub_self
DROP POLICY IF EXISTS ufs_sub_self ON public.ufs_form_submissions;
CREATE POLICY ufs_sub_self ON public.ufs_form_submissions FOR ALL TO public USING ((private.is_org_member(org_id) OR (submitter_party_id IN ( SELECT parties.id
   FROM parties
  WHERE (parties.auth_user_id = (SELECT auth.uid())))))) WITH CHECK ((private.is_org_member(org_id) OR (submitter_party_id IN ( SELECT parties.id
   FROM parties
  WHERE (parties.auth_user_id = (SELECT auth.uid()))))));

-- user_profiles.user_profiles_self_rw
DROP POLICY IF EXISTS user_profiles_self_rw ON public.user_profiles;
CREATE POLICY user_profiles_self_rw ON public.user_profiles FOR ALL TO authenticated USING ((user_id = (SELECT auth.uid()))) WITH CHECK ((user_id = (SELECT auth.uid())));

-- usr_saved_searches.usr_saved_self
DROP POLICY IF EXISTS usr_saved_self ON public.usr_saved_searches;
CREATE POLICY usr_saved_self ON public.usr_saved_searches FOR ALL TO public USING ((party_id IN ( SELECT parties.id
   FROM parties
  WHERE (parties.auth_user_id = (SELECT auth.uid()))))) WITH CHECK ((party_id IN ( SELECT parties.id
   FROM parties
  WHERE (parties.auth_user_id = (SELECT auth.uid())))));

-- view_configs.view_configs_delete_own
DROP POLICY IF EXISTS view_configs_delete_own ON public.view_configs;
CREATE POLICY view_configs_delete_own ON public.view_configs FOR DELETE TO public USING ((private.is_org_member(org_id) AND ((created_by = (SELECT auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text]))));

-- view_configs.view_configs_select
DROP POLICY IF EXISTS view_configs_select ON public.view_configs;
CREATE POLICY view_configs_select ON public.view_configs FOR SELECT TO public USING ((private.is_org_member(org_id) AND ((scope = 'org'::view_scope) OR ((scope = 'private'::view_scope) AND (created_by = (SELECT auth.uid()))) OR (scope = 'public'::view_scope))));

-- view_configs.view_configs_update_own
DROP POLICY IF EXISTS view_configs_update_own ON public.view_configs;
CREATE POLICY view_configs_update_own ON public.view_configs FOR UPDATE TO public USING ((private.is_org_member(org_id) AND ((created_by = (SELECT auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])) AND ((is_locked = false) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text]))));

-- wizard_instances.uwz_inst_self
DROP POLICY IF EXISTS uwz_inst_self ON public.wizard_instances;
CREATE POLICY uwz_inst_self ON public.wizard_instances FOR ALL TO public USING ((((org_id IS NOT NULL) AND private.is_org_admin(org_id)) OR (party_id IN ( SELECT parties.id
   FROM parties
  WHERE (parties.auth_user_id = (SELECT auth.uid())))) OR (share_token_id IS NOT NULL))) WITH CHECK (((party_id IN ( SELECT parties.id
   FROM parties
  WHERE (parties.auth_user_id = (SELECT auth.uid())))) OR ((org_id IS NOT NULL) AND private.is_org_admin(org_id)) OR (share_token_id IS NOT NULL)));

