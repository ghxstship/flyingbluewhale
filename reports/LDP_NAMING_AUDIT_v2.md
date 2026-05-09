# LDP Naming Audit — v2 (post-apply)

**Protocol:** LDP — naming discipline (locked)
**Run:** Phase 0 re-audit, 2026-05-09
**Method:** direct SQL `information_schema.columns` query against live `xrovijzjbyssajhtwvas`

> Comprehensive inventory of every column in `public` schema whose name carries lifecycle meaning, classified against LDP's locked vocabulary (`phase` = sequential macro arc · `state` = cyclical operational · `status` = banned in new schema).

---

## Inventory totals (live DB)

| Category                                                         | Count                                                                                |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Public tables                                                    | 412                                                                                  |
| Public enum types                                                | 98                                                                                   |
| `*_state` columns, typed enum (LDP-correct)                      | **22**                                                                               |
| `*_phase` columns                                                | **3** (xpms_phase × 2 + production_phase)                                            |
| `*_stage` column                                                 | 1 (`leads.stage lead_stage`)                                                         |
| `*_status` columns, typed enum (cosmetic naming violation)       | **27**                                                                               |
| `*_status` columns, untyped text + CHECK or default-only (worse) | **~58**                                                                              |
| Hybrid `*_phase_status` enum                                     | 0 (renamed to `proposal_phase_state` this session)                                   |
| Same enum reused across multiple tables                          | 2 (`xpms_phase` on projects+xpms_atoms; `upo_state` on purchase_orders+requisitions) |

**Naming compliance rate:** ~25 / ~110 lifecycle-bearing columns = **~23%** LDP-name-compliant. (v1 reported ~20% on a smaller surface; absolute number of compliant columns grew but proportion barely moved because so many text-status columns were uncovered.)

---

## A. `*_state` columns (LDP-correct naming) — 22 total

| Column                           | Enum / type               | Lifecycle owned                        | Verdict                                                        |
| -------------------------------- | ------------------------- | -------------------------------------- | -------------------------------------------------------------- |
| `accounting_periods.state`       | `accounting_period_state` | LDP §7 Financial Period                | ✅ **NEW this session**                                        |
| `accreditations.state`           | `accreditation_state`     | engagement-doc adjacent                | ✅                                                             |
| `approval_instances.state`       | text                      | UAS approval                           | ⚠️ untyped                                                     |
| `assets.state`                   | `ual_state`               | LDP §3 Asset                           | ✅                                                             |
| `calendar_events.state`          | `ucs_event_state`         | UCS calendar                           | ✅                                                             |
| `contract_milestones.state`      | text                      | UCT milestone                          | ⚠️ untyped                                                     |
| `contract_obligations.state`     | text                      | UCT obligation                         | ⚠️ untyped                                                     |
| `contract_signatures.state`      | text                      | UCT signature                          | ⚠️ untyped                                                     |
| `contracts.state`                | `uct_state`               | UCT contract                           | ✅                                                             |
| `form_drafts.state`              | jsonb                     | form draft (form-state, not lifecycle) | ⚠️ jsonb                                                       |
| `import_jobs.state`              | `import_job_state`        | platform-utility job                   | ✅                                                             |
| `job_queue.state`                | `job_state`               | platform-utility                       | ✅                                                             |
| `proposal_approvals.state`       | `approval_state`          | UAS                                    | ✅                                                             |
| `proposal_change_orders.state`   | `change_order_state`      | UPO                                    | ✅                                                             |
| `proposal_revision_rounds.state` | `revision_state`          | UFS-adjacent                           | ✅                                                             |
| `purchase_orders.state`          | `upo_state`               | UPO                                    | ✅ — **but coexists with `status po_status` (P1 CONFLATION)**  |
| `requisitions.state`             | `upo_state`               | UPO                                    | ✅ — **but coexists with `status req_status` (P1 CONFLATION)** |
| `rosters.state`                  | `roster_state`            | workforce                              | ✅                                                             |
| `subscriptions.state`            | `subscription_state`      | LDP §8 Subscription                    | ✅ **NEW this session**                                        |
| `tasks_v2.state`                 | `utm_state`               | UTM task                               | ✅                                                             |
| `timesheets.state`               | `utt_timesheet_state`     | UTT                                    | ✅                                                             |
| `transactions.state`             | `utx_state`               | UTX                                    | ✅                                                             |
| `uqm_incidents.state`            | `uqm_state`               | UQM                                    | ✅                                                             |
| `webhook_deliveries.state`       | text                      | platform-utility                       | ⚠️ untyped                                                     |
| `wizard_instances.state`         | text                      | onboarding wizard                      | ⚠️ untyped                                                     |
| `wizard_step_completions.state`  | text                      | onboarding wizard                      | ⚠️ untyped                                                     |
| `xpms_atoms.state`               | `xpms_state`              | XPMS atom (uac/tpc)                    | ✅                                                             |

**Subtotal:** 17 typed-enum (LDP-correct) + 5 untyped text + 1 jsonb non-lifecycle + 1 ui_state jsonb (not a lifecycle).

---

## B. `*_phase` / `*_stage` columns — 4 total

| Column                                | Enum                                                        | Lifecycle owned   | Verdict                                                   |
| ------------------------------------- | ----------------------------------------------------------- | ----------------- | --------------------------------------------------------- |
| `projects.xpms_phase`                 | `xpms_phase` (8 values, LDP §1 match)                       | LDP §1 Project    | ⚠️ should be `project_phase`; enum reused with xpms_atoms |
| `xpms_atoms.phase`                    | `xpms_phase` (reused)                                       | XPMS atom phase   | ⚠️ enum reuse — LDP §SCHEMA DON'T                         |
| `fabrication_orders.production_phase` | `production_phase` (9 values, LDP §2 exact)                 | LDP §2 Production | ✅ **NEW this session**                                   |
| `leads.stage`                         | `lead_stage` (6: new/qualified/contacted/proposal/won/lost) | URM pipeline      | ⚠️ "stage" is third LDP word; conventional CRM kanban     |

---

## C. `status` columns — defect candidates per LDP §NAMING DISCIPLINE

### C.1 Typed-enum status columns (S3 cosmetic name-only; safe rename) — 27

| Table                    | Enum                                                                       | Maps to LDP lifecycle                                            | Severity   |
| ------------------------ | -------------------------------------------------------------------------- | ---------------------------------------------------------------- | ---------- |
| `annotations`            | `annotation_status` (4)                                                    | comment/annotation moderation                                    | low        |
| `automation_runs`        | `automation_run_status` (5)                                                | job runner                                                       | low        |
| `deliverables`           | `deliverable_status` (6)                                                   | **LDP §4 Deliverable**                                           | **medium** |
| `dsar_requests`          | `dsar_status` (5)                                                          | privacy/GDPR                                                     | low        |
| `equipment`              | `equipment_status` (5)                                                     | LDP §3 Asset (legacy; UAL canonical is `assets.state`)           | low        |
| `events`                 | `event_status` (5)                                                         | UCS event (legacy; UCS canonical is `calendar_events.state`)     | low        |
| `expenses`               | `expense_status` (4)                                                       | ULG expense                                                      | low        |
| `export_runs`            | `export_status` (4)                                                        | platform-utility                                                 | low        |
| `gdpr_user_expenses`     | `expense_status` (reused)                                                  | privacy view                                                     | low        |
| `incidents`              | `incident_status` (4)                                                      | safety incident (legacy; UQM canonical is `uqm_incidents.state`) | low        |
| `invoices`               | `invoice_status` (5)                                                       | UTX (legacy; canonical is `transactions.state`)                  | low        |
| `job_applications`       | `job_application_status` (7)                                               | LDP §5 Engagement (per-channel)                                  | medium     |
| `job_postings`           | `job_posting_status` (4)                                                   | URM-adjacent                                                     | low        |
| `offer_letters`          | `offer_letter_status` (now 11 incl COUNTERSIGNED/ACTIVE/SUPERSEDED/VOIDED) | **LDP §6 Engagement-Document**                                   | **medium** |
| `offer_letters_resolved` | `offer_letter_status` (view)                                               | LDP §6 view                                                      | low        |
| `open_call_submissions`  | `submission_status` (5)                                                    | LDP §5 Engagement (per-channel)                                  | medium     |
| `open_calls`             | `open_call_status` (5)                                                     | URM-adjacent                                                     | low        |
| `projects`               | `project_status` (5)                                                       | active/paused (operational; coexists with `xpms_phase`)          | low        |
| `proposal_phase_states`  | `proposal_phase_state` (5)                                                 | proposal phase tracking                                          | low        |
| `proposals`              | `proposal_status` (6)                                                      | LDP §6 Engagement-Document (lighter machine)                     | medium     |
| `purchase_orders`        | `po_status` (5)                                                            | UPO (**P1 CONFLATION** — coexists with `state upo_state`)        | **HIGH**   |
| `requisitions`           | `req_status` (5)                                                           | UPO (**P1 CONFLATION** — coexists with `state upo_state`)        | **HIGH**   |
| `risks`                  | `risk_status` (4)                                                          | risk register                                                    | low        |
| `settlements`            | `settlement_status` (4)                                                    | UTX settlement                                                   | low        |
| `talent_offers`          | `talent_offer_status` (7)                                                  | LDP §5 Engagement (per-channel)                                  | medium     |
| `tasks`                  | `task_status` (5)                                                          | UTM legacy (canonical is `tasks_v2.state utm_state`)             | low        |
| `tickets`                | `ticket_status` (4)                                                        | UTX ticket                                                       | low        |
| `tour_p_and_l`           | `tour_status` (view)                                                       | booking tour P&L                                                 | low        |
| `tours`                  | `tour_status` (5)                                                          | booking tour                                                     | low        |

**Subtotal C.1:** 27 typed-enum status columns. **2 of these are HIGH-severity P1 conflations** (purchase_orders + requisitions — both have status AND state columns for the same record, with overlapping but non-identical semantics).

### C.2 Untyped-text status columns (S2 — type + name) — ~58

Tables with `status text` (unconstrained or check-only):
`accounting_periods, accreditation_changes, ad_manifests, automation_step_runs, campaigns, contract_renewals, cues, daily_logs, data_export_jobs, delegation_entries, dispatch_runs, fabrication_orders, form_definitions, form_defs, governance_policies, guard_tours, import_runs, inspections, invites, invoice_reminders, itil_changes, itil_problems, knowledge_articles, major_incidents, notification_deliveries, notification_templates, onboarding_steps, org_integrations, payment_applications, payment_processor_records.external_status, playbooks, po_change_orders, po_checklist_items, po_invoice_matches.match_status, punch_items, punch_lists, rate_card_orders, regulatory_filing_records, report_runs, rfis, rfq_responses, rfqs, role_documents, safeguarding_reports, safety_briefings, service_requests, sponsor_entitlements, submittals, sync_runs, threats, trademarks, ufs_form_submissions, vendor_prequalifications, venue_closeout_items, venue_design_specs, venue_handover_items, venue_vop_sections, visa_cases, wizard_definitions, work_order_broadcast_invites, work_order_broadcasts, files.virus_scan_status`

**Subtotal C.2:** ~58 untyped text-status columns. Each is a candidate for typed-enum promotion + rename.

---

## D. Hybrid name violations — 0 in v2

The `proposal_phase_status` → `proposal_phase_state` rename this session removed the only hybrid.

---

## E. Aggregate score

| Category                                  | Count                  | LDP-correct?             |
| ----------------------------------------- | ---------------------- | ------------------------ |
| Typed-enum `*_state` (correct)            | 17                     | ✅                       |
| Typed-enum `*_state` reused across tables | 1 (`upo_state`)        | ⚠️ but same subsystem    |
| `*_state` text/jsonb (wrong type)         | 7                      | ⚠️                       |
| `*_phase` correct                         | 1 (`production_phase`) | ✅                       |
| `*_phase` misnamed/reused                 | 2 (`xpms_phase` ×2)    | ⚠️                       |
| `*_stage`                                 | 1                      | ⚠️ third vocabulary word |
| Typed-enum `status` (cosmetic)            | 27                     | ❌                       |
| Typed-enum `status` part of P1 conflation | 2                      | ❌❌                     |
| Untyped text `status`                     | ~58                    | ❌❌❌                   |

**Headline metric:** **2 hard P1 conflations** (purchase_orders, requisitions) — each carries BOTH a `state` AND a `status` column for the same record, with overlapping non-identical semantics. These are the schema-review-stop pattern per LDP.
