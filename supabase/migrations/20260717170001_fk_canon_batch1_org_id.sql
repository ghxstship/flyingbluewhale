-- FK canon batch 1/3: org_id -> orgs(id) ON DELETE CASCADE on 97 tables.
-- 2026-07-17 FK/3NF audit: 319 unconstrained uuid ref columns; org_id verified
-- orphan-free on every table before this migration. NOT VALID + VALIDATE keeps
-- the ACCESS EXCLUSIVE window to catalog-only work; covering indexes added
-- where the column had no leading-column index.
alter table public.access_scans add constraint access_scans_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.accommodation_blocks add constraint accommodation_blocks_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.accreditation_categories add constraint accreditation_categories_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.accreditation_changes add constraint accreditation_changes_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.accreditations add constraint accreditations_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.activity_categories add constraint activity_categories_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.ad_manifests add constraint ad_manifests_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.advance_packet_state_transitions add constraint advance_packet_state_transitions_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.advance_recipient_state_transitions add constraint advance_recipient_state_transitions_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.advance_send_batch_state_transitions add constraint advance_send_batch_state_transitions_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.advance_submission_state_transitions add constraint advance_submission_state_transitions_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.agencies add constraint agencies_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.agency_artists add constraint agency_artists_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.approval_delegations add constraint approval_delegations_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.approval_instances add constraint approval_instances_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.availability_slots add constraint availability_slots_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.blackout_periods add constraint blackout_periods_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.calendar_events add constraint calendar_events_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.calendar_subscriptions add constraint calendar_subscriptions_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.co_pro_partnerships add constraint co_pro_partnerships_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.consent_records add constraint consent_records_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.crisis_alert_receipts add constraint crisis_alert_receipts_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.crisis_alerts add constraint crisis_alerts_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.currency_conversion_log add constraint currency_conversion_log_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.data_export_jobs add constraint data_export_jobs_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.delegation_entries add constraint delegation_entries_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.delegations add constraint delegations_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.deliverable_templates add constraint deliverable_templates_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.dispatch_runs add constraint dispatch_runs_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.dsar_requests add constraint dsar_requests_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.email_templates add constraint email_templates_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.environmental_events add constraint environmental_events_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.event_milestones add constraint event_milestones_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.export_runs add constraint export_runs_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.file_access_log add constraint file_access_log_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.file_relations add constraint file_relations_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.form_submissions add constraint form_submissions_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.goods_receipts add constraint goods_receipts_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.incidents add constraint incidents_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.insurance_policies add constraint insurance_policies_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.integration_connectors add constraint integration_connectors_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.integration_webhook_endpoints add constraint integration_webhook_endpoints_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.job_applications add constraint job_applications_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.job_postings add constraint job_postings_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.job_queue add constraint job_queue_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.kb_articles add constraint kb_articles_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.major_incidents add constraint major_incidents_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.medical_encounters add constraint medical_encounters_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.open_call_submissions add constraint open_call_submissions_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.open_calls add constraint open_calls_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.overtime_rules add constraint overtime_rules_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.party_relationships add constraint party_relationships_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.pay_rates add constraint pay_rates_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.payment_methods add constraint payment_methods_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.po_invoice_matches add constraint po_invoice_matches_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.program_reviews add constraint program_reviews_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.rate_card_items add constraint rate_card_items_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.rate_card_orders add constraint rate_card_orders_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.readiness_exercises add constraint readiness_exercises_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.report_runs add constraint report_runs_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.report_subscriptions add constraint report_subscriptions_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.reviews add constraint reviews_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.risks add constraint risks_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.role_certifications add constraint role_certifications_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.rosters add constraint rosters_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.safeguarding_reports add constraint safeguarding_reports_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.saved_searches add constraint saved_searches_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.scheduler_booking_state_transitions add constraint scheduler_booking_state_transitions_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.search_documents add constraint search_documents_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.search_queries add constraint search_queries_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.settlement_lines add constraint settlement_lines_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.settlements add constraint settlements_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.shifts add constraint shifts_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.sponsor_entitlements add constraint sponsor_entitlements_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.stage_plots add constraint stage_plots_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.sustainability_metrics add constraint sustainability_metrics_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.sync_definitions add constraint sync_definitions_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.tag_assignments add constraint tag_assignments_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.talent_offers add constraint talent_offers_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.talent_profiles add constraint talent_profiles_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.talent_riders add constraint talent_riders_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.tax_calculations add constraint tax_calculations_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.ticketing_connections add constraint ticketing_connections_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.ticketing_sales_snapshots add constraint ticketing_sales_snapshots_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.timesheets add constraint timesheets_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.tours add constraint tours_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.trademarks add constraint trademarks_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.usage_events add constraint usage_events_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.usage_rollups add constraint usage_rollups_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.usr_saved_searches add constraint usr_saved_searches_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.venue_certifications add constraint venue_certifications_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.venue_zones add constraint venue_zones_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.venues add constraint venues_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.visa_cases add constraint visa_cases_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.wizard_instances add constraint wizard_instances_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.workforce_deployments add constraint workforce_deployments_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;
alter table public.workforce_members add constraint workforce_members_org_id_fkey
  foreign key (org_id) references public.orgs(id) on delete cascade not valid;

-- validate (separate scan pass; SHARE UPDATE EXCLUSIVE only)
alter table public.access_scans validate constraint access_scans_org_id_fkey;
alter table public.accommodation_blocks validate constraint accommodation_blocks_org_id_fkey;
alter table public.accreditation_categories validate constraint accreditation_categories_org_id_fkey;
alter table public.accreditation_changes validate constraint accreditation_changes_org_id_fkey;
alter table public.accreditations validate constraint accreditations_org_id_fkey;
alter table public.activity_categories validate constraint activity_categories_org_id_fkey;
alter table public.ad_manifests validate constraint ad_manifests_org_id_fkey;
alter table public.advance_packet_state_transitions validate constraint advance_packet_state_transitions_org_id_fkey;
alter table public.advance_recipient_state_transitions validate constraint advance_recipient_state_transitions_org_id_fkey;
alter table public.advance_send_batch_state_transitions validate constraint advance_send_batch_state_transitions_org_id_fkey;
alter table public.advance_submission_state_transitions validate constraint advance_submission_state_transitions_org_id_fkey;
alter table public.agencies validate constraint agencies_org_id_fkey;
alter table public.agency_artists validate constraint agency_artists_org_id_fkey;
alter table public.approval_delegations validate constraint approval_delegations_org_id_fkey;
alter table public.approval_instances validate constraint approval_instances_org_id_fkey;
alter table public.availability_slots validate constraint availability_slots_org_id_fkey;
alter table public.blackout_periods validate constraint blackout_periods_org_id_fkey;
alter table public.calendar_events validate constraint calendar_events_org_id_fkey;
alter table public.calendar_subscriptions validate constraint calendar_subscriptions_org_id_fkey;
alter table public.co_pro_partnerships validate constraint co_pro_partnerships_org_id_fkey;
alter table public.consent_records validate constraint consent_records_org_id_fkey;
alter table public.crisis_alert_receipts validate constraint crisis_alert_receipts_org_id_fkey;
alter table public.crisis_alerts validate constraint crisis_alerts_org_id_fkey;
alter table public.currency_conversion_log validate constraint currency_conversion_log_org_id_fkey;
alter table public.data_export_jobs validate constraint data_export_jobs_org_id_fkey;
alter table public.delegation_entries validate constraint delegation_entries_org_id_fkey;
alter table public.delegations validate constraint delegations_org_id_fkey;
alter table public.deliverable_templates validate constraint deliverable_templates_org_id_fkey;
alter table public.dispatch_runs validate constraint dispatch_runs_org_id_fkey;
alter table public.dsar_requests validate constraint dsar_requests_org_id_fkey;
alter table public.email_templates validate constraint email_templates_org_id_fkey;
alter table public.environmental_events validate constraint environmental_events_org_id_fkey;
alter table public.event_milestones validate constraint event_milestones_org_id_fkey;
alter table public.export_runs validate constraint export_runs_org_id_fkey;
alter table public.file_access_log validate constraint file_access_log_org_id_fkey;
alter table public.file_relations validate constraint file_relations_org_id_fkey;
alter table public.form_submissions validate constraint form_submissions_org_id_fkey;
alter table public.goods_receipts validate constraint goods_receipts_org_id_fkey;
alter table public.incidents validate constraint incidents_org_id_fkey;
alter table public.insurance_policies validate constraint insurance_policies_org_id_fkey;
alter table public.integration_connectors validate constraint integration_connectors_org_id_fkey;
alter table public.integration_webhook_endpoints validate constraint integration_webhook_endpoints_org_id_fkey;
alter table public.job_applications validate constraint job_applications_org_id_fkey;
alter table public.job_postings validate constraint job_postings_org_id_fkey;
alter table public.job_queue validate constraint job_queue_org_id_fkey;
alter table public.kb_articles validate constraint kb_articles_org_id_fkey;
alter table public.major_incidents validate constraint major_incidents_org_id_fkey;
alter table public.medical_encounters validate constraint medical_encounters_org_id_fkey;
alter table public.open_call_submissions validate constraint open_call_submissions_org_id_fkey;
alter table public.open_calls validate constraint open_calls_org_id_fkey;
alter table public.overtime_rules validate constraint overtime_rules_org_id_fkey;
alter table public.party_relationships validate constraint party_relationships_org_id_fkey;
alter table public.pay_rates validate constraint pay_rates_org_id_fkey;
alter table public.payment_methods validate constraint payment_methods_org_id_fkey;
alter table public.po_invoice_matches validate constraint po_invoice_matches_org_id_fkey;
alter table public.program_reviews validate constraint program_reviews_org_id_fkey;
alter table public.rate_card_items validate constraint rate_card_items_org_id_fkey;
alter table public.rate_card_orders validate constraint rate_card_orders_org_id_fkey;
alter table public.readiness_exercises validate constraint readiness_exercises_org_id_fkey;
alter table public.report_runs validate constraint report_runs_org_id_fkey;
alter table public.report_subscriptions validate constraint report_subscriptions_org_id_fkey;
alter table public.reviews validate constraint reviews_org_id_fkey;
alter table public.risks validate constraint risks_org_id_fkey;
alter table public.role_certifications validate constraint role_certifications_org_id_fkey;
alter table public.rosters validate constraint rosters_org_id_fkey;
alter table public.safeguarding_reports validate constraint safeguarding_reports_org_id_fkey;
alter table public.saved_searches validate constraint saved_searches_org_id_fkey;
alter table public.scheduler_booking_state_transitions validate constraint scheduler_booking_state_transitions_org_id_fkey;
alter table public.search_documents validate constraint search_documents_org_id_fkey;
alter table public.search_queries validate constraint search_queries_org_id_fkey;
alter table public.settlement_lines validate constraint settlement_lines_org_id_fkey;
alter table public.settlements validate constraint settlements_org_id_fkey;
alter table public.shifts validate constraint shifts_org_id_fkey;
alter table public.sponsor_entitlements validate constraint sponsor_entitlements_org_id_fkey;
alter table public.stage_plots validate constraint stage_plots_org_id_fkey;
alter table public.sustainability_metrics validate constraint sustainability_metrics_org_id_fkey;
alter table public.sync_definitions validate constraint sync_definitions_org_id_fkey;
alter table public.tag_assignments validate constraint tag_assignments_org_id_fkey;
alter table public.talent_offers validate constraint talent_offers_org_id_fkey;
alter table public.talent_profiles validate constraint talent_profiles_org_id_fkey;
alter table public.talent_riders validate constraint talent_riders_org_id_fkey;
alter table public.tax_calculations validate constraint tax_calculations_org_id_fkey;
alter table public.ticketing_connections validate constraint ticketing_connections_org_id_fkey;
alter table public.ticketing_sales_snapshots validate constraint ticketing_sales_snapshots_org_id_fkey;
alter table public.timesheets validate constraint timesheets_org_id_fkey;
alter table public.tours validate constraint tours_org_id_fkey;
alter table public.trademarks validate constraint trademarks_org_id_fkey;
alter table public.usage_events validate constraint usage_events_org_id_fkey;
alter table public.usage_rollups validate constraint usage_rollups_org_id_fkey;
alter table public.usr_saved_searches validate constraint usr_saved_searches_org_id_fkey;
alter table public.venue_certifications validate constraint venue_certifications_org_id_fkey;
alter table public.venue_zones validate constraint venue_zones_org_id_fkey;
alter table public.venues validate constraint venues_org_id_fkey;
alter table public.visa_cases validate constraint visa_cases_org_id_fkey;
alter table public.wizard_instances validate constraint wizard_instances_org_id_fkey;
alter table public.workforce_deployments validate constraint workforce_deployments_org_id_fkey;
alter table public.workforce_members validate constraint workforce_members_org_id_fkey;

-- covering indexes for the new FKs
create index if not exists accommodation_blocks_org_id_idx on public.accommodation_blocks (org_id);
create index if not exists accreditation_changes_org_id_idx on public.accreditation_changes (org_id);
create index if not exists ad_manifests_org_id_idx on public.ad_manifests (org_id);
create index if not exists approval_delegations_org_id_idx on public.approval_delegations (org_id);
create index if not exists approval_instances_org_id_idx on public.approval_instances (org_id);
create index if not exists availability_slots_org_id_idx on public.availability_slots (org_id);
create index if not exists blackout_periods_org_id_idx on public.blackout_periods (org_id);
create index if not exists calendar_subscriptions_org_id_idx on public.calendar_subscriptions (org_id);
create index if not exists consent_records_org_id_idx on public.consent_records (org_id);
create index if not exists crisis_alert_receipts_org_id_idx on public.crisis_alert_receipts (org_id);
create index if not exists crisis_alerts_org_id_idx on public.crisis_alerts (org_id);
create index if not exists currency_conversion_log_org_id_idx on public.currency_conversion_log (org_id);
create index if not exists data_export_jobs_org_id_idx on public.data_export_jobs (org_id);
create index if not exists delegation_entries_org_id_idx on public.delegation_entries (org_id);
create index if not exists deliverable_templates_org_id_idx on public.deliverable_templates (org_id);
create index if not exists dsar_requests_org_id_idx on public.dsar_requests (org_id);
create index if not exists environmental_events_org_id_idx on public.environmental_events (org_id);
create index if not exists file_access_log_org_id_idx on public.file_access_log (org_id);
create index if not exists file_relations_org_id_idx on public.file_relations (org_id);
create index if not exists insurance_policies_org_id_idx on public.insurance_policies (org_id);
create index if not exists integration_webhook_endpoints_org_id_idx on public.integration_webhook_endpoints (org_id);
create index if not exists job_postings_org_id_idx on public.job_postings (org_id);
create index if not exists job_queue_org_id_idx on public.job_queue (org_id);
create index if not exists major_incidents_org_id_idx on public.major_incidents (org_id);
create index if not exists medical_encounters_org_id_idx on public.medical_encounters (org_id);
create index if not exists open_calls_org_id_idx on public.open_calls (org_id);
create index if not exists overtime_rules_org_id_idx on public.overtime_rules (org_id);
create index if not exists party_relationships_org_id_idx on public.party_relationships (org_id);
create index if not exists pay_rates_org_id_idx on public.pay_rates (org_id);
create index if not exists payment_methods_org_id_idx on public.payment_methods (org_id);
create index if not exists po_invoice_matches_org_id_idx on public.po_invoice_matches (org_id);
create index if not exists program_reviews_org_id_idx on public.program_reviews (org_id);
create index if not exists rate_card_orders_org_id_idx on public.rate_card_orders (org_id);
create index if not exists readiness_exercises_org_id_idx on public.readiness_exercises (org_id);
create index if not exists report_runs_org_id_idx on public.report_runs (org_id);
create index if not exists report_subscriptions_org_id_idx on public.report_subscriptions (org_id);
create index if not exists role_certifications_org_id_idx on public.role_certifications (org_id);
create index if not exists rosters_org_id_idx on public.rosters (org_id);
create index if not exists safeguarding_reports_org_id_idx on public.safeguarding_reports (org_id);
create index if not exists saved_searches_org_id_idx on public.saved_searches (org_id);
create index if not exists search_queries_org_id_idx on public.search_queries (org_id);
create index if not exists sponsor_entitlements_org_id_idx on public.sponsor_entitlements (org_id);
create index if not exists stage_plots_org_id_idx on public.stage_plots (org_id);
create index if not exists sustainability_metrics_org_id_idx on public.sustainability_metrics (org_id);
create index if not exists sync_definitions_org_id_idx on public.sync_definitions (org_id);
create index if not exists tag_assignments_org_id_idx on public.tag_assignments (org_id);
create index if not exists tax_calculations_org_id_idx on public.tax_calculations (org_id);
create index if not exists ticketing_sales_snapshots_org_id_idx on public.ticketing_sales_snapshots (org_id);
create index if not exists trademarks_org_id_idx on public.trademarks (org_id);
create index if not exists usage_events_org_id_idx on public.usage_events (org_id);
create index if not exists usr_saved_searches_org_id_idx on public.usr_saved_searches (org_id);
create index if not exists venue_certifications_org_id_idx on public.venue_certifications (org_id);
create index if not exists venue_zones_org_id_idx on public.venue_zones (org_id);
create index if not exists visa_cases_org_id_idx on public.visa_cases (org_id);
create index if not exists wizard_instances_org_id_idx on public.wizard_instances (org_id);
create index if not exists workforce_deployments_org_id_idx on public.workforce_deployments (org_id);
