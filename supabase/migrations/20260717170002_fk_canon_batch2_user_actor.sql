-- FK canon batch 2/3: user/actor columns -> auth.users / public.users.
-- Target picked per each table's existing sibling-column convention (public.users
-- itself FKs auth.users ON DELETE CASCADE, so the id spaces are identical).
-- Nullable actor cols: ON DELETE SET NULL. NOT NULL ownership cols: CASCADE.
-- All columns verified orphan-free. Deliberately skipped:
--   time_entry_audit.time_entry_id — the audit ledger records delete actions and
--   must outlive its subject; an FK in any delete mode breaks that.
alter table public.access_scans add constraint access_scans_scanned_by_fkey
  foreign key (scanned_by) references auth.users(id) on delete set null not valid;
alter table public.accounting_period_state_transitions add constraint accounting_period_state_transitions_transitioned_by_fkey
  foreign key (transitioned_by) references public.users(id) on delete set null not valid;
alter table public.accreditation_changes add constraint accreditation_changes_decided_by_fkey
  foreign key (decided_by) references auth.users(id) on delete set null not valid;
alter table public.accreditation_changes add constraint accreditation_changes_requested_by_fkey
  foreign key (requested_by) references auth.users(id) on delete set null not valid;
alter table public.accreditations add constraint accreditations_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null not valid;
alter table public.advance_packet_state_transitions add constraint advance_packet_state_transitions_transitioned_by_fkey
  foreign key (transitioned_by) references public.users(id) on delete set null not valid;
alter table public.advance_recipient_state_transitions add constraint advance_recipient_state_transitions_transitioned_by_fkey
  foreign key (transitioned_by) references public.users(id) on delete set null not valid;
alter table public.advance_send_batch_state_transitions add constraint advance_send_batch_state_transitions_transitioned_by_fkey
  foreign key (transitioned_by) references public.users(id) on delete set null not valid;
alter table public.advance_submission_state_transitions add constraint advance_submission_state_transitions_transitioned_by_fkey
  foreign key (transitioned_by) references public.users(id) on delete set null not valid;
alter table public.agency_artists add constraint agency_artists_agent_user_id_fkey
  foreign key (agent_user_id) references auth.users(id) on delete set null not valid;
alter table public.availability_slots add constraint availability_slots_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade not valid;
alter table public.consent_records add constraint consent_records_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null not valid;
alter table public.conversations add constraint conversations_recipient_user_id_fkey
  foreign key (recipient_user_id) references auth.users(id) on delete set null not valid;
alter table public.crisis_alert_receipts add constraint crisis_alert_receipts_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade not valid;
alter table public.crisis_alerts add constraint crisis_alerts_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null not valid;
alter table public.delegations add constraint delegations_attache_user_id_fkey
  foreign key (attache_user_id) references auth.users(id) on delete set null not valid;
alter table public.deliverable_state_transitions add constraint deliverable_state_transitions_transitioned_by_fkey
  foreign key (transitioned_by) references public.users(id) on delete set null not valid;
alter table public.deliverable_templates add constraint deliverable_templates_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null not valid;
alter table public.dispatch_runs add constraint dispatch_runs_driver_id_fkey
  foreign key (driver_id) references auth.users(id) on delete set null not valid;
alter table public.document_state_transitions add constraint document_state_transitions_transitioned_by_fkey
  foreign key (transitioned_by) references public.users(id) on delete set null not valid;
alter table public.dsar_requests add constraint dsar_requests_requester_user_id_fkey
  foreign key (requester_user_id) references auth.users(id) on delete set null not valid;
alter table public.email_templates add constraint email_templates_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null not valid;
alter table public.event_kits add constraint event_kits_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null not valid;
alter table public.event_milestones add constraint event_milestones_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null not valid;
alter table public.export_runs add constraint export_runs_requested_by_fkey
  foreign key (requested_by) references public.users(id) on delete set null not valid;
alter table public.goods_receipts add constraint goods_receipts_received_by_fkey
  foreign key (received_by) references public.users(id) on delete set null not valid;
alter table public.incidents add constraint incidents_reporter_id_fkey
  foreign key (reporter_id) references public.users(id) on delete cascade not valid;
alter table public.job_applications add constraint job_applications_applicant_user_id_fkey
  foreign key (applicant_user_id) references auth.users(id) on delete cascade not valid;
alter table public.job_applications add constraint job_applications_reviewed_by_fkey
  foreign key (reviewed_by) references auth.users(id) on delete set null not valid;
alter table public.job_postings add constraint job_postings_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null not valid;
alter table public.kb_articles add constraint kb_articles_author_id_fkey
  foreign key (author_id) references auth.users(id) on delete set null not valid;
alter table public.medical_encounters add constraint medical_encounters_clinician_id_fkey
  foreign key (clinician_id) references auth.users(id) on delete set null not valid;
alter table public.onboarding_step_state_transitions add constraint onboarding_step_state_transitions_transitioned_by_fkey
  foreign key (transitioned_by) references public.users(id) on delete set null not valid;
alter table public.open_call_submissions add constraint open_call_submissions_reviewed_by_fkey
  foreign key (reviewed_by) references auth.users(id) on delete set null not valid;
alter table public.open_call_submissions add constraint open_call_submissions_submitter_user_id_fkey
  foreign key (submitter_user_id) references auth.users(id) on delete set null not valid;
alter table public.open_calls add constraint open_calls_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null not valid;
alter table public.partner_integrations add constraint partner_integrations_reviewed_by_fkey
  foreign key (reviewed_by) references auth.users(id) on delete set null not valid;
alter table public.partner_integrations add constraint partner_integrations_submitted_by_fkey
  foreign key (submitted_by) references auth.users(id) on delete set null not valid;
alter table public.policy_evaluation_log add constraint policy_evaluation_log_actor_id_fkey
  foreign key (actor_id) references auth.users(id) on delete set null not valid;
alter table public.production_phase_transitions add constraint production_phase_transitions_transitioned_by_fkey
  foreign key (transitioned_by) references public.users(id) on delete set null not valid;
alter table public.program_reviews add constraint program_reviews_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null not valid;
alter table public.project_phase_transitions add constraint project_phase_transitions_transitioned_by_fkey
  foreign key (transitioned_by) references public.users(id) on delete set null not valid;
alter table public.rate_card_orders add constraint rate_card_orders_requester_id_fkey
  foreign key (requester_id) references auth.users(id) on delete set null not valid;
alter table public.reviews add constraint reviews_reviewer_user_id_fkey
  foreign key (reviewer_user_id) references auth.users(id) on delete cascade not valid;
alter table public.reviews add constraint reviews_subject_user_id_fkey
  foreign key (subject_user_id) references auth.users(id) on delete set null not valid;
alter table public.risks add constraint risks_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null not valid;
alter table public.risks add constraint risks_owner_id_fkey
  foreign key (owner_id) references auth.users(id) on delete set null not valid;
alter table public.safeguarding_reports add constraint safeguarding_reports_assigned_to_fkey
  foreign key (assigned_to) references public.users(id) on delete set null not valid;
alter table public.safeguarding_reports add constraint safeguarding_reports_reporter_id_fkey
  foreign key (reporter_id) references public.users(id) on delete set null not valid;
alter table public.saved_searches add constraint saved_searches_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade not valid;
alter table public.scheduler_booking_state_transitions add constraint scheduler_booking_state_transitions_transitioned_by_fkey
  foreign key (transitioned_by) references public.users(id) on delete set null not valid;
alter table public.settlements add constraint settlements_finalized_by_fkey
  foreign key (finalized_by) references auth.users(id) on delete set null not valid;
alter table public.sop_acknowledgements add constraint sop_acknowledgements_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade not valid;
alter table public.stage_plots add constraint stage_plots_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null not valid;
alter table public.subscription_state_transitions add constraint subscription_state_transitions_transitioned_by_fkey
  foreign key (transitioned_by) references public.users(id) on delete set null not valid;
alter table public.sync_conflict_log add constraint sync_conflict_log_resolved_by_fkey
  foreign key (resolved_by) references auth.users(id) on delete set null not valid;
alter table public.talent_offers add constraint talent_offers_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null not valid;
alter table public.talent_profiles add constraint talent_profiles_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null not valid;
alter table public.talent_profiles add constraint talent_profiles_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null not valid;
alter table public.talent_riders add constraint talent_riders_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null not valid;
alter table public.time_entry_audit add constraint time_entry_audit_actor_id_fkey
  foreign key (actor_id) references auth.users(id) on delete set null not valid;
alter table public.tours add constraint tours_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null not valid;
alter table public.transaction_status_history add constraint transaction_status_history_actor_id_fkey
  foreign key (actor_id) references auth.users(id) on delete set null not valid;
alter table public.usage_events add constraint usage_events_actor_id_fkey
  foreign key (actor_id) references auth.users(id) on delete set null not valid;
alter table public.user_profiles add constraint user_profiles_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade not valid;
alter table public.workforce_members add constraint workforce_members_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null not valid;

-- validate (separate scan pass; SHARE UPDATE EXCLUSIVE only)
alter table public.access_scans validate constraint access_scans_scanned_by_fkey;
alter table public.accounting_period_state_transitions validate constraint accounting_period_state_transitions_transitioned_by_fkey;
alter table public.accreditation_changes validate constraint accreditation_changes_decided_by_fkey;
alter table public.accreditation_changes validate constraint accreditation_changes_requested_by_fkey;
alter table public.accreditations validate constraint accreditations_user_id_fkey;
alter table public.advance_packet_state_transitions validate constraint advance_packet_state_transitions_transitioned_by_fkey;
alter table public.advance_recipient_state_transitions validate constraint advance_recipient_state_transitions_transitioned_by_fkey;
alter table public.advance_send_batch_state_transitions validate constraint advance_send_batch_state_transitions_transitioned_by_fkey;
alter table public.advance_submission_state_transitions validate constraint advance_submission_state_transitions_transitioned_by_fkey;
alter table public.agency_artists validate constraint agency_artists_agent_user_id_fkey;
alter table public.availability_slots validate constraint availability_slots_user_id_fkey;
alter table public.consent_records validate constraint consent_records_user_id_fkey;
alter table public.conversations validate constraint conversations_recipient_user_id_fkey;
alter table public.crisis_alert_receipts validate constraint crisis_alert_receipts_user_id_fkey;
alter table public.crisis_alerts validate constraint crisis_alerts_created_by_fkey;
alter table public.delegations validate constraint delegations_attache_user_id_fkey;
alter table public.deliverable_state_transitions validate constraint deliverable_state_transitions_transitioned_by_fkey;
alter table public.deliverable_templates validate constraint deliverable_templates_created_by_fkey;
alter table public.dispatch_runs validate constraint dispatch_runs_driver_id_fkey;
alter table public.document_state_transitions validate constraint document_state_transitions_transitioned_by_fkey;
alter table public.dsar_requests validate constraint dsar_requests_requester_user_id_fkey;
alter table public.email_templates validate constraint email_templates_created_by_fkey;
alter table public.event_kits validate constraint event_kits_created_by_fkey;
alter table public.event_milestones validate constraint event_milestones_created_by_fkey;
alter table public.export_runs validate constraint export_runs_requested_by_fkey;
alter table public.goods_receipts validate constraint goods_receipts_received_by_fkey;
alter table public.incidents validate constraint incidents_reporter_id_fkey;
alter table public.job_applications validate constraint job_applications_applicant_user_id_fkey;
alter table public.job_applications validate constraint job_applications_reviewed_by_fkey;
alter table public.job_postings validate constraint job_postings_created_by_fkey;
alter table public.kb_articles validate constraint kb_articles_author_id_fkey;
alter table public.medical_encounters validate constraint medical_encounters_clinician_id_fkey;
alter table public.onboarding_step_state_transitions validate constraint onboarding_step_state_transitions_transitioned_by_fkey;
alter table public.open_call_submissions validate constraint open_call_submissions_reviewed_by_fkey;
alter table public.open_call_submissions validate constraint open_call_submissions_submitter_user_id_fkey;
alter table public.open_calls validate constraint open_calls_created_by_fkey;
alter table public.partner_integrations validate constraint partner_integrations_reviewed_by_fkey;
alter table public.partner_integrations validate constraint partner_integrations_submitted_by_fkey;
alter table public.policy_evaluation_log validate constraint policy_evaluation_log_actor_id_fkey;
alter table public.production_phase_transitions validate constraint production_phase_transitions_transitioned_by_fkey;
alter table public.program_reviews validate constraint program_reviews_created_by_fkey;
alter table public.project_phase_transitions validate constraint project_phase_transitions_transitioned_by_fkey;
alter table public.rate_card_orders validate constraint rate_card_orders_requester_id_fkey;
alter table public.reviews validate constraint reviews_reviewer_user_id_fkey;
alter table public.reviews validate constraint reviews_subject_user_id_fkey;
alter table public.risks validate constraint risks_created_by_fkey;
alter table public.risks validate constraint risks_owner_id_fkey;
alter table public.safeguarding_reports validate constraint safeguarding_reports_assigned_to_fkey;
alter table public.safeguarding_reports validate constraint safeguarding_reports_reporter_id_fkey;
alter table public.saved_searches validate constraint saved_searches_user_id_fkey;
alter table public.scheduler_booking_state_transitions validate constraint scheduler_booking_state_transitions_transitioned_by_fkey;
alter table public.settlements validate constraint settlements_finalized_by_fkey;
alter table public.sop_acknowledgements validate constraint sop_acknowledgements_user_id_fkey;
alter table public.stage_plots validate constraint stage_plots_created_by_fkey;
alter table public.subscription_state_transitions validate constraint subscription_state_transitions_transitioned_by_fkey;
alter table public.sync_conflict_log validate constraint sync_conflict_log_resolved_by_fkey;
alter table public.talent_offers validate constraint talent_offers_created_by_fkey;
alter table public.talent_profiles validate constraint talent_profiles_created_by_fkey;
alter table public.talent_profiles validate constraint talent_profiles_user_id_fkey;
alter table public.talent_riders validate constraint talent_riders_created_by_fkey;
alter table public.time_entry_audit validate constraint time_entry_audit_actor_id_fkey;
alter table public.tours validate constraint tours_created_by_fkey;
alter table public.transaction_status_history validate constraint transaction_status_history_actor_id_fkey;
alter table public.usage_events validate constraint usage_events_actor_id_fkey;
alter table public.user_profiles validate constraint user_profiles_user_id_fkey;
alter table public.workforce_members validate constraint workforce_members_user_id_fkey;

-- covering indexes for the new FKs
create index if not exists access_scans_scanned_by_idx on public.access_scans (scanned_by);
create index if not exists accounting_period_state_transitions_transitioned_by_idx on public.accounting_period_state_transitions (transitioned_by);
create index if not exists accreditation_changes_decided_by_idx on public.accreditation_changes (decided_by);
create index if not exists accreditation_changes_requested_by_idx on public.accreditation_changes (requested_by);
create index if not exists advance_packet_state_transitions_transitioned_by_idx on public.advance_packet_state_transitions (transitioned_by);
create index if not exists advance_recipient_state_transitions_transitioned_by_idx on public.advance_recipient_state_transitions (transitioned_by);
create index if not exists advance_send_batch_state_transitions_transitioned_by_idx on public.advance_send_batch_state_transitions (transitioned_by);
create index if not exists advance_submission_state_transitions_transitioned_by_idx on public.advance_submission_state_transitions (transitioned_by);
create index if not exists consent_records_user_id_idx on public.consent_records (user_id);
create index if not exists conversations_recipient_user_id_idx on public.conversations (recipient_user_id);
create index if not exists crisis_alert_receipts_user_id_idx on public.crisis_alert_receipts (user_id);
create index if not exists crisis_alerts_created_by_idx on public.crisis_alerts (created_by);
create index if not exists delegations_attache_user_id_idx on public.delegations (attache_user_id);
create index if not exists deliverable_state_transitions_transitioned_by_idx on public.deliverable_state_transitions (transitioned_by);
create index if not exists deliverable_templates_created_by_idx on public.deliverable_templates (created_by);
create index if not exists dispatch_runs_driver_id_idx on public.dispatch_runs (driver_id);
create index if not exists document_state_transitions_transitioned_by_idx on public.document_state_transitions (transitioned_by);
create index if not exists dsar_requests_requester_user_id_idx on public.dsar_requests (requester_user_id);
create index if not exists email_templates_created_by_idx on public.email_templates (created_by);
create index if not exists event_kits_created_by_idx on public.event_kits (created_by);
create index if not exists export_runs_requested_by_idx on public.export_runs (requested_by);
create index if not exists goods_receipts_received_by_idx on public.goods_receipts (received_by);
create index if not exists incidents_reporter_id_idx on public.incidents (reporter_id);
create index if not exists job_postings_created_by_idx on public.job_postings (created_by);
create index if not exists kb_articles_author_id_idx on public.kb_articles (author_id);
create index if not exists medical_encounters_clinician_id_idx on public.medical_encounters (clinician_id);
create index if not exists onboarding_step_state_transitions_transitioned_by_idx on public.onboarding_step_state_transitions (transitioned_by);
create index if not exists open_calls_created_by_idx on public.open_calls (created_by);
create index if not exists partner_integrations_reviewed_by_idx on public.partner_integrations (reviewed_by);
create index if not exists partner_integrations_submitted_by_idx on public.partner_integrations (submitted_by);
create index if not exists policy_evaluation_log_actor_id_idx on public.policy_evaluation_log (actor_id);
create index if not exists production_phase_transitions_transitioned_by_idx on public.production_phase_transitions (transitioned_by);
create index if not exists program_reviews_created_by_idx on public.program_reviews (created_by);
create index if not exists project_phase_transitions_transitioned_by_idx on public.project_phase_transitions (transitioned_by);
create index if not exists rate_card_orders_requester_id_idx on public.rate_card_orders (requester_id);
create index if not exists risks_created_by_idx on public.risks (created_by);
create index if not exists risks_owner_id_idx on public.risks (owner_id);
create index if not exists safeguarding_reports_assigned_to_idx on public.safeguarding_reports (assigned_to);
create index if not exists safeguarding_reports_reporter_id_idx on public.safeguarding_reports (reporter_id);
create index if not exists scheduler_booking_state_transitions_transitioned_by_idx on public.scheduler_booking_state_transitions (transitioned_by);
create index if not exists sop_acknowledgements_user_id_idx on public.sop_acknowledgements (user_id);
create index if not exists stage_plots_created_by_idx on public.stage_plots (created_by);
create index if not exists subscription_state_transitions_transitioned_by_idx on public.subscription_state_transitions (transitioned_by);
create index if not exists sync_conflict_log_resolved_by_idx on public.sync_conflict_log (resolved_by);
create index if not exists talent_profiles_created_by_idx on public.talent_profiles (created_by);
create index if not exists talent_riders_created_by_idx on public.talent_riders (created_by);
create index if not exists tours_created_by_idx on public.tours (created_by);
create index if not exists transaction_status_history_actor_id_idx on public.transaction_status_history (actor_id);
create index if not exists usage_events_actor_id_idx on public.usage_events (actor_id);
create index if not exists workforce_members_user_id_idx on public.workforce_members (user_id);
