# Construction-PM Parity — 03 — Gap Inventory (severity-ranked)

**Companion to:** [00 master roadmap](00-master-roadmap.md) · [01 competitive landscape](01-competitive-landscape.md) · [02 parity matrix](02-parity-matrix.md)

The 15 hard gaps and 17 partials from the [parity matrix](02-parity-matrix.md), restated as discrete tickets sized + sequenced for execution. Severity is judged on (a) procurement-blocker status — does an enterprise GC reject us in the RFP for missing it? — and (b) workflow centrality — does it block other features?

Each ticket includes: title, severity (P0/P1/P2), wave, schema changes, surfaces touched, effort estimate (IC-hours), and the "definition of done."

---

## P0 — Procurement-blocker gaps (cannot win enterprise GC RFP without these)

### G-001 · Gantt + CPM scheduler with critical path & float

- **Wave 2.1** · ~120 IC-h
- **Why P0:** Calendar-based scheduling is a dealbreaker at the first solution-architecture review. Every enterprise RFP asks "does your platform import P6?"
- **Schema (migration `0070_schedule_baselines.sql`):**
  - `schedule_baselines` (project_id, name, snapshot_at, active)
  - `schedule_activities` (baseline_id, code, wbs_path, name, start_planned, finish_planned, duration_days, constraint_type, constraint_date, calendar_id, percent_complete)
  - `schedule_activity_dependencies` (predecessor_id, successor_id, type FS/SS/FF/SF, lag_days)
  - `schedule_activity_actuals` (activity_id, start_actual, finish_actual, percent_complete, recorded_at)
  - `schedule_calendars` (project_id, work_days, holidays)
- **Surfaces:** replace `ScheduleCalendar` with `ScheduleGantt`; calendar becomes a view mode. New routes: `/console/projects/[id]/schedule/baselines/[baselineId]`, lookahead query param `?lookahead=3w|6w`.
- **CPM algorithm:** forward + backward pass in a server util (`src/lib/schedule/cpm.ts`); float = LS − ES; critical path = float == 0; recompute on activity-change webhook.
- **DoD:** import a P6 XER, render Gantt with critical path highlighted, save a baseline, drive a 3-week lookahead, save an actual that re-computes float for downstream activities.

### G-002 · P6 / MS Project / Asta XML import-export

- **Wave 2.2** · ~80 IC-h
- **Why P0:** Bundled with G-001 as a single procurement check.
- **Schema:** reuse `import_runs`, `import_jobs`. Add `schedule_import_mappings` (column-to-field map per source).
- **Surfaces:** `/console/projects/[id]/schedule/import` (file upload + mapping wizard). Export: download XER + XML.
- **DoD:** round-trip a 5,000-activity P6 schedule with dependencies + resources intact.

### G-003 · AIA G702/G703 pay-app PDF export

- **Wave 3.1** · ~60 IC-h
- **Why P0:** No CFO will replace Sage/Foundation if we can't generate the G702/G703 form for upstream pay-app submission.
- **Schema:** extend `payment_applications` with `aia_form_version` (1992/2017), `retainage_pct`, `stored_materials_amount`, `prior_period_billed`, `architect_certification_at`, `architect_certification_by`. Add `payment_application_certifications` (signature image, certified date, comments).
- **Surfaces:** PDF download button on `/console/finance/pay-apps/[id]`; pixel-accurate AIA-template via pdf-lib.
- **DoD:** download a G702 cover and G703 detail PDF matching the official AIA layout; surety acceptance verified.

### G-004 · Lien-waiver capture (conditional/unconditional × partial/final)

- **Wave 3.2** · ~80 IC-h
- **Why P0:** GCs in 35+ US states are statutorily required to collect lien waivers from subs to release payment. Without this we cannot be the GC's pay-app system of record.
- **Schema (migration `0080_lien_waivers.sql`):**
  - `lien_waivers` (sub_id, project_id, payment_application_id, waiver_type (conditional/unconditional), waiver_scope (partial/final), through_date, amount, signed_at, signature_image, signer_name)
  - `lien_waiver_state` enum (drafted → sent → signed → returned → released)
  - FK from `payment_applications`: `requires_lien_waiver_from_subs boolean`
- **Surfaces:** sub portal at `/p/[slug]/vendor/waivers`; admin at `/console/finance/lien-waivers`. DocuSign envelope per waiver.
- **DoD:** generate a conditional partial waiver, send to sub via DocuSign, collect signature, gate payment release on signed waiver.

### G-005 · Specifications book (CSI MasterFormat / Uniformat)

- **Wave 1.4** · ~80 IC-h
- **Why P0:** RFI/submittal traceability requires spec-section linking. Without this we cannot pass an AE-side workflow review.
- **Schema (migration `0072_spec_book.sql`):**
  - `spec_sections` (project_id, section_number, title, division, format (masterformat-2026 / uniformat / nrm2), parent_id)
  - `spec_section_items` (section_id, subsection, body_md, sheet_refs[])
  - Add `submittals.spec_section_id`, `rfis.spec_section_id` FKs.
- **Surfaces:** `/console/projects/[id]/specs` (tree + search); spec-section picker added to existing RFI + submittal editors.
- **Import:** PDF spec-book splitter detects boundaries on section-number regex.
- **DoD:** import a 600-page spec book, navigate by section, link a submittal to section 26-22-00, RFI auto-suggests section based on title.

### G-006 · BIM model viewer (IFC + Revit + Navisworks)

- **Wave 1.3** · ~120 IC-h
- **Why P0:** Design-driven commercial work cannot be sold without a model viewer. ACC's category-leading position is built on this.
- **Schema (migration `0073_bim.sql`):**
  - `bim_models` (project_id, name, file_id (storage), source_type (ifc/rvt/nwd/glb), version, federation_root_id)
  - `bim_model_federations` (root_model_id, child_model_id, alignment_matrix jsonb)
  - `bim_model_links` (model_id, element_global_id, link_type (rfi/submittal/issue), target_id)
- **Surfaces:** `/console/projects/[id]/models` + viewer.
- **Implementation:** three.js + web-ifc for IFC; Autodesk Forge SDK for RVT/NWD (RVT first converts to .svf in Forge). View-only; no authoring.
- **DoD:** upload a 500MB federated IFC, navigate model, section it, click element to link to an RFI.

### G-007 · Specifications-aware RFI + submittal workflow upgrade

- **Wave 1.4 (extends G-005)** · ~40 IC-h
- **Why P0:** Without spec-section linking, RFI / submittal routing is manual.
- **DoD:** distributor rule routes RFI by spec section + discipline; submittal review chain auto-populated from spec section's reviewer mapping.

### G-008 · Quantity takeoff (calibrated measurement on drawings)

- **Wave 2.3** · ~100 IC-h
- **Why P0:** Without takeoff, we have no precon story for commercial work. Bluebeam dominates this; Procore Estimating + ACC Takeoff are the new entrants.
- **Schema (migration `0075_takeoff.sql`):**
  - `takeoffs` (project_id, drawing_sheet_id, name, cost_code_id, unit, calibration_dpi, total_quantity)
  - `takeoff_items` (takeoff_id, geometry (polygon/polyline/point/count), measured_quantity, notes)
- **Surfaces:** measurement tools on the drawing-markup engine (built in Wave 1.2); `/console/projects/[id]/takeoffs` list.
- **DoD:** calibrate a sheet to 1/8"=1', polygon-measure a slab, count toilets on a finishes plan, export QTO CSV that matches Bluebeam's output within 1%.

### G-009 · Estimating engine + unit cost database

- **Wave 2.4** · ~100 IC-h
- **Why P0:** Without estimating, takeoff is decorative.
- **Schema (migration `0076_estimates.sql`):**
  - `cost_databases` (org_id, name, source (rs-means / org-custom), version, is_master_library boolean)
  - `cost_database_items` (db_id, cost_code_id, description, unit, material_cost, labor_cost, equipment_cost, sub_cost, total_cost, region_factor)
  - `estimates` (project_id, name, baseline_at, total)
  - `estimate_lines` (estimate_id, takeoff_item_id, cost_database_item_id, quantity, unit_cost, markup_pct, total)
- **Surfaces:** `/console/projects/[id]/estimates`; `/console/finance/cost-database` (org library admin).
- **DoD:** build an estimate from takeoffs, apply 7% markup, export as proposal SOV and as budget.

### G-010 · Certified payroll / union / multi-state / prevailing wage

- **Wave 3.7** · ~120 IC-h
- **Why P0:** Federal Davis-Bacon and state-prevailing-wage jobs are unwinnable without this. Sage 100/300 + Foundation own this market because of it.
- **Schema (migration `0084_certified_payroll.sql`):**
  - `wage_determinations` (project_id, agency (federal/state), classification, base_rate, fringe_rate, effective_at)
  - `union_local_rates` (local_id, classification, base_rate, fringe_breakdown jsonb, work_rules jsonb)
  - `payroll_runs` (project_id, pay_period_start, pay_period_end, state, agency_report_type (wh-347/state))
  - `payroll_run_lines` (run_id, employee_id, classification, hours_worked, hours_OT, gross, fringes, deductions, net)
- **Surfaces:** `/console/finance/payroll`.
- **Phase 1:** payroll-ready CSV export to ADP / Gusto / Paychex.
- **Phase 2:** native WH-347 PDF.
- **DoD:** run a payroll against a prevailing-wage project, output WH-347, verify against state portal sample.

### G-011 · WIP report (over/under-billing) for surety/bonding

- **Wave 3.3** · ~50 IC-h
- **Why P0:** Sureties require monthly WIP from any bonded GC. Without this we cannot serve any GC with bonding capacity > $5M.
- **Schema (migration `0083_wip.sql`):**
  - `wip_snapshots` (org_id, snapshot_at, project_id, contract_amount, approved_change_orders, revised_contract_amount, costs_to_date, percent_complete, earned_revenue, billed_to_date, over_under_billed, estimated_cost_to_complete)
  - Materialized; refresh nightly + on demand.
- **Surfaces:** `/console/finance/wip`.
- **DoD:** monthly WIP report for all active projects matches CFO's spreadsheet output to within rounding.

### G-012 · Forecast / EAC engine

- **Wave 3.4** · ~80 IC-h
- **Why P0:** No EAC ⇒ no risk-of-loss reporting. Procore Project Financials makes this its headline.
- **Schema (migration `0082_cost_forecasts.sql`):**
  - `cost_forecasts` (project_id, forecast_at, by_user_id, methodology (earned-value/manual/automatic))
  - `cost_forecast_lines` (forecast_id, cost_code_id, original_budget, approved_changes, pending_changes, committed, incurred, forecast_to_complete, estimated_at_completion, variance)
- **Surfaces:** `/console/projects/[id]/forecast`.
- **DoD:** EAC by cost code, color-coded variance, drilldown to source transactions.

### G-013 · Accounting connectors (Sage 300, Foundation, QuickBooks, Viewpoint Vista)

- **Wave 3.5** · ~240 IC-h (60 per connector)
- **Why P0:** Native accounting is out-of-scope. The connectors are how we credibly say "yes we work with your existing books."
- **Schema (migration `0086_accounting_connectors.sql`):**
  - `accounting_connections` (org_id, system (qb/sage300/foundation/viewpoint), tenant_id, auth_payload encrypted, status, last_sync_at)
  - `accounting_sync_runs` (connection_id, started_at, ended_at, entity_type, count_in, count_out, error_count)
  - `accounting_mapping_rules` (connection_id, atlvs_entity, atlvs_field, remote_entity, remote_field, transform)
- **Surfaces:** `/console/settings/integrations/accounting`.
- **Sequence:** QuickBooks Online first (largest install base), Sage 300 CRE second, Foundation third, Viewpoint Vista fourth.
- **DoD:** two-way sync of cost codes, vendors, bills, invoices, pay-apps, GL accounts between ATLVS and target system, with conflict resolution.

---

## P1 — Important parity gaps (matters for medium-to-large GC adoption)

### G-014 · Sheet-set publishing with slip-sheet diff

- **Wave 1.1** · ~80 IC-h · Replace `site_plans` with `drawing_sheets`/`sheet_sets`; slip-sheet diff renderer.

### G-015 · PDF markup engine (vector + cloud + text + dimension; calibrated measurement)

- **Wave 1.2** · ~120 IC-h · pdf-lib + PDF.js; layer model; offline-capable on mobile.

### G-016 · Transmittals with audit-grade receipts

- **Wave 1.5** · ~60 IC-h · New `transmittals` + `_items` + `_acknowledgements`; webhook fan-out.

### G-017 · Clash detection (integration)

- **Wave 2.6** · ~50 IC-h · Forge Model Coordination integration; auto-promote clashes to RFIs.

### G-018 · OpenSpace + DroneDeploy + Matterport integration

- **Wave 4.1** · ~80 IC-h · `reality_captures` + anchor links to drawing sheets; embed their viewers.

### G-019 · Document-grounded AI assistant

- **Wave 4.2** · ~100 IC-h · RAG over `deliverables`, `submittals`, `rfis`, daily logs, drawing-extracted text; cite sources.

### G-020 · Predictive risk scoring

- **Wave 4.3** · ~80 IC-h · Daily batch features = baseline-vs-actual variance, RFI age, daily-log gaps, incident rate, prequal score.

### G-021 · Weather capture on daily logs

- **Wave 4.4** · ~20 IC-h · NWS API (US primary) + OpenWeatherMap fallback. Extend `daily_logs` with `weather_*` cols.

### G-022 · Resource planning across projects (Bridgit-class)

- **Wave 4.5** · ~80 IC-h · Deepen existing `workforce/planning`; 5-year forecast; bench cost; certification matching.

### G-023 · Bid management / formal ITB

- **Wave 2.5** · ~80 IC-h · Extend `rfqs` with `itb_phase` enum, `itb_packages` (sheet + spec bundles per trade), `itb_invitations`.

### G-024 · DocuSign / Adobe Sign for contracts

- **Wave 3.6** · ~60 IC-h · `contract_envelopes` + signers; extend offer-letters + proposals + MSAs.

### G-025 · Warranty + O&M handover package

- **Wave 4 (closeout sprint)** · ~60 IC-h · `warranties` + reminders; package compiler bundles submittals + as-builts + spec sections + warranties per asset.

---

## P2 — Polish + completeness (post-parity nice-to-haves and finishers)

### G-026 · Email-in for filing project correspondence

- **Wave 3 (parallel)** · ~40 IC-h · `{slug}+{project}@in.atlvs.pro` SES inbound; dedup.

### G-027 · Toolbox-talk content library (500+ OSHA talks)

- **Wave 1 (parallel)** · ~40 IC-h · Content acquisition + import; Raken parity. Cheapest credibility win available.

### G-028 · Meeting minutes → tasks auto-promotion

- **Wave 2 (parallel)** · ~30 IC-h · One-click convert from meeting notes.

### G-029 · AP invoice OCR with PO matching

- **Wave 3 (parallel)** · ~60 IC-h · Anthropic Vision for line extraction; auto-match against PO.

### G-030 · Multi-entity / multi-currency

- **Post-parity** · ~120 IC-h · Sister-org model; FX rate snapshots at line level.

### G-031 · GraphQL API layer

- **Post-parity** · ~80 IC-h · Wrapping the existing REST surface; primarily for partner integrations.

### G-032 · Integration marketplace UI + certification program

- **Post-parity** · ~120 IC-h · Marketplace surface + certified-partner pipeline. Needed to credibly claim "300+ integrations."

### G-033 · Native iOS + Android wrappers (if PWA insufficient)

- **Post-parity** · ~160 IC-h · Capacitor wrappers around the PWA for App Store / Play Store distribution.

### G-034 · Multi-step submittal review chain (configurable per project)

- **Wave 1 (extends G-007)** · ~40 IC-h · `submittal_review_chains` + `_steps`.

### G-035 · Equipment utilization analytics

- **Wave 2 (parallel)** · ~30 IC-h · Build on top of `asset_movements`; idle-time detection.

### G-036 · Multi-billing-method AR (T&M, fixed price, cost-plus, retention release)

- **Wave 3 (parallel)** · ~50 IC-h · Confirm/extend `invoices` model; per-method PDF templates.

### G-037 · Auto-generate punch items from inspection failures

- **Wave 1 (parallel)** · ~20 IC-h · `inspection_items.failed_at → punch_items` server-side rule.

### G-038 · Sheet hyperlink callouts (RFI / spec section / detail-callout links from drawings)

- **Wave 1 (extends G-014)** · ~40 IC-h · Click drawing region to navigate to linked entity.

---

## Summary by wave (effort total)

| Wave                                    | P0 IC-h                                        | P1 IC-h                                        | P2 IC-h                          | Total IC-h                   |
| --------------------------------------- | ---------------------------------------------- | ---------------------------------------------- | -------------------------------- | ---------------------------- |
| Wave 1 (Drawings/BIM/Specs)             | 200 (G-005, G-006, G-007)                      | 260 (G-014, G-015, G-016)                      | 60 (G-027, G-034, G-037, G-038)  | **520**                      |
| Wave 2 (Schedule/Takeoff/ITB)           | 320 (G-001, G-002, G-008, G-009)               | 130 (G-017, G-023)                             | 60 (G-028, G-035)                | **510**                      |
| Wave 3 (Financials + connectors)        | 630 (G-003, G-004, G-010, G-011, G-012, G-013) | 60 (G-024)                                     | 150 (G-026, G-029, G-036)        | **840**                      |
| Wave 4 (Reality / AI / risk / handover) | —                                              | 380 (G-018, G-019, G-020, G-021, G-022, G-025) | —                                | **380**                      |
| Wave 5 (Differentiators)                | —                                              | —                                              | —                                | **520** (per master roadmap) |
| Post-parity (P2 finishers)              | —                                              | —                                              | 480 (G-030, G-031, G-032, G-033) | **480**                      |

Total to >95% parity: ~2,250 IC-hours (Waves 1–4). +520 to ship the differentiator wave. +480 for post-parity polish = **~3,250 IC-hours** end-to-end.

At a 2-IC, 1-designer, 0.5-PM team running 32 effective IC-hours/week per IC = **~35 calendar weeks** = **~8 calendar months** for Waves 1–4 with overlap, plus 6–8 weeks for Wave 5.

## What this does NOT cover

Out of scope by design (these would require separate analyses):

- Civil-specific features (earthworks volumes, RTK survey, machine control) — different platform stack (HCSS, Trimble Earthworks).
- Specialty trades' deep workflows (electrical estimating with Accubid, mechanical with Trimble MEP) — partner-only.
- International compliance: VAT, Making Tax Digital (UK), e-invoicing mandates (EU, India, Brazil) — post-parity.
- Construction-specific HR/PHR (apprenticeship hours, journeyman ratios, COBRA).
- LEED / WELL / BREEAM certification tracking — adjacency; partner via existing `sustainability` module.

## Adjacent considerations (not gaps; flagged for executive awareness)

- **Customer support footprint.** Procore's 24/7 in-app chat + named CSMs are part of why they win enterprise. We will need a real customer-success org by Wave 3, not just engineering.
- **Implementation services.** ACC, Procore, Aconex all sell ~80hr implementation packages. We need an implementation playbook + partner channel.
- **Data migration tooling.** From Procore, ACC, Sage, Foundation — Wave 4 should ship an "import from" wizard.
- **Security certifications.** SOC 2 Type II + ISO 27001 are RFP table-stakes; HIPAA + FedRAMP Moderate (à la Newforma 2026) for healthcare + public-sector. Track in `docs/audits/`.
