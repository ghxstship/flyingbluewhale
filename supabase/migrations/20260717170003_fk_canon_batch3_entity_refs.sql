-- FK canon batch 3/3: entity reference columns.
-- Targets resolved from live data + writers (notable: transaction_lines.account_id
-- -> chart_of_accounts (12/12 live rows), push_send_failures.subscription_id ->
-- push_subscriptions (send.ts writes PushSubRow.id), import_jobs.job_id ->
-- job_queue, notification_instances.event_id -> domain_events,
-- opportunity_activities.ucs_event_id -> events (UCS = calendar/scheduling)).
-- Deliberately skipped (polymorphic by design, discriminator-paired):
--   events.location_id/resource_ref, and the 45 target_id/source_id/ref_id/
--   scope_id/subject_id columns with *_type/*_kind/*_table siblings.
--   risk_scores.created_by_run + wizard_step_completions.primitive_event_id have
--   no live target table; party_* columns await the party-layer repair.
-- Pre-cleanup: nulls 49 orphaned values (hard-deleted projects / a clobbered e2e
-- talent fixture / one pre-canon cost center) so the constraints validate.
-- orphan cleanup (verified 2026-07-17: 36 + 1 + 12 rows, all dangling refs to
-- hard-deleted records; joins already return nothing for them)
update public.stage_plots sp set project_id = null
  where project_id is not null
    and not exists (select 1 from public.projects p where p.id = sp.project_id);
update public.open_call_submissions ocs set talent_profile_id = null
  where talent_profile_id is not null
    and not exists (select 1 from public.talent_profiles tp where tp.id = ocs.talent_profile_id);
update public.transaction_lines tl set cost_center_id = null
  where cost_center_id is not null
    and not exists (select 1 from public.cost_centers cc where cc.id = tl.cost_center_id);

alter table public.accreditations add constraint accreditations_delegation_id_fkey
  foreign key (delegation_id) references public.delegations(id) on delete set null not valid;
alter table public.asset_maintenance_history add constraint asset_maintenance_history_schedule_id_fkey
  foreign key (schedule_id) references public.maintenance_schedules(id) on delete set null not valid;
alter table public.assets add constraint assets_xpms_atom_id_fkey
  foreign key (xpms_atom_id) references public.xpms_atoms(id) on delete set null not valid;
alter table public.availability_slots add constraint availability_slots_granted_to_org_id_fkey
  foreign key (granted_to_org_id) references public.orgs(id) on delete set null not valid;
alter table public.availability_slots add constraint availability_slots_talent_profile_id_fkey
  foreign key (talent_profile_id) references public.talent_profiles(id) on delete set null not valid;
alter table public.availability_slots add constraint availability_slots_venue_id_fkey
  foreign key (venue_id) references public.venues(id) on delete set null not valid;
alter table public.co_pro_partnerships add constraint co_pro_partnerships_partner_org_id_fkey
  foreign key (partner_org_id) references public.orgs(id) on delete set null not valid;
alter table public.compliance_documents add constraint compliance_documents_file_id_fkey
  foreign key (file_id) references public.files(id) on delete set null not valid;
alter table public.contract_obligations add constraint contract_obligations_task_id_fkey
  foreign key (task_id) references public.tasks(id) on delete set null not valid;
alter table public.conversations add constraint conversations_recipient_org_id_fkey
  foreign key (recipient_org_id) references public.orgs(id) on delete set null not valid;
alter table public.crisis_broadcasts add constraint crisis_broadcasts_notification_instance_id_fkey
  foreign key (notification_instance_id) references public.notification_instances(id) on delete set null not valid;
alter table public.event_milestones add constraint event_milestones_project_id_fkey
  foreign key (project_id) references public.projects(id) on delete set null not valid;
alter table public.event_milestones add constraint event_milestones_talent_offer_id_fkey
  foreign key (talent_offer_id) references public.talent_offers(id) on delete set null not valid;
alter table public.event_resources add constraint event_resources_reserved_movement_id_fkey
  foreign key (reserved_movement_id) references public.asset_movements(id) on delete set null not valid;
alter table public.goods_receipt_lines add constraint goods_receipt_lines_po_line_item_id_fkey
  foreign key (po_line_item_id) references public.po_line_items(id) on delete cascade not valid;
alter table public.import_jobs add constraint import_jobs_job_id_fkey
  foreign key (job_id) references public.job_queue(id) on delete set null not valid;
alter table public.incidents add constraint incidents_project_id_fkey
  foreign key (project_id) references public.projects(id) on delete set null not valid;
alter table public.job_applications add constraint job_applications_crew_member_id_fkey
  foreign key (crew_member_id) references public.crew_members(id) on delete set null not valid;
alter table public.job_postings add constraint job_postings_project_id_fkey
  foreign key (project_id) references public.projects(id) on delete set null not valid;
alter table public.notification_instances add constraint notification_instances_event_id_fkey
  foreign key (event_id) references public.domain_events(id) on delete set null not valid;
alter table public.open_call_submissions add constraint open_call_submissions_crew_member_id_fkey
  foreign key (crew_member_id) references public.crew_members(id) on delete set null not valid;
alter table public.open_call_submissions add constraint open_call_submissions_talent_profile_id_fkey
  foreign key (talent_profile_id) references public.talent_profiles(id) on delete set null not valid;
alter table public.open_call_submissions add constraint open_call_submissions_vendor_id_fkey
  foreign key (vendor_id) references public.vendors(id) on delete set null not valid;
alter table public.open_calls add constraint open_calls_awarded_submission_id_fkey
  foreign key (awarded_submission_id) references public.open_call_submissions(id) on delete set null not valid;
alter table public.open_calls add constraint open_calls_project_id_fkey
  foreign key (project_id) references public.projects(id) on delete set null not valid;
alter table public.opportunities add constraint opportunities_contract_id_fkey
  foreign key (contract_id) references public.contracts(id) on delete set null not valid;
alter table public.opportunity_activities add constraint opportunity_activities_ucs_event_id_fkey
  foreign key (ucs_event_id) references public.events(id) on delete set null not valid;
alter table public.org_event_log_destinations add constraint org_event_log_destinations_last_published_id_fkey
  foreign key (last_published_id) references public.domain_events(id) on delete set null not valid;
alter table public.payroll_run_lines add constraint payroll_run_lines_cost_center_id_fkey
  foreign key (cost_center_id) references public.cost_centers(id) on delete set null not valid;
alter table public.pinboards add constraint pinboards_xpms_atom_id_fkey
  foreign key (xpms_atom_id) references public.xpms_atoms(id) on delete set null not valid;
alter table public.projects add constraint projects_client_id_fkey
  foreign key (client_id) references public.clients(id) on delete set null not valid;
alter table public.push_send_failures add constraint push_send_failures_subscription_id_fkey
  foreign key (subscription_id) references public.push_subscriptions(id) on delete cascade not valid;
alter table public.readiness_exercises add constraint readiness_exercises_project_id_fkey
  foreign key (project_id) references public.projects(id) on delete set null not valid;
alter table public.requisitions add constraint requisitions_approval_instance_id_fkey
  foreign key (approval_instance_id) references public.approval_instances(id) on delete set null not valid;
alter table public.reviews add constraint reviews_reviewer_org_id_fkey
  foreign key (reviewer_org_id) references public.orgs(id) on delete set null not valid;
alter table public.reviews add constraint reviews_subject_crew_member_id_fkey
  foreign key (subject_crew_member_id) references public.crew_members(id) on delete set null not valid;
alter table public.reviews add constraint reviews_subject_org_id_fkey
  foreign key (subject_org_id) references public.orgs(id) on delete set null not valid;
alter table public.reviews add constraint reviews_subject_talent_profile_id_fkey
  foreign key (subject_talent_profile_id) references public.talent_profiles(id) on delete set null not valid;
alter table public.reviews add constraint reviews_subject_vendor_id_fkey
  foreign key (subject_vendor_id) references public.vendors(id) on delete set null not valid;
alter table public.risks add constraint risks_project_id_fkey
  foreign key (project_id) references public.projects(id) on delete set null not valid;
alter table public.role_credentials add constraint role_credentials_asset_id_fkey
  foreign key (asset_id) references public.assets(id) on delete set null not valid;
alter table public.role_documents add constraint role_documents_contract_id_fkey
  foreign key (contract_id) references public.contracts(id) on delete set null not valid;
alter table public.settlements add constraint settlements_project_id_fkey
  foreign key (project_id) references public.projects(id) on delete set null not valid;
alter table public.settlements add constraint settlements_talent_offer_id_fkey
  foreign key (talent_offer_id) references public.talent_offers(id) on delete set null not valid;
alter table public.settlements add constraint settlements_venue_id_fkey
  foreign key (venue_id) references public.venues(id) on delete set null not valid;
alter table public.sponsor_entitlements add constraint sponsor_entitlements_sponsor_client_id_fkey
  foreign key (sponsor_client_id) references public.clients(id) on delete set null not valid;
alter table public.stage_plots add constraint stage_plots_project_id_fkey
  foreign key (project_id) references public.projects(id) on delete set null not valid;
alter table public.stage_plots add constraint stage_plots_talent_profile_id_fkey
  foreign key (talent_profile_id) references public.talent_profiles(id) on delete set null not valid;
alter table public.talent_offers add constraint talent_offers_agency_id_fkey
  foreign key (agency_id) references public.agencies(id) on delete set null not valid;
alter table public.talent_offers add constraint talent_offers_open_call_submission_id_fkey
  foreign key (open_call_submission_id) references public.open_call_submissions(id) on delete set null not valid;
alter table public.talent_offers add constraint talent_offers_performance_agreement_proposal_id_fkey
  foreign key (performance_agreement_proposal_id) references public.proposals(id) on delete set null not valid;
alter table public.talent_offers add constraint talent_offers_previous_offer_id_fkey
  foreign key (previous_offer_id) references public.talent_offers(id) on delete set null not valid;
alter table public.talent_offers add constraint talent_offers_project_id_fkey
  foreign key (project_id) references public.projects(id) on delete set null not valid;
alter table public.talent_offers add constraint talent_offers_stage_plot_id_fkey
  foreign key (stage_plot_id) references public.stage_plots(id) on delete set null not valid;
alter table public.talent_offers add constraint talent_offers_tour_id_fkey
  foreign key (tour_id) references public.tours(id) on delete set null not valid;
alter table public.talent_offers add constraint talent_offers_venue_id_fkey
  foreign key (venue_id) references public.venues(id) on delete set null not valid;
alter table public.tax_calculations add constraint tax_calculations_jurisdiction_id_fkey
  foreign key (jurisdiction_id) references public.tax_jurisdictions(id) on delete no action not valid;
alter table public.tax_calculations add constraint tax_calculations_transaction_line_id_fkey
  foreign key (transaction_line_id) references public.transaction_lines(id) on delete cascade not valid;
alter table public.ticketing_connections add constraint ticketing_connections_project_id_fkey
  foreign key (project_id) references public.projects(id) on delete set null not valid;
alter table public.ticketing_connections add constraint ticketing_connections_talent_offer_id_fkey
  foreign key (talent_offer_id) references public.talent_offers(id) on delete set null not valid;
alter table public.time_entries add constraint time_entries_timesheet_id_fkey
  foreign key (timesheet_id) references public.timesheets(id) on delete set null not valid;
alter table public.timesheets add constraint timesheets_approval_instance_id_fkey
  foreign key (approval_instance_id) references public.approval_instances(id) on delete set null not valid;
alter table public.timesheets add constraint timesheets_invoice_tx_id_fkey
  foreign key (invoice_tx_id) references public.transactions(id) on delete set null not valid;
alter table public.timesheets add constraint timesheets_project_id_fkey
  foreign key (project_id) references public.projects(id) on delete set null not valid;
alter table public.tours add constraint tours_agency_id_fkey
  foreign key (agency_id) references public.agencies(id) on delete set null not valid;
alter table public.transaction_lines add constraint transaction_lines_account_id_fkey
  foreign key (account_id) references public.chart_of_accounts(id) on delete set null not valid;
alter table public.transaction_lines add constraint transaction_lines_cost_center_id_fkey
  foreign key (cost_center_id) references public.cost_centers(id) on delete set null not valid;
alter table public.transaction_lines add constraint transaction_lines_tax_calculation_id_fkey
  foreign key (tax_calculation_id) references public.tax_calculations(id) on delete set null not valid;
alter table public.transaction_parties add constraint transaction_parties_address_id_fkey
  foreign key (address_id) references public.addresses(id) on delete set null not valid;
alter table public.transactions add constraint transactions_contract_id_fkey
  foreign key (contract_id) references public.contracts(id) on delete set null not valid;
alter table public.vendor_products add constraint vendor_products_xpms_atom_id_fkey
  foreign key (xpms_atom_id) references public.xpms_atoms(id) on delete set null not valid;
alter table public.venues add constraint venues_location_id_fkey
  foreign key (location_id) references public.locations(id) on delete set null not valid;
alter table public.venues add constraint venues_project_id_fkey
  foreign key (project_id) references public.projects(id) on delete set null not valid;
alter table public.work_order_messages add constraint work_order_messages_attachment_file_id_fkey
  foreign key (attachment_file_id) references public.files(id) on delete set null not valid;

-- validate (separate scan pass; SHARE UPDATE EXCLUSIVE only)
alter table public.accreditations validate constraint accreditations_delegation_id_fkey;
alter table public.asset_maintenance_history validate constraint asset_maintenance_history_schedule_id_fkey;
alter table public.assets validate constraint assets_xpms_atom_id_fkey;
alter table public.availability_slots validate constraint availability_slots_granted_to_org_id_fkey;
alter table public.availability_slots validate constraint availability_slots_talent_profile_id_fkey;
alter table public.availability_slots validate constraint availability_slots_venue_id_fkey;
alter table public.co_pro_partnerships validate constraint co_pro_partnerships_partner_org_id_fkey;
alter table public.compliance_documents validate constraint compliance_documents_file_id_fkey;
alter table public.contract_obligations validate constraint contract_obligations_task_id_fkey;
alter table public.conversations validate constraint conversations_recipient_org_id_fkey;
alter table public.crisis_broadcasts validate constraint crisis_broadcasts_notification_instance_id_fkey;
alter table public.event_milestones validate constraint event_milestones_project_id_fkey;
alter table public.event_milestones validate constraint event_milestones_talent_offer_id_fkey;
alter table public.event_resources validate constraint event_resources_reserved_movement_id_fkey;
alter table public.goods_receipt_lines validate constraint goods_receipt_lines_po_line_item_id_fkey;
alter table public.import_jobs validate constraint import_jobs_job_id_fkey;
alter table public.incidents validate constraint incidents_project_id_fkey;
alter table public.job_applications validate constraint job_applications_crew_member_id_fkey;
alter table public.job_postings validate constraint job_postings_project_id_fkey;
alter table public.notification_instances validate constraint notification_instances_event_id_fkey;
alter table public.open_call_submissions validate constraint open_call_submissions_crew_member_id_fkey;
alter table public.open_call_submissions validate constraint open_call_submissions_talent_profile_id_fkey;
alter table public.open_call_submissions validate constraint open_call_submissions_vendor_id_fkey;
alter table public.open_calls validate constraint open_calls_awarded_submission_id_fkey;
alter table public.open_calls validate constraint open_calls_project_id_fkey;
alter table public.opportunities validate constraint opportunities_contract_id_fkey;
alter table public.opportunity_activities validate constraint opportunity_activities_ucs_event_id_fkey;
alter table public.org_event_log_destinations validate constraint org_event_log_destinations_last_published_id_fkey;
alter table public.payroll_run_lines validate constraint payroll_run_lines_cost_center_id_fkey;
alter table public.pinboards validate constraint pinboards_xpms_atom_id_fkey;
alter table public.projects validate constraint projects_client_id_fkey;
alter table public.push_send_failures validate constraint push_send_failures_subscription_id_fkey;
alter table public.readiness_exercises validate constraint readiness_exercises_project_id_fkey;
alter table public.requisitions validate constraint requisitions_approval_instance_id_fkey;
alter table public.reviews validate constraint reviews_reviewer_org_id_fkey;
alter table public.reviews validate constraint reviews_subject_crew_member_id_fkey;
alter table public.reviews validate constraint reviews_subject_org_id_fkey;
alter table public.reviews validate constraint reviews_subject_talent_profile_id_fkey;
alter table public.reviews validate constraint reviews_subject_vendor_id_fkey;
alter table public.risks validate constraint risks_project_id_fkey;
alter table public.role_credentials validate constraint role_credentials_asset_id_fkey;
alter table public.role_documents validate constraint role_documents_contract_id_fkey;
alter table public.settlements validate constraint settlements_project_id_fkey;
alter table public.settlements validate constraint settlements_talent_offer_id_fkey;
alter table public.settlements validate constraint settlements_venue_id_fkey;
alter table public.sponsor_entitlements validate constraint sponsor_entitlements_sponsor_client_id_fkey;
alter table public.stage_plots validate constraint stage_plots_project_id_fkey;
alter table public.stage_plots validate constraint stage_plots_talent_profile_id_fkey;
alter table public.talent_offers validate constraint talent_offers_agency_id_fkey;
alter table public.talent_offers validate constraint talent_offers_open_call_submission_id_fkey;
alter table public.talent_offers validate constraint talent_offers_performance_agreement_proposal_id_fkey;
alter table public.talent_offers validate constraint talent_offers_previous_offer_id_fkey;
alter table public.talent_offers validate constraint talent_offers_project_id_fkey;
alter table public.talent_offers validate constraint talent_offers_stage_plot_id_fkey;
alter table public.talent_offers validate constraint talent_offers_tour_id_fkey;
alter table public.talent_offers validate constraint talent_offers_venue_id_fkey;
alter table public.tax_calculations validate constraint tax_calculations_jurisdiction_id_fkey;
alter table public.tax_calculations validate constraint tax_calculations_transaction_line_id_fkey;
alter table public.ticketing_connections validate constraint ticketing_connections_project_id_fkey;
alter table public.ticketing_connections validate constraint ticketing_connections_talent_offer_id_fkey;
alter table public.time_entries validate constraint time_entries_timesheet_id_fkey;
alter table public.timesheets validate constraint timesheets_approval_instance_id_fkey;
alter table public.timesheets validate constraint timesheets_invoice_tx_id_fkey;
alter table public.timesheets validate constraint timesheets_project_id_fkey;
alter table public.tours validate constraint tours_agency_id_fkey;
alter table public.transaction_lines validate constraint transaction_lines_account_id_fkey;
alter table public.transaction_lines validate constraint transaction_lines_cost_center_id_fkey;
alter table public.transaction_lines validate constraint transaction_lines_tax_calculation_id_fkey;
alter table public.transaction_parties validate constraint transaction_parties_address_id_fkey;
alter table public.transactions validate constraint transactions_contract_id_fkey;
alter table public.vendor_products validate constraint vendor_products_xpms_atom_id_fkey;
alter table public.venues validate constraint venues_location_id_fkey;
alter table public.venues validate constraint venues_project_id_fkey;
alter table public.work_order_messages validate constraint work_order_messages_attachment_file_id_fkey;

-- covering indexes for the new FKs
create index if not exists accreditations_delegation_id_idx on public.accreditations (delegation_id);
create index if not exists asset_maintenance_history_schedule_id_idx on public.asset_maintenance_history (schedule_id);
create index if not exists availability_slots_granted_to_org_id_idx on public.availability_slots (granted_to_org_id);
create index if not exists compliance_documents_file_id_idx on public.compliance_documents (file_id);
create index if not exists contract_obligations_task_id_idx on public.contract_obligations (task_id);
create index if not exists conversations_recipient_org_id_idx on public.conversations (recipient_org_id);
create index if not exists crisis_broadcasts_notification_instance_id_idx on public.crisis_broadcasts (notification_instance_id);
create index if not exists event_resources_reserved_movement_id_idx on public.event_resources (reserved_movement_id);
create index if not exists goods_receipt_lines_po_line_item_id_idx on public.goods_receipt_lines (po_line_item_id);
create index if not exists import_jobs_job_id_idx on public.import_jobs (job_id);
create index if not exists incidents_project_id_idx on public.incidents (project_id);
create index if not exists job_postings_project_id_idx on public.job_postings (project_id);
create index if not exists notification_instances_event_id_idx on public.notification_instances (event_id);
create index if not exists open_calls_awarded_submission_id_idx on public.open_calls (awarded_submission_id);
create index if not exists open_calls_project_id_idx on public.open_calls (project_id);
create index if not exists opportunities_contract_id_idx on public.opportunities (contract_id);
create index if not exists opportunity_activities_ucs_event_id_idx on public.opportunity_activities (ucs_event_id);
create index if not exists org_event_log_destinations_last_published_id_idx on public.org_event_log_destinations (last_published_id);
create index if not exists payroll_run_lines_cost_center_id_idx on public.payroll_run_lines (cost_center_id);
create index if not exists pinboards_xpms_atom_id_idx on public.pinboards (xpms_atom_id);
create index if not exists projects_client_id_idx on public.projects (client_id);
create index if not exists push_send_failures_subscription_id_idx on public.push_send_failures (subscription_id);
create index if not exists readiness_exercises_project_id_idx on public.readiness_exercises (project_id);
create index if not exists requisitions_approval_instance_id_idx on public.requisitions (approval_instance_id);
create index if not exists risks_project_id_idx on public.risks (project_id);
create index if not exists role_credentials_asset_id_idx on public.role_credentials (asset_id);
create index if not exists role_documents_contract_id_idx on public.role_documents (contract_id);
create index if not exists sponsor_entitlements_sponsor_client_id_idx on public.sponsor_entitlements (sponsor_client_id);
create index if not exists stage_plots_project_id_idx on public.stage_plots (project_id);
create index if not exists stage_plots_talent_profile_id_idx on public.stage_plots (talent_profile_id);
create index if not exists tax_calculations_jurisdiction_id_idx on public.tax_calculations (jurisdiction_id);
create index if not exists tax_calculations_transaction_line_id_idx on public.tax_calculations (transaction_line_id);
create index if not exists time_entries_timesheet_id_idx on public.time_entries (timesheet_id);
create index if not exists timesheets_approval_instance_id_idx on public.timesheets (approval_instance_id);
create index if not exists timesheets_invoice_tx_id_idx on public.timesheets (invoice_tx_id);
create index if not exists timesheets_project_id_idx on public.timesheets (project_id);
create index if not exists transaction_lines_account_id_idx on public.transaction_lines (account_id);
create index if not exists transaction_lines_cost_center_id_idx on public.transaction_lines (cost_center_id);
create index if not exists transaction_lines_tax_calculation_id_idx on public.transaction_lines (tax_calculation_id);
create index if not exists transaction_parties_address_id_idx on public.transaction_parties (address_id);
create index if not exists transactions_contract_id_idx on public.transactions (contract_id);
create index if not exists vendor_products_xpms_atom_id_idx on public.vendor_products (xpms_atom_id);
create index if not exists venues_location_id_idx on public.venues (location_id);
create index if not exists venues_project_id_idx on public.venues (project_id);
create index if not exists work_order_messages_attachment_file_id_idx on public.work_order_messages (attachment_file_id);
