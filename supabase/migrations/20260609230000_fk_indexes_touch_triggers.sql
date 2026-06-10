-- Schema hygiene sweep — companion to 20260609220000_ldp_status_rename.sql.
--
-- §1  Covering indexes for every public-schema FK whose referencing column
--     set had no index with those leading columns (discovered live).
-- §2  BEFORE UPDATE touch triggers for tables that have updated_at but no
--     trigger calling a touch function. Canonical function:
--     public.tg_set_updated_at (124 existing triggers use it).
-- §3  Drop dead table form_submission_values (0 rows, 0 code references).

-- ============================================================================
-- §1 — Missing FK covering indexes (51)
-- ============================================================================

create index if not exists idx_ai_proposal_drafts_created_by            on public.ai_proposal_drafts (created_by);
create index if not exists idx_ai_proposal_drafts_proposal_id           on public.ai_proposal_drafts (proposal_id);
create index if not exists idx_ai_schedule_suggestions_created_by       on public.ai_schedule_suggestions (created_by);
create index if not exists idx_ai_schedule_suggestions_project_id       on public.ai_schedule_suggestions (project_id);
create index if not exists idx_ap_invoice_extractions_uploaded_by       on public.ap_invoice_extractions (uploaded_by);
create index if not exists idx_assignments_project_id                   on public.assignments (project_id);
create index if not exists idx_bim_model_links_created_by               on public.bim_model_links (created_by);
create index if not exists idx_client_dashboards_client_id              on public.client_dashboards (client_id);
create index if not exists idx_client_dashboards_created_by             on public.client_dashboards (created_by);
create index if not exists idx_cues_depends_on_cue_id                   on public.cues (depends_on_cue_id);
create index if not exists idx_deliverables_rendered_by                 on public.deliverables (rendered_by);
create index if not exists idx_drawing_markup_layers_created_by         on public.drawing_markup_layers (created_by);
create index if not exists idx_inbound_email_messages_project_email_id  on public.inbound_email_messages (project_email_id);
create index if not exists idx_independent_contractor_msas_created_by   on public.independent_contractor_msas (created_by);
create index if not exists idx_independent_contractor_msas_superseded_by_msa_id on public.independent_contractor_msas (superseded_by_msa_id);
create index if not exists idx_kit_lines_catalog_item_id                on public.kit_lines (catalog_item_id);
create index if not exists idx_kit_lines_touchpoint_id                  on public.kit_lines (touchpoint_id);
create index if not exists idx_kit_lines_zone_id                        on public.kit_lines (zone_id);
create index if not exists idx_kit_options_catalog_item_id              on public.kit_options (catalog_item_id);
create index if not exists idx_kit_options_urid                         on public.kit_options (urid);
create index if not exists idx_kit_phase_gates_org_id                   on public.kit_phase_gates (org_id);
create index if not exists idx_kit_touchpoints_org_id                   on public.kit_touchpoints (org_id);
create index if not exists idx_meeting_action_items_closed_by           on public.meeting_action_items (closed_by);
create index if not exists idx_msa_state_transitions_transitioned_by    on public.msa_state_transitions (transitioned_by);
create index if not exists idx_notifications_actor_id                   on public.notifications (actor_id);
create index if not exists idx_notifications_project_id                 on public.notifications (project_id);
create index if not exists idx_pinboard_items_created_by                on public.pinboard_items (created_by);
create index if not exists idx_pinboards_created_by                     on public.pinboards (created_by);
create index if not exists idx_proposal_templates_created_by            on public.proposal_templates (created_by);
create index if not exists idx_proposal_views_viewer_user_id            on public.proposal_views (viewer_user_id);
create index if not exists idx_sheet_sets_created_by                    on public.sheet_sets (created_by);
create index if not exists idx_site_plans_approved_by                   on public.site_plans (approved_by);
create index if not exists idx_site_plans_submitted_by                  on public.site_plans (submitted_by);
create index if not exists idx_siteplan_adjacency_created_by            on public.siteplan_adjacency (created_by);
create index if not exists idx_siteplan_adjacency_updated_by            on public.siteplan_adjacency (updated_by);
create index if not exists idx_siteplan_band_created_by                 on public.siteplan_band (created_by);
create index if not exists idx_siteplan_band_updated_by                 on public.siteplan_band (updated_by);
create index if not exists idx_siteplan_placement_created_by            on public.siteplan_placement (created_by);
create index if not exists idx_siteplan_placement_updated_by            on public.siteplan_placement (updated_by);
create index if not exists idx_siteplan_station_created_by              on public.siteplan_station (created_by);
create index if not exists idx_siteplan_station_updated_by              on public.siteplan_station (updated_by);
create index if not exists idx_siteplan_utility_created_by              on public.siteplan_utility (created_by);
create index if not exists idx_siteplan_utility_updated_by              on public.siteplan_utility (updated_by);
create index if not exists idx_siteplan_zone_region_created_by          on public.siteplan_zone_region (created_by);
create index if not exists idx_siteplan_zone_region_updated_by          on public.siteplan_zone_region (updated_by);
create index if not exists idx_spec_sections_created_by                 on public.spec_sections (created_by);
create index if not exists idx_submittal_review_instances_chain_id      on public.submittal_review_instances (chain_id);
create index if not exists idx_submittal_review_instances_step_id       on public.submittal_review_instances (step_id);
create index if not exists idx_vendor_products_created_by               on public.vendor_products (created_by);
create index if not exists idx_workforce_demand_forecasts_created_by    on public.workforce_demand_forecasts (created_by);
create index if not exists idx_workforce_demand_forecasts_project_id    on public.workforce_demand_forecasts (project_id);

-- ============================================================================
-- §2 — Missing updated_at touch triggers (77)
-- ============================================================================

create trigger trg_touch_accounting_connections      before update on public.accounting_connections      for each row execute function public.tg_set_updated_at();
create trigger trg_touch_accounting_mapping_rules    before update on public.accounting_mapping_rules    for each row execute function public.tg_set_updated_at();
create trigger trg_touch_accounts                    before update on public.accounts                    for each row execute function public.tg_set_updated_at();
create trigger trg_touch_ai_agents                   before update on public.ai_agents                   for each row execute function public.tg_set_updated_at();
create trigger trg_touch_ap_invoice_extractions      before update on public.ap_invoice_extractions      for each row execute function public.tg_set_updated_at();
create trigger trg_touch_assets                      before update on public.assets                      for each row execute function public.tg_set_updated_at();
create trigger trg_touch_automation_schedules        before update on public.automation_schedules        for each row execute function public.tg_set_updated_at();
create trigger trg_touch_bim_models                  before update on public.bim_models                  for each row execute function public.tg_set_updated_at();
create trigger trg_touch_calendar_events             before update on public.calendar_events             for each row execute function public.tg_set_updated_at();
create trigger trg_touch_call_sheets                 before update on public.call_sheets                 for each row execute function public.tg_set_updated_at();
create trigger trg_touch_change_order_markup_rules   before update on public.change_order_markup_rules   for each row execute function public.tg_set_updated_at();
create trigger trg_touch_client_dashboards           before update on public.client_dashboards           for each row execute function public.tg_set_updated_at();
create trigger trg_touch_contract_envelopes          before update on public.contract_envelopes          for each row execute function public.tg_set_updated_at();
create trigger trg_touch_contracts                   before update on public.contracts                   for each row execute function public.tg_set_updated_at();
create trigger trg_touch_cost_database_items         before update on public.cost_database_items         for each row execute function public.tg_set_updated_at();
create trigger trg_touch_cost_databases              before update on public.cost_databases              for each row execute function public.tg_set_updated_at();
create trigger trg_touch_cost_forecast_lines         before update on public.cost_forecast_lines         for each row execute function public.tg_set_updated_at();
create trigger trg_touch_cost_forecasts              before update on public.cost_forecasts              for each row execute function public.tg_set_updated_at();
create trigger trg_touch_dashboards                  before update on public.dashboards                  for each row execute function public.tg_set_updated_at();
create trigger trg_touch_drawing_markup_layers       before update on public.drawing_markup_layers       for each row execute function public.tg_set_updated_at();
create trigger trg_touch_drawing_markups             before update on public.drawing_markups             for each row execute function public.tg_set_updated_at();
create trigger trg_touch_estimate_lines              before update on public.estimate_lines              for each row execute function public.tg_set_updated_at();
create trigger trg_touch_estimates                   before update on public.estimates                   for each row execute function public.tg_set_updated_at();
create trigger trg_touch_id_sequences                before update on public.id_sequences                for each row execute function public.tg_set_updated_at();
create trigger trg_touch_import_jobs                 before update on public.import_jobs                 for each row execute function public.tg_set_updated_at();
create trigger trg_touch_invoice_reminders           before update on public.invoice_reminders           for each row execute function public.tg_set_updated_at();
create trigger trg_touch_itb_invitations             before update on public.itb_invitations             for each row execute function public.tg_set_updated_at();
create trigger trg_touch_itb_packages                before update on public.itb_packages                for each row execute function public.tg_set_updated_at();
create trigger trg_touch_kit_lines                   before update on public.kit_lines                   for each row execute function public.tg_set_updated_at();
create trigger trg_touch_lien_waivers                before update on public.lien_waivers                for each row execute function public.tg_set_updated_at();
create trigger trg_touch_master_catalog_items        before update on public.master_catalog_items        for each row execute function public.tg_set_updated_at();
create trigger trg_touch_meeting_action_items        before update on public.meeting_action_items        for each row execute function public.tg_set_updated_at();
create trigger trg_touch_meetings                    before update on public.meetings                    for each row execute function public.tg_set_updated_at();
create trigger trg_touch_notification_preferences    before update on public.notification_preferences    for each row execute function public.tg_set_updated_at();
create trigger trg_touch_opportunities               before update on public.opportunities               for each row execute function public.tg_set_updated_at();
create trigger trg_touch_org_entities                before update on public.org_entities                for each row execute function public.tg_set_updated_at();
create trigger trg_touch_org_sso_providers           before update on public.org_sso_providers           for each row execute function public.tg_set_updated_at();
create trigger trg_touch_parties                     before update on public.parties                     for each row execute function public.tg_set_updated_at();
create trigger trg_touch_partner_integrations        before update on public.partner_integrations        for each row execute function public.tg_set_updated_at();
create trigger trg_touch_payroll_run_lines           before update on public.payroll_run_lines           for each row execute function public.tg_set_updated_at();
create trigger trg_touch_payroll_runs                before update on public.payroll_runs                for each row execute function public.tg_set_updated_at();
create trigger trg_touch_pinboard_items              before update on public.pinboard_items              for each row execute function public.tg_set_updated_at();
create trigger trg_touch_pinboards                   before update on public.pinboards                   for each row execute function public.tg_set_updated_at();
create trigger trg_touch_places                      before update on public.places                      for each row execute function public.tg_set_updated_at();
create trigger trg_touch_project_emails              before update on public.project_emails              for each row execute function public.tg_set_updated_at();
create trigger trg_touch_project_members             before update on public.project_members             for each row execute function public.tg_set_updated_at();
create trigger trg_touch_project_templates           before update on public.project_templates           for each row execute function public.tg_set_updated_at();
create trigger trg_touch_reality_captures            before update on public.reality_captures            for each row execute function public.tg_set_updated_at();
create trigger trg_touch_resource_forecast_lines     before update on public.resource_forecast_lines     for each row execute function public.tg_set_updated_at();
create trigger trg_touch_resource_forecasts          before update on public.resource_forecasts          for each row execute function public.tg_set_updated_at();
create trigger trg_touch_schedule_activities         before update on public.schedule_activities         for each row execute function public.tg_set_updated_at();
create trigger trg_touch_schedule_baselines          before update on public.schedule_baselines          for each row execute function public.tg_set_updated_at();
create trigger trg_touch_schedule_calendars          before update on public.schedule_calendars          for each row execute function public.tg_set_updated_at();
create trigger trg_touch_search_documents            before update on public.search_documents            for each row execute function public.tg_set_updated_at();
create trigger trg_touch_share_links                 before update on public.share_links                 for each row execute function public.tg_set_updated_at();
create trigger trg_touch_sheet_set_versions          before update on public.sheet_set_versions          for each row execute function public.tg_set_updated_at();
create trigger trg_touch_sheet_sets                  before update on public.sheet_sets                  for each row execute function public.tg_set_updated_at();
create trigger trg_touch_slack_workspaces            before update on public.slack_workspaces            for each row execute function public.tg_set_updated_at();
create trigger trg_touch_spec_section_items          before update on public.spec_section_items          for each row execute function public.tg_set_updated_at();
create trigger trg_touch_spec_sections               before update on public.spec_sections               for each row execute function public.tg_set_updated_at();
create trigger trg_touch_submittal_review_chain_steps before update on public.submittal_review_chain_steps for each row execute function public.tg_set_updated_at();
create trigger trg_touch_submittal_review_chains     before update on public.submittal_review_chains     for each row execute function public.tg_set_updated_at();
create trigger trg_touch_submittal_review_instances  before update on public.submittal_review_instances  for each row execute function public.tg_set_updated_at();
create trigger trg_touch_subscriptions               before update on public.subscriptions               for each row execute function public.tg_set_updated_at();
create trigger trg_touch_takeoffs                    before update on public.takeoffs                    for each row execute function public.tg_set_updated_at();
create trigger trg_touch_teams                       before update on public.teams                       for each row execute function public.tg_set_updated_at();
create trigger trg_touch_time_clock_zones            before update on public.time_clock_zones            for each row execute function public.tg_set_updated_at();
create trigger trg_touch_time_off_balances           before update on public.time_off_balances           for each row execute function public.tg_set_updated_at();
create trigger trg_touch_transactions                before update on public.transactions                for each row execute function public.tg_set_updated_at();
create trigger trg_touch_transmittals                before update on public.transmittals                for each row execute function public.tg_set_updated_at();
create trigger trg_touch_uis_roles                   before update on public.uis_roles                   for each row execute function public.tg_set_updated_at();
create trigger trg_touch_union_local_rates           before update on public.union_local_rates           for each row execute function public.tg_set_updated_at();
create trigger trg_touch_vendor_products             before update on public.vendor_products             for each row execute function public.tg_set_updated_at();
create trigger trg_touch_vendor_scorecards           before update on public.vendor_scorecards           for each row execute function public.tg_set_updated_at();
create trigger trg_touch_view_configs                before update on public.view_configs                for each row execute function public.tg_set_updated_at();
create trigger trg_touch_wage_determinations         before update on public.wage_determinations         for each row execute function public.tg_set_updated_at();
create trigger trg_touch_warranties                  before update on public.warranties                  for each row execute function public.tg_set_updated_at();

-- ============================================================================
-- §3 — Dead table (verified: 0 rows, 0 references in src/ or scripts/)
-- ============================================================================

drop table public.form_submission_values;
