-- Performance advisor remediation (auth_rls_initplan): wrap direct auth.uid()/
-- auth.role()/auth.jwt() calls in a scalar subselect so the planner evaluates
-- them once per query (initplan) instead of once per row. Semantically identical
-- — (select auth.uid()) returns the same value as auth.uid(). Covers the 92
-- fully-unwrapped policies; the 121 already-wrapped policies are untouched.
alter policy activity_select on public.activity using (((actor_id = (select auth.uid())) OR (EXISTS ( SELECT 1
   FROM follow f
  WHERE ((f.followee_id = activity.actor_id) AND (f.follower_id = (select auth.uid())))))));
alter policy activity_write on public.activity using ((actor_id = (select auth.uid()))) with check ((actor_id = (select auth.uid())));
alter policy assessment_attempts_insert on public.assessment_attempts with check ((private.is_org_member(org_id) AND (user_id = (select auth.uid()))));
alter policy assessment_attempts_select on public.assessment_attempts using ((private.is_org_member(org_id) AND ((user_id = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text]))));
alter policy assessment_attempts_update on public.assessment_attempts using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));
alter policy certification_holders_insert on public.certification_holders with check ((private.is_org_member(org_id) AND ((user_id = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text]))));
alter policy certification_holders_select on public.certification_holders using ((private.is_org_member(org_id) AND ((user_id = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text]))));
alter policy certification_recerts_insert on public.certification_recerts with check ((private.is_org_member(org_id) AND (user_id = (select auth.uid()))));
alter policy certification_recerts_select on public.certification_recerts using ((private.is_org_member(org_id) AND ((user_id = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text]))));
alter policy community_comments_delete on public.community_comments using (((author_id = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
alter policy community_comments_insert on public.community_comments with check ((private.is_org_member(org_id) AND (author_id = (select auth.uid()))));
alter policy community_comments_update on public.community_comments using (((author_id = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text]))) with check (((author_id = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
alter policy community_posts_delete on public.community_posts using (((author_id = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
alter policy community_posts_insert on public.community_posts with check ((private.is_org_member(org_id) AND (author_id = (select auth.uid()))));
alter policy community_posts_update on public.community_posts using (((author_id = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text]))) with check (((author_id = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
alter policy community_reactions_delete on public.community_reactions using ((user_id = (select auth.uid())));
alter policy community_reactions_insert on public.community_reactions with check ((private.is_org_member(org_id) AND (user_id = (select auth.uid()))));
alter policy connections_delete on public.connections using (((requester_user_id = (select auth.uid())) OR (addressee_user_id = (select auth.uid()))));
alter policy connections_insert on public.connections with check ((requester_user_id = (select auth.uid())));
alter policy connections_select on public.connections using (((requester_user_id = (select auth.uid())) OR (addressee_user_id = (select auth.uid()))));
alter policy connections_update on public.connections using (((requester_user_id = (select auth.uid())) OR (addressee_user_id = (select auth.uid())))) with check (((requester_user_id = (select auth.uid())) OR (addressee_user_id = (select auth.uid()))));
alter policy course_enrollments_insert on public.course_enrollments with check ((private.is_org_member(org_id) AND (user_id = (select auth.uid()))));
alter policy course_enrollments_select on public.course_enrollments using ((private.is_org_member(org_id) AND ((user_id = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text]))));
alter policy course_enrollments_update on public.course_enrollments using (((user_id = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text]))) with check (((user_id = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
alter policy credit_ledger_select on public.credit_ledger using ((private.is_org_member(org_id) AND ((user_id = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text]))));
alter policy credit_orders_insert on public.credit_orders with check ((private.is_org_member(org_id) AND (user_id = (select auth.uid()))));
alter policy credit_orders_select on public.credit_orders using ((private.is_org_member(org_id) AND ((user_id = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text]))));
alter policy emergency_contacts_all on public.emergency_contacts using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));
alter policy "exchange_rates service write" on public.exchange_rates with check (((select auth.role()) = 'service_role'::text));
alter policy follow_write on public.follow using ((follower_id = (select auth.uid()))) with check ((follower_id = (select auth.uid())));
alter policy handover_attachments_delete on public.handover_attachments using ((private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text]) OR (EXISTS ( SELECT 1
   FROM handovers h
  WHERE ((h.id = handover_attachments.handover_id) AND (h.from_user_id = (select auth.uid())))))));
alter policy handovers_delete on public.handovers using (((from_user_id = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
alter policy handovers_insert on public.handovers with check ((private.is_org_member(org_id) AND (from_user_id = (select auth.uid()))));
alter policy handovers_update on public.handovers using (((from_user_id = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text]))) with check (((from_user_id = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
alter policy legend_course_reviews_delete on public.legend_course_reviews using (((user_id = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
alter policy legend_course_reviews_insert on public.legend_course_reviews with check ((private.is_org_member(org_id) AND (user_id = (select auth.uid()))));
alter policy legend_course_reviews_update on public.legend_course_reviews using (((user_id = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text]))) with check (((user_id = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
alter policy legend_session_registrations_insert on public.legend_session_registrations with check ((private.is_org_member(org_id) AND (user_id = (select auth.uid()))));
alter policy legend_session_registrations_select on public.legend_session_registrations using ((private.is_org_member(org_id) AND ((user_id = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text]))));
alter policy legend_session_registrations_update on public.legend_session_registrations using (((user_id = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text]))) with check (((user_id = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text])));
alter policy lesson_progress_insert on public.lesson_progress with check ((private.is_org_member(org_id) AND (user_id = (select auth.uid()))));
alter policy lesson_progress_select on public.lesson_progress using ((private.is_org_member(org_id) AND ((user_id = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text, 'controller'::text]))));
alter policy lesson_progress_update on public.lesson_progress using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));
alter policy linked_pass_owner on public.linked_pass using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));
alter policy list_select on public.list using (((visibility = ANY (ARRAY['public'::text, 'unlisted'::text])) OR (owner_id = (select auth.uid()))));
alter policy list_write on public.list using ((owner_id = (select auth.uid()))) with check ((owner_id = (select auth.uid())));
alter policy list_item_select on public.list_item using ((EXISTS ( SELECT 1
   FROM list l
  WHERE ((l.id = list_item.list_id) AND ((l.visibility = ANY (ARRAY['public'::text, 'unlisted'::text])) OR (l.owner_id = (select auth.uid())))))));
alter policy list_item_write on public.list_item using ((EXISTS ( SELECT 1
   FROM list l
  WHERE ((l.id = list_item.list_id) AND (l.owner_id = (select auth.uid())))))) with check ((EXISTS ( SELECT 1
   FROM list l
  WHERE ((l.id = list_item.list_id) AND (l.owner_id = (select auth.uid()))))));
alter policy marketplace_listing_photos_delete on public.marketplace_listing_photos using ((EXISTS ( SELECT 1
   FROM marketplace_listings l
  WHERE ((l.id = marketplace_listing_photos.listing_id) AND ((l.seller_user_id = (select auth.uid())) OR private.has_org_role(l.org_id, ARRAY['owner'::text, 'admin'::text]))))));
alter policy marketplace_listing_photos_insert on public.marketplace_listing_photos with check ((private.is_org_member(org_id) AND (EXISTS ( SELECT 1
   FROM marketplace_listings l
  WHERE ((l.id = marketplace_listing_photos.listing_id) AND (l.seller_user_id = (select auth.uid())))))));
alter policy marketplace_listings_delete on public.marketplace_listings using (((seller_user_id = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
alter policy marketplace_listings_insert on public.marketplace_listings with check ((private.is_org_member(org_id) AND (seller_user_id = (select auth.uid()))));
alter policy marketplace_listings_update on public.marketplace_listings using (((seller_user_id = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text]))) with check (((seller_user_id = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
alter policy notes_delete on public.notes using (((created_by = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
alter policy notes_insert on public.notes with check ((private.is_org_member(org_id) AND (created_by = (select auth.uid()))));
alter policy notes_update on public.notes using (((created_by = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text]))) with check (((created_by = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
alter policy onsite_order_owner on public.onsite_order using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));
alter policy onsite_points_select on public.onsite_points using ((user_id = (select auth.uid())));
alter policy "partner_integrations insert" on public.partner_integrations with check (((select auth.role()) = 'authenticated'::text));
alter policy "partner_integrations service update" on public.partner_integrations using (((select auth.role()) = 'service_role'::text));
alter policy post_write on public.post using ((author_id = (select auth.uid()))) with check ((author_id = (select auth.uid())));
alter policy presence_select on public.presence using (((user_id = (select auth.uid())) OR (EXISTS ( SELECT 1
   FROM follow f
  WHERE ((f.followee_id = presence.user_id) AND (f.follower_id = (select auth.uid())))))));
alter policy presence_write on public.presence using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));
alter policy provider_connection_all on public.provider_connection using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));
alter policy referral_codes_insert on public.referral_codes with check ((user_id = (select auth.uid())));
alter policy referral_codes_select on public.referral_codes using ((user_id = (select auth.uid())));
alter policy referral_codes_update on public.referral_codes using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));
alter policy referral_invitations_insert on public.referral_invitations with check ((referrer_user_id = (select auth.uid())));
alter policy referral_invitations_select on public.referral_invitations using ((referrer_user_id = (select auth.uid())));
alter policy referral_invitations_update on public.referral_invitations using ((referrer_user_id = (select auth.uid()))) with check ((referrer_user_id = (select auth.uid())));
alter policy scene_select on public.scene using (((scene_state = 'published'::text) OR (created_by = (select auth.uid()))));
alter policy scene_write on public.scene using ((created_by = (select auth.uid()))) with check ((created_by = (select auth.uid())));
alter policy scene_event_select on public.scene_event using ((EXISTS ( SELECT 1
   FROM scene s
  WHERE ((s.id = scene_event.scene_id) AND ((s.scene_state = 'published'::text) OR (s.created_by = (select auth.uid())))))));
alter policy scene_event_write on public.scene_event using ((EXISTS ( SELECT 1
   FROM scene s
  WHERE ((s.id = scene_event.scene_id) AND (s.created_by = (select auth.uid())))))) with check ((EXISTS ( SELECT 1
   FROM scene s
  WHERE ((s.id = scene_event.scene_id) AND (s.created_by = (select auth.uid()))))));
alter policy scene_member_write on public.scene_member using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));
alter policy shift_notes_delete on public.shift_notes using (((author_id = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
alter policy shift_notes_insert on public.shift_notes with check ((private.is_org_member(org_id) AND (author_id = (select auth.uid()))));
alter policy shift_notes_update on public.shift_notes using (((author_id = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text]))) with check (((author_id = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
alter policy task_attachments_delete on public.task_attachments using (((uploaded_by = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
alter policy task_attachments_insert on public.task_attachments with check ((private.is_org_member(org_id) AND (uploaded_by = (select auth.uid()))));
alter policy task_comments_delete on public.task_comments using (((author_id = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
alter policy task_comments_insert on public.task_comments with check ((private.is_org_member(org_id) AND (author_id = (select auth.uid()))));
alter policy task_comments_update on public.task_comments using (((author_id = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text]))) with check (((author_id = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text])));
alter policy user_account_status_all on public.user_account_status using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));
alter policy user_app_permissions_all on public.user_app_permissions using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));
alter policy user_certifications_write on public.user_certifications using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));
alter policy user_skills_write on public.user_skills using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));
alter policy user_social_links_write on public.user_social_links using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));
alter policy user_travel_profiles_all on public.user_travel_profiles using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));
alter policy user_uniform_sizes_all on public.user_uniform_sizes using ((user_id = (select auth.uid()))) with check ((user_id = (select auth.uid())));
alter policy voucher_redemptions_insert on public.voucher_redemptions with check ((private.is_org_member(org_id) AND (user_id = (select auth.uid()))));
alter policy voucher_redemptions_select on public.voucher_redemptions using ((private.is_org_member(org_id) AND ((user_id = (select auth.uid())) OR private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text]))));
