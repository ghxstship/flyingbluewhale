-- Sweep 10 — cover unindexed foreign keys on the highest-leverage
-- multi-tenant filter columns: org_id (every authed query filters by it)
-- and project_id (most common second-axis filter), plus a tier of
-- common JOIN keys (contract_id, incident_id, event_id, asset_id, etc).
-- Total: 60+ indexes. Each statement is idempotent.

-- org_id indexes
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_accounts_org_id ON public.accounts(org_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_addresses_org_id ON public.addresses(org_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_audit_redaction_log_org_id ON public.audit_redaction_log(org_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_automation_subscriptions_org_id ON public.automation_subscriptions(org_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_calendars_org_id ON public.calendars(org_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_comment_threads_org_id ON public.comment_threads(org_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_contracts_org_id ON public.contracts(org_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_crew_certifications_org_id ON public.crew_certifications(org_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_crew_ratings_org_id ON public.crew_ratings(org_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_geofences_org_id ON public.geofences(org_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_integration_credentials_org_id ON public.integration_credentials(org_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_message_channels_org_id ON public.message_channels(org_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_notification_instances_org_id ON public.notification_instances(org_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_onboarding_steps_org_id ON public.onboarding_steps(org_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_opportunities_org_id ON public.opportunities(org_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_policy_rules_org_id ON public.policy_rules(org_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_record_grants_org_id ON public.record_grants(org_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_regulatory_filing_records_org_id ON public.regulatory_filing_records(org_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_routes_org_id ON public.routes(org_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_tags_org_id ON public.tags(org_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_accounting_period_state_transitions_org_id ON public.accounting_period_state_transitions(org_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_deliverable_state_transitions_org_id ON public.deliverable_state_transitions(org_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_production_phase_transitions_org_id ON public.production_phase_transitions(org_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_project_phase_transitions_org_id ON public.project_phase_transitions(org_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_subscription_state_transitions_org_id ON public.subscription_state_transitions(org_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;

-- project_id indexes
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_calendars_project_id ON public.calendars(project_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_contracts_project_id ON public.contracts(project_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_geofences_project_id ON public.geofences(project_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_message_channels_project_id ON public.message_channels(project_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_pay_rates_project_id ON public.pay_rates(project_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_slack_channel_mappings_project_id ON public.slack_channel_mappings(project_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_tasks_v2_project_id ON public.tasks_v2(project_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_transactions_project_id ON public.transactions(project_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_uqm_incidents_project_id ON public.uqm_incidents(project_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_vendor_scorecards_project_id ON public.vendor_scorecards(project_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;

-- High-traffic JOIN keys
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_contract_milestones_contract_id ON public.contract_milestones(contract_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_contract_obligations_contract_id ON public.contract_obligations(contract_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_contract_parties_contract_id ON public.contract_parties(contract_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_contract_signatures_contract_id ON public.contract_signatures(contract_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_contract_terms_contract_id ON public.contract_terms(contract_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_corrective_actions_incident_id ON public.corrective_actions(incident_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_crisis_broadcasts_incident_id ON public.crisis_broadcasts(incident_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_incident_attachments_file_id ON public.incident_attachments(file_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_incident_parties_incident_id ON public.incident_parties(incident_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_post_mortems_incident_id ON public.post_mortems(incident_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_event_dependencies_event_id ON public.event_dependencies(event_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON public.event_participants(event_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_event_resources_event_id ON public.event_resources(event_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_calendar_events_calendar_id ON public.calendar_events(calendar_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_asset_depreciation_schedule_asset_id ON public.asset_depreciation_schedule(asset_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_asset_identifiers_asset_id ON public.asset_identifiers(asset_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_asset_maintenance_history_asset_id ON public.asset_maintenance_history(asset_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_approval_decisions_instance_id ON public.approval_decisions(instance_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_journal_entries_period_id ON public.journal_entries(period_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_journal_entry_id ON public.journal_entry_lines(journal_entry_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_transaction_lines_transaction_id ON public.transaction_lines(transaction_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_message_mentions_message_id ON public.message_mentions(message_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_comment_mentions_comment_id ON public.comment_mentions(comment_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_form_submission_values_field_id ON public.form_submission_values(field_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_opportunity_activities_opportunity_id ON public.opportunity_activities(opportunity_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_task_status_history_task_id ON public.task_status_history(task_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_role_lifecycle_history_role_id ON public.role_lifecycle_history(role_id);
EXCEPTION WHEN undefined_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;
