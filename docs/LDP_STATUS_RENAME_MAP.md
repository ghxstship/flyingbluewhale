# LDP Status-Column Rename Map — Phase 6 (2026-06-09)

Approved decision (audit plan §6.3): **no legacy references** — every bare
`status` column on a base table renames to an LDP-conformant `*_state`
column (or is dropped where a canonical synced twin already exists).
Naming follows the established house pattern: `<entity-noun>_state`
(`request_state`, `baseline_state`, `swap_state`, …). Enum TYPE names are
unchanged (LDP naming discipline governs columns).

## Renames (66 tables)

| Table                        | Old    | New                    |
| ---------------------------- | ------ | ---------------------- |
| accreditation_changes        | status | change_state           |
| ad_manifests                 | status | manifest_state         |
| annotations                  | status | annotation_state       |
| automation_runs              | status | run_state              |
| automation_step_runs         | status | step_state             |
| campaigns                    | status | campaign_state         |
| contract_envelope_signers    | status | signer_state           |
| cues                         | status | cue_state              |
| daily_logs                   | status | log_state              |
| delegation_entries           | status | entry_state            |
| dispatch_runs                | status | run_state              |
| dsar_requests                | status | request_state          |
| equipment                    | status | equipment_state        |
| events                       | status | event_state            |
| expenses                     | status | expense_state          |
| export_runs                  | status | run_state              |
| form_defs                    | status | form_state             |
| governance_policies          | status | policy_state           |
| guard_tours                  | status | tour_state             |
| import_runs                  | status | run_state              |
| incidents                    | status | incident_state         |
| inspections                  | status | inspection_state       |
| invites                      | status | invite_state           |
| invoice_reminders            | status | reminder_state         |
| invoices                     | status | invoice_state          |
| itil_changes                 | status | change_state           |
| itil_problems                | status | problem_state          |
| major_incidents              | status | incident_state         |
| notification_deliveries      | status | delivery_state         |
| notification_templates       | status | template_state         |
| offer_letters                | status | letter_state           |
| org_integrations             | status | integration_state      |
| payment_applications         | status | application_state      |
| playbooks                    | status | playbook_state         |
| po_change_orders             | status | change_order_state     |
| po_checklist_items           | status | item_state             |
| proposal_phase_states        | status | phase_state            |
| proposals                    | status | proposal_state         |
| punch_items                  | status | item_state             |
| punch_lists                  | status | list_state             |
| purchase_orders              | status | po_state               |
| rate_card_orders             | status | order_state            |
| regulatory_filing_records    | status | filing_state           |
| report_runs                  | status | run_state              |
| requisitions                 | status | requisition_state      |
| rfis                         | status | rfi_state              |
| rfqs                         | status | rfq_state              |
| risks                        | status | risk_state             |
| role_documents               | status | document_state         |
| safeguarding_reports         | status | report_state           |
| safety_briefings             | status | briefing_state         |
| service_requests             | status | request_state          |
| settlements                  | status | settlement_state       |
| sponsor_entitlements         | status | entitlement_state      |
| submittals                   | status | submittal_state        |
| sync_runs                    | status | run_state              |
| tasks                        | status | task_state             |
| threats                      | status | threat_state           |
| tours                        | status | tour_state             |
| trademarks                   | status | trademark_state        |
| vendor_prequalifications     | status | prequalification_state |
| venue_closeout_items         | status | item_state             |
| venue_design_specs           | status | spec_state             |
| venue_handover_items         | status | item_state             |
| venue_vop_sections           | status | section_state          |
| visa_cases                   | status | case_state             |
| wizard_definitions           | status | definition_state       |
| work_order_broadcast_invites | status | invite_state           |
| work_order_broadcasts        | status | broadcast_state        |

## Drops (6 tables — canonical synced twin already live)

| Table                 | Dropped | Canonical column (already populated + synced) |
| --------------------- | ------- | --------------------------------------------- |
| fabrication_orders    | status  | production_phase                              |
| job_applications      | status  | job_application_state                         |
| job_postings          | status  | job_posting_phase                             |
| open_calls            | status  | open_call_phase                               |
| open_call_submissions | status  | submission_state                              |
| talent_offers         | status  | talent_offer_state                            |

The matching `private.sync_*` / `tg_fabrication_orders_phase_to_status`
dual-write trigger functions are dropped with the columns.

## Function bodies patched in the same migration

plpgsql sources do not auto-update on column rename. Patched: accept_invite,
accept/decline/get/record/snapshot offer-letter functions,
annotations_notify, budgets_recompute_actual, expenses_sync_receipt_state,
generate_wip_snapshot_for_project, seed_cornbread_abbey_road,
seed_salvage_city_ssot, submit_marketplace_inquiry, sync_budget_for_bucket,
tg_action_item_to_task, tg_check_vendor_compliance,
tg_inspection_item_to_punch, tg_je_period_lock,
tg_sync_budget_spent_on_invoice.

## Code-sweep rule

References are mapped **by table**, never by global replace (multiple
tables share `run_state` / `item_state` / `request_state`). Public views
(`public_job_board` etc.) re-expose their own aliased columns and are
re-created in the migration where they referenced a renamed/dropped column.
