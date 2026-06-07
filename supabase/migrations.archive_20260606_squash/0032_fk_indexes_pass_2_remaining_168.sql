DO $migrate$ BEGIN
  -- Pass 2 of FK index coverage. Pass 1 was 20260509100001 (60+ hot-path
-- indexes); this completes the remaining 168 unindexed FKs surfaced by the
-- Supabase performance advisor. CREATE INDEX IF NOT EXISTS keeps the
-- migration idempotent. We intentionally don't use CONCURRENTLY because
-- apply_migration wraps in a transaction (CONCURRENTLY can't co-exist).
-- All target tables are low-write, so the brief SHARE lock is acceptable.

create index if not exists idx_accounting_periods_closed_by on public.accounting_periods (closed_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_ai_agents_created_by on public.ai_agents (created_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_annotations_confirmed_by on public.annotations (confirmed_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_annotations_created_by on public.annotations (created_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_annotations_linked_task_id on public.annotations (linked_task_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_annotations_resolved_by on public.annotations (resolved_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_approval_decisions_decision_attachment_file_id on public.approval_decisions (decision_attachment_file_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_approval_decisions_step_id on public.approval_decisions (step_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_approval_instances_current_step_id on public.approval_instances (current_step_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_approval_instances_initiated_by on public.approval_instances (initiated_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_approval_instances_policy_id on public.approval_instances (policy_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_approval_policies_prior_version_id on public.approval_policies (prior_version_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_approval_steps_escalation_step_id on public.approval_steps (escalation_step_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_asset_locations_custodian_party_id on public.asset_locations (custodian_party_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_asset_locations_geofence_id on public.asset_locations (geofence_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_asset_locations_place_id on public.asset_locations (place_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_asset_maintenance_history_performed_by on public.asset_maintenance_history (performed_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_asset_movements_from_custodian_id on public.asset_movements (from_custodian_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_asset_movements_from_place_id on public.asset_movements (from_place_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_asset_movements_recorded_by on public.asset_movements (recorded_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_asset_movements_to_custodian_id on public.asset_movements (to_custodian_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_asset_movements_to_place_id on public.asset_movements (to_place_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_asset_relationships_child_asset_id on public.asset_relationships (child_asset_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_asset_relationships_parent_asset_id on public.asset_relationships (parent_asset_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_audit_redaction_log_dsar_request_id on public.audit_redaction_log (dsar_request_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_audit_redaction_log_redacted_by on public.audit_redaction_log (redacted_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_automation_runs_triggered_by on public.automation_runs (triggered_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_calendar_events_parent_event_id on public.calendar_events (parent_event_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_calendar_events_place_id on public.calendar_events (place_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_calendar_subscriptions_calendar_id on public.calendar_subscriptions (calendar_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_call_sheets_created_by on public.call_sheets (created_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_chart_of_accounts_parent_account_id on public.chart_of_accounts (parent_account_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_comment_attachments_file_id on public.comment_attachments (file_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_comment_threads_resolved_by on public.comment_threads (resolved_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_config_history_changed_by on public.config_history (changed_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_config_values_set_by on public.config_values (set_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_contract_milestones_invoice_tx_id on public.contract_milestones (invoice_tx_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_contract_renewals_renewal_contract_id on public.contract_renewals (renewal_contract_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_contract_renewals_source_contract_id on public.contract_renewals (source_contract_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_contract_signatures_signed_pdf_file_id on public.contract_signatures (signed_pdf_file_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_contract_signatures_version_id on public.contract_signatures (version_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_contract_versions_body_file_id on public.contract_versions (body_file_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_contract_versions_prior_version_id on public.contract_versions (prior_version_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_contracts_parent_contract_id on public.contracts (parent_contract_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_corrective_actions_task_id on public.corrective_actions (task_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_cost_centers_parent_id on public.cost_centers (parent_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_crew_certifications_certification_id on public.crew_certifications (certification_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_crew_certifications_verified_by on public.crew_certifications (verified_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_crew_ratings_rated_by_user_id on public.crew_ratings (rated_by_user_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_currency_conversion_log_rate_id on public.currency_conversion_log (rate_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_dashboards_updated_by on public.dashboards (updated_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_data_export_jobs_initiated_by on public.data_export_jobs (initiated_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_data_export_jobs_result_file_id on public.data_export_jobs (result_file_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_deliverables_closed_by on public.deliverables (closed_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_event_dependencies_depends_on_event_id on public.event_dependencies (depends_on_event_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_event_recurrence_exceptions_parent_event_id on public.event_recurrence_exceptions (parent_event_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_event_recurrence_exceptions_replacement_event_id on public.event_recurrence_exceptions (replacement_event_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_event_resources_asset_id on public.event_resources (asset_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_exchange_rates_to_currency on public.exchange_rates (to_currency);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_feature_flag_cohorts_flag_key on public.feature_flag_cohorts (flag_key);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_file_access_log_accessed_by on public.file_access_log (accessed_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_file_relations_created_by on public.file_relations (created_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_file_versions_prior_version_id on public.file_versions (prior_version_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_file_versions_uploaded_by on public.file_versions (uploaded_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_files_uploaded_by on public.files (uploaded_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_form_definitions_prior_version_id on public.form_definitions (prior_version_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_form_drafts_form_definition_id on public.form_drafts (form_definition_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_form_drafts_party_id on public.form_drafts (party_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_goods_receipt_lines_asset_id on public.goods_receipt_lines (asset_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_goods_receipt_lines_receipt_id on public.goods_receipt_lines (receipt_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_goods_receipts_po_id on public.goods_receipts (po_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_id_sequences_namespace on public.id_sequences (namespace);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_import_jobs_created_by on public.import_jobs (created_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_incidents_closed_by on public.incidents (closed_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_integration_credentials_created_by on public.integration_credentials (created_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_integration_credentials_integration_id on public.integration_credentials (integration_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_integration_webhook_endpoints_integration_id on public.integration_webhook_endpoints (integration_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_invoice_reminders_created_by on public.invoice_reminders (created_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_journal_entries_posted_by on public.journal_entries (posted_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_journal_entries_reversal_of on public.journal_entries (reversal_of);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_knowledge_articles_collection_id on public.knowledge_articles (collection_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_knowledge_collections_parent_id on public.knowledge_collections (parent_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_knowledge_relations_from_article_id on public.knowledge_relations (from_article_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_knowledge_relations_to_article_id on public.knowledge_relations (to_article_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_knowledge_revisions_edited_by on public.knowledge_revisions (edited_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_locales_fallback on public.locales (fallback);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_message_attachments_file_id on public.message_attachments (file_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_notification_deliveries_instance_id on public.notification_deliveries (instance_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_notification_instances_template_id on public.notification_instances (template_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_onboarding_steps_completed_by on public.onboarding_steps (completed_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_opportunities_account_id on public.opportunities (account_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_opportunities_current_stage_id on public.opportunities (current_stage_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_opportunities_pipeline_id on public.opportunities (pipeline_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_opportunity_activities_recorded_by on public.opportunity_activities (recorded_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_opportunity_stage_history_from_stage_id on public.opportunity_stage_history (from_stage_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_opportunity_stage_history_opportunity_id on public.opportunity_stage_history (opportunity_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_opportunity_stage_history_to_stage_id on public.opportunity_stage_history (to_stage_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_opportunity_value_history_opportunity_id on public.opportunity_value_history (opportunity_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_opportunity_value_history_recorded_by on public.opportunity_value_history (recorded_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_org_scim_tokens_created_by on public.org_scim_tokens (created_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_parties_address_id on public.parties (address_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_party_aliases_party_id on public.party_aliases (party_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_party_identities_party_id on public.party_identities (party_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_party_merge_log_merged_by on public.party_merge_log (merged_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_party_merge_log_surviving_party_id on public.party_merge_log (surviving_party_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_party_relationships_from_party_id on public.party_relationships (from_party_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_party_relationships_to_party_id on public.party_relationships (to_party_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_payment_processor_records_transaction_id on public.payment_processor_records (transaction_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_places_address_id on public.places (address_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_po_invoice_matches_invoice_tx_id on public.po_invoice_matches (invoice_tx_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_po_invoice_matches_po_id on public.po_invoice_matches (po_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_po_invoice_matches_receipt_id on public.po_invoice_matches (receipt_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_po_invoice_matches_resolved_by on public.po_invoice_matches (resolved_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_post_mortems_ukb_article_id on public.post_mortems (ukb_article_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_project_templates_created_by on public.project_templates (created_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_purchase_orders_contract_id on public.purchase_orders (contract_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_record_grants_granted_by on public.record_grants (granted_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_regulatory_filing_lines_filing_id on public.regulatory_filing_lines (filing_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_regulatory_filing_records_filed_by on public.regulatory_filing_records (filed_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_regulatory_filing_records_jurisdiction_id on public.regulatory_filing_records (jurisdiction_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_regulatory_filing_records_rendered_file_id on public.regulatory_filing_records (rendered_file_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_report_runs_initiated_by on public.report_runs (initiated_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_report_runs_report_id on public.report_runs (report_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_report_runs_result_file_id on public.report_runs (result_file_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_report_subscriptions_report_id on public.report_subscriptions (report_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_rfis_closed_by on public.rfis (closed_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_role_certifications_certification_id on public.role_certifications (certification_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_role_credentials_role_id on public.role_credentials (role_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_role_documents_file_id on public.role_documents (file_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_role_documents_role_id on public.role_documents (role_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_role_lifecycle_history_actor_party_id on public.role_lifecycle_history (actor_party_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_role_permissions_permission_key on public.role_permissions (permission_key);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_share_links_created_by on public.share_links (created_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_share_links_revoked_by on public.share_links (revoked_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_slack_workspaces_installed_by on public.slack_workspaces (installed_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_submittals_closed_by on public.submittals (closed_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_sync_conflict_log_sync_run_id on public.sync_conflict_log (sync_run_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_sync_definitions_integration_id on public.sync_definitions (integration_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_sync_runs_sync_definition_id on public.sync_runs (sync_definition_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_tag_assignments_assigned_by on public.tag_assignments (assigned_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_tag_synonyms_primary_tag_id on public.tag_synonyms (primary_tag_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_tag_synonyms_synonym_tag_id on public.tag_synonyms (synonym_tag_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_tags_parent_tag_id on public.tags (parent_tag_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_task_dependencies_depends_on_task_id on public.task_dependencies (depends_on_task_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_task_recurring_definitions_template_task_id on public.task_recurring_definitions (template_task_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_tax_jurisdictions_parent_id on public.tax_jurisdictions (parent_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_tax_rates_category_code on public.tax_rates (category_code);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_teams_owner_id on public.teams (owner_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_timesheet_approvals_timesheet_id on public.timesheet_approvals (timesheet_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_transaction_status_history_transaction_id on public.transaction_status_history (transaction_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_transactions_parent_transaction_id on public.transactions (parent_transaction_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_translations_locale on public.translations (locale);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_translations_reviewed_by on public.translations (reviewed_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_ucm_comments_parent_comment_id on public.ucm_comments (parent_comment_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_ucm_comments_thread_id on public.ucm_comments (thread_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_ufs_form_submissions_form_definition_id on public.ufs_form_submissions (form_definition_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_uqm_incidents_asset_id on public.uqm_incidents (asset_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_uqm_incidents_place_id on public.uqm_incidents (place_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_uqm_incidents_severity_level on public.uqm_incidents (severity_level);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_vendor_scorecards_rated_by on public.vendor_scorecards (rated_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_view_configs_updated_by on public.view_configs (updated_by);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_withholding_rules_jurisdiction_id on public.withholding_rules (jurisdiction_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_wizard_definitions_prior_version_id on public.wizard_definitions (prior_version_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_wizard_instances_current_step_id on public.wizard_instances (current_step_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_wizard_instances_share_token_id on public.wizard_instances (share_token_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_wizard_step_completions_step_id on public.wizard_step_completions (step_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_wizard_step_dependencies_depends_on_step_id on public.wizard_step_dependencies (depends_on_step_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create index if not exists idx_wizard_step_dependencies_step_id on public.wizard_step_dependencies (step_id);
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
