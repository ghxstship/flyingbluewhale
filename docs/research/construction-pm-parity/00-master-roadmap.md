# Construction-PM Parity — Master Roadmap

**Date:** 2026-05-26
**Scope:** End-to-end feature parity audit of ATLVS / GVTEWAY / COMPVSS vs the leading construction-PM platforms, with a sequenced gap-closing plan that takes us to **meet-or-exceed parity by EOY 2026**.

Companion docs:

- [01 — Competitive landscape](01-competitive-landscape.md)
- [02 — Lifecycle parity matrix](02-parity-matrix.md)
- [03 — Gap inventory (severity-ranked)](03-gap-inventory.md)
- [04 — Shipped rounds 35–53](04-shipped-rounds-35-53.md)
- [05 — Shipped rounds 54–66](05-shipped-rounds-54-66.md)
- [06 — Shipped rounds 67–72](06-shipped-rounds-67-72.md)
- [07 — Acceptance criteria + operator runbook](07-acceptance-criteria.md)
- [08 — Shipped Round 74 (Final)](08-shipped-round-74.md) ← current state

---

## Delivery snapshot (as of 2026-05-27)

**Rounds 35–74 shipped to `main`** in 40 trunk-based commits — see
[04](04-shipped-rounds-35-53.md), [05](05-shipped-rounds-54-66.md),
and [06](06-shipped-rounds-67-72.md) for round-by-round detail.
Aggregate **42% → 100% parity** (C+S). **Zero hard schema gaps,
zero remaining client-island P-items, zero remaining gaps from the
inventory.** Rounds 67–72 closed the three P items that survived the
35–66 wave (PDF.js markup, web-ifc 3D viewer, SVG Gantt UI), completed
the four-connector accounting matrix (added Sage 300 CRE, Foundation,
Viewpoint Vista; closed QBO push-side write-back), and shipped
OpenWeatherMap fallback + CA/NY/WA state certified-payroll XML
exporters. **Round 74 closed the final gap — G-030 / F44 multi-entity
plus multi-currency consolidation** (org_entities hierarchy + daily FX
rate worker + line-level FX snapshots on invoices/expenses/pay-apps +
v_consolidated_ar view + /console/finance/entities and
/console/finance/consolidation surfaces). Per-gap DoD verification +
credential provisioning runbook in [07](07-acceptance-criteria.md).
The construction-PM table-stakes parity program is **complete**; the
next motion is the **Wave 5 differentiator program** described below.

---

## TL;DR

The platform is already **~70% of the way to parity** with the construction-PM table-stakes set, despite being conceived for live events. The schema and routes already include RFIs, submittals, daily logs (Raken-grade — six normalized child tables), punch lists, AIA-style pay-applications, vendor prequalification, COIs, OSHA 300, safety briefings/JHAs, cost codes, inspections with templates, change orders (PO + proposal), site-plan pins with revisions, multi-persona portals (owner/sub/vendor), geofenced time tracking, and a unified-assignment domain that maps cleanly to construction crewing.

The deficit is concentrated in **five gap clusters**:

1. **Design coordination** — no BIM viewer, no clash detection, no native vector PDF markup (only pin-based), no specifications book, no transmittals with audit-grade receipts.
2. **Scheduling** — calendar-based only; no Gantt, no CPM with critical path/float, no P6 / MS Project / Asta import, no 3- and 6-week lookahead derived from a baseline.
3. **Quantitative precon** — no quantity takeoff, no estimating engine, no unit cost database, no bid management / ITB (RFQs cover sourcing but not formal ITB invitations against drawing sheets).
4. **Construction accounting depth** — pay-app PDF export to G702/G703 is unconfirmed; no lien-waiver capture (conditional/unconditional, partial/final); no certified payroll / union / multi-state / prevailing wage; no WIP report; no formal EAC/forecast model.
5. **Reality capture + ecosystem** — no OpenSpace / DroneDeploy / Matterport integration; no DocuSign / Adobe Sign for contracts (offer-letter signatures only); no certified accounting connectors (Sage/QB/Foundation/Viewpoint); no ERP connectors; no ITB network analog (BuildingConnected); no AI assistant tied to project documents (chat exists but is not document-grounded).

This roadmap closes all five clusters in **four waves over ~7 months** (Q3 2026 → Q1 2027), then sets a Q2 2027 differentiator wave that **leapfrogs** the incumbents on three vectors uniquely available to us (unified events/construction lifecycle, marketplace-native subcontractor sourcing, AI-first authoring).

---

## Strategic frame

### Why the parity audit matters

Construction PM is a **$3.4B SaaS category** ([Capterra 2026 Shortlist](https://www.capterra.com/construction-management-software/shortlist/)) and the top three platforms (Procore, Autodesk Construction Cloud, Trimble Viewpoint) together cover the bulk of mid- and enterprise-tier GCs. Owner-side capital programs run on Aconex/Unifier/Kahua. Field-first execution belongs to Fieldwire and Raken. The residential niche is Buildertrend. Reality capture is a parallel stack (OpenSpace/DroneDeploy/Matterport) that every serious platform now integrates.

Our existing surface is unusually close to construction PM for two structural reasons:

- **Live-event production is closer to construction than to SaaS PM**: critical-path scheduling against immovable show dates, fabrication shops with engineered drawings, on-site crews with OSHA exposure, owner/vendor/contractor multi-party document exchange, AIA-style milestone billing, change orders, punch-list closeout.
- **The XPMS atom-and-class model** (`xpms_atoms`, `xtc_classes`, `xtc_codes`) is taxonomic — it can absorb construction-specific cost codes (CSI MasterFormat, Uniformat, NRM2) without schema work.

That means parity is a **finish-the-build** exercise, not a re-architecture.

### Why we can credibly exceed parity

Three differentiators are structurally ours to claim:

1. **Unified events ⇄ construction lifecycle.** Procore can't do festivals; ATLVS already does. The construction industry runs **brand activations, trade-show buildouts, popup retail, and stadium event-day overlay** as one-off projects that bleed across PM tooling — we are the only platform that natively spans those.
2. **Marketplace-native subcontractor sourcing.** Migration 0002 already gives us public discovery (RFQs, gigs, talent calls, crew, vendors). Procore needs BuildingConnected acquired in 2019 to do this; we built it native. Wrapping a **prequalified-sub marketplace** around our existing RFQ flow is a Procore-Network-class moat.
3. **AI-first authoring.** We have streaming Anthropic chat in `/api/v1/ai/chat` already. Procore Copilot, Autodesk AI, Newforma Vojo, Kahua Noa all shipped in 2026 — we are not late, we are on the same wave. With Sonnet 4.6 / Opus 4.7 we have a model advantage if we ground the assistant on project documents (RAG over `deliverables`, `submittals`, `rfis`, daily logs, plans).

### Constraints / non-goals

- **Not building construction accounting from scratch.** We will connect to Sage 300 CRE / QuickBooks / Foundation / Viewpoint Vista via certified two-way connectors. Native GL/AP/AR/payroll is a 24-month build with no defensible moat.
- **Not building a BIM authoring tool.** We will **view** IFC / RVT / NWD models and host federation, but Revit/Navisworks/SketchUp authoring stays on Autodesk.
- **Not building Bluebeam Revu.** We will build a sufficient markup layer for field use (pin-based + redline + cloud/text/dimension); designers can keep using Revu and we will round-trip exported markups.
- **Not building Primavera P6.** We will import/export P6, MS Project, Asta XML and build a native Gantt sufficient for execution; deep CPM resource leveling stays on P6.

---

## Wave plan

Four delivery waves, each ~6–8 weeks, plus a Q2 2027 differentiator wave. Wave content is owned by lifecycle phase, not by team, because each phase cuts across schema, console, portal, mobile, and API.

### Wave 1 — Drawings, BIM, and Spec book (Q3 2026, 8 weeks)

**Theme:** become a credible design-coordination surface. This is the largest single gap and the one most visible to architects/engineers on a project.

| #   | Deliverable                                               | Schema                                                                                                                                  | Surface                                                                                                                                           | Notes                                                                                          |
| --- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1.1 | **Sheet-set publishing with slip-sheet/overlay diff**     | rename `site_plans` → `drawing_sheets`; add `sheet_sets`, `sheet_set_versions`, `sheet_revisions`. Migration `0070_drawing_sheets.sql`. | `/console/projects/[id]/drawings` (replaces `site-plans` for construction projects); `/m/drawings`; `/p/[slug]/drawings`                          | Auto-version on re-upload; diff renderer is a server action that pixel-compares prior version. |
| 1.2 | **PDF markup engine (vector + cloud + text + dimension)** | add `drawing_markups` (geometry, style, author, layer), `drawing_markup_layers`.                                                        | Markup editor on drawing detail page; offline-capable on `/m/drawings/[id]`.                                                                      | PDF.js + pdf-lib for export; calibrated measurement piggybacks on stored DPI.                  |
| 1.3 | **BIM model viewer (IFC + glTF; Revit/NWD via Forge)**    | `bim_models`, `bim_model_federations`, `bim_model_links` (to RFIs/submittals).                                                          | `/console/projects/[id]/models`; viewer powered by three.js + web-ifc; Forge SDK for RVT/NWD; clash-detection is a partner integration in Wave 2. | Defer authoring; viewer only.                                                                  |
| 1.4 | **Specifications book**                                   | `spec_sections` (CSI/Uniformat-keyed), `spec_section_items`, links from `submittals.spec_section_id`, `rfis.spec_section_id`.           | `/console/projects/[id]/specs` with section tree and search; spec→submittal/RFI linking in those editors.                                         | Import from PDF spec book (boundary-detect by section number regex).                           |
| 1.5 | **Transmittals with audit receipts**                      | `transmittals`, `transmittal_items` (poly to drawings/specs/submittals/RFIs/files), `transmittal_acknowledgements`.                     | `/console/projects/[id]/transmittals` (list + new + detail); portal acknowledgement page.                                                         | Immutable timestamps; webhook-pushed to `webhook_endpoints` for client systems.                |

**Exit criteria:** A live MMW26-Hialeah project can publish a sheet set, generate slip-sheets, redline drawings on iPad offline, view an uploaded IFC model, link an RFI to spec section 26-22-00, and issue a transmittal with read receipts.

### Wave 2 — Scheduling, takeoff, and bid management (Q4 2026, 8 weeks)

**Theme:** quantitative precon + true CPM scheduling. Closes the second-largest gap.

| #   | Deliverable                                               | Schema                                                                                                                                               | Surface                                                                                                                       | Notes                                                                                |
| --- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 2.1 | **Gantt + CPM (critical path, float, baseline)**          | `schedule_baselines`, `schedule_activities` (+ dependencies, lags, constraints), `schedule_activity_actuals`.                                        | Replace `ScheduleCalendar` with `ScheduleGantt` (calendar stays as a view mode); 3- and 6-week lookahead derived from filter. | Use d3 + custom canvas renderer; CPM algorithm in-process (forward + backward pass). |
| 2.2 | **P6 / MS Project / Asta import-export**                  | reuse `import_runs`.                                                                                                                                 | `/console/projects/[id]/schedule/import`.                                                                                     | XER + XML parsers; full round-trip including resource assignments.                   |
| 2.3 | **Quantity takeoff (calibrated measurement on drawings)** | `takeoffs`, `takeoff_items` (geometry, unit, cost-code linked, quantity).                                                                            | `/console/projects/[id]/takeoffs`; measurement tools on drawing markup engine from Wave 1.2.                                  | Calibration stored in `drawing_sheets.calibration_dpi`.                              |
| 2.4 | **Estimating engine with unit cost database**             | `cost_databases`, `cost_database_items` (org-scoped + master library), `estimates`, `estimate_lines` (linked to `takeoff_items`).                    | `/console/projects/[id]/estimates`; `/console/finance/cost-database`.                                                         | Markup + waste-factor rules; export to `proposals` + `budgets`.                      |
| 2.5 | **Bid management / ITB (formal)**                         | extend `rfqs` with `itb_phase` enum, `itb_packages` (sheet-set + spec-section bundles per trade), `itb_invitations` (with deadline, decline reason). | `/console/procurement/itb`; outbound invites go to marketplace + manual sub lists.                                            | Bid-leveling spreadsheet builds on existing `rfq_response_lines`.                    |
| 2.6 | **Clash detection (partner-integration)**                 | `clash_runs`, `clash_results` (link to BIM model + RFI).                                                                                             | Run via Forge Model Coordination or Solibri; results auto-create RFIs.                                                        | Buy, don't build.                                                                    |

**Exit criteria:** Can import a P6 schedule, see critical path with float, drive a 3-week lookahead, run a takeoff against a drawing set, build an estimate from the takeoff that flows into a budget and an ITB, send ITB to 25 prequalified subs, and import their bid responses for leveling.

### Wave 3 — Construction accounting, lien waivers, and integrations (Q1 2027, 8 weeks)

**Theme:** make the financials credible for a CFO at a real GC.

| #   | Deliverable                                                             | Schema                                                                                                                                                         | Surface                                                                                         | Notes                                                                                                                                                                       |
| --- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.1 | **AIA G702/G703 PDF export**                                            | extend `payment_applications` with `aia_form_version`, `retainage_pct`, `stored_materials_amount`; `payment_application_certifications` (architect signature). | PDF export on `/console/finance/pay-apps/[id]`.                                                 | Pixel-accurate AIA form templates via pdf-lib.                                                                                                                              |
| 3.2 | **Lien-waiver capture**                                                 | `lien_waivers` (conditional/unconditional × partial/final), `lien_waiver_state` enum, FK from `payment_applications`.                                          | Sub portal waiver flow at `/p/[slug]/vendor/waivers`; admin at `/console/finance/lien-waivers`. | DocuSign envelope per waiver.                                                                                                                                               |
| 3.3 | **WIP report (over/under-billing)**                                     | `wip_snapshots` materialized monthly.                                                                                                                          | `/console/finance/wip`.                                                                         | Surety/bonding-friendly format.                                                                                                                                             |
| 3.4 | **Forecast / EAC engine**                                               | `cost_forecasts`, `cost_forecast_lines` (committed/incurred/forecast/EAC per cost code).                                                                       | `/console/projects/[id]/forecast`.                                                              | Reuses `cost_codes`.                                                                                                                                                        |
| 3.5 | **Sage 300 CRE / QuickBooks / Foundation / Viewpoint Vista connectors** | `accounting_connections`, `accounting_sync_runs`, `accounting_mapping_rules`.                                                                                  | `/console/settings/integrations/accounting`.                                                    | Two-way: invoices + bills + pay-apps + cost codes + AP + GL entries. Start with QB Online (largest install base), then Sage 300 CRE, then Foundation, then Viewpoint Vista. |
| 3.6 | **DocuSign / Adobe Sign for contracts**                                 | `contract_envelopes`, `contract_envelope_signers`; extend `offer_letters` + `proposals` + `independent_contractor_msas`.                                       | Inline envelope flow on existing surfaces.                                                      | Webhook-driven status updates.                                                                                                                                              |
| 3.7 | **Certified payroll / union / prevailing wage**                         | `payroll_runs`, `payroll_run_lines`, `wage_determinations`, `union_local_rates`.                                                                               | `/console/finance/payroll`.                                                                     | Phase 1: payroll-ready CSV export to ADP / Gusto / Paychex; phase 2: native AIA-style certified-payroll PDF (form WH-347).                                                  |

**Exit criteria:** Generate a G702/G703 PDF with stored materials + retainage, collect signed conditional partial waivers from all subs on a pay-app, file the pay-app in QuickBooks via the connector, run a WIP report at month-end, view EAC against original budget, and DocuSign a $500K subcontract.

### Wave 4 — Reality capture, AI, and predictive risk (Q1–Q2 2027, 6 weeks)

**Theme:** match the 2026-2027 AI/automation table-stakes and ship the AI-first authoring differentiator.

| #   | Deliverable                                                                    | Schema                                                                                                                                                 | Surface                                                                                 | Notes                                                                                                           |
| --- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 4.1 | **OpenSpace + DroneDeploy + Matterport integration**                           | `reality_captures`, `reality_capture_anchors` (link to drawing sheet pin).                                                                             | `/console/projects/[id]/captures`.                                                      | OAuth + webhook-receive; embed their viewers.                                                                   |
| 4.2 | **Document-grounded AI assistant**                                             | extend `ai_conversations` with project scope; vector index over `deliverables`, `submittals`, `rfis`, `daily_logs`, `drawing_sheets` (text-extracted). | Console assistant panel; mobile `/m/ask`.                                               | RAG with Claude Opus 4.7; cite source documents in responses.                                                   |
| 4.3 | **Predictive risk scoring (schedule slip, cost overrun, safety, sub default)** | `risk_scores`, `risk_score_inputs`.                                                                                                                    | Dashboard card on `/console/projects/[id]`; portfolio view at `/console/programs/risk`. | Daily batch job; features = baseline-vs-actual variance, RFI age, daily-log gaps, incident rate, prequal score. |
| 4.4 | **Weather capture on daily logs**                                              | extend `daily_logs` with `weather_*` columns (temp_high, temp_low, precip_in, wind_mph, conditions, source).                                           | Auto-pull on log creation.                                                              | NWS API (US) + OpenWeatherMap fallback.                                                                         |
| 4.5 | **Resource planning across projects (Bridgit-class)**                          | reuse `workforce_deployments`; add `resource_forecasts`, `resource_forecast_lines`.                                                                    | `/console/workforce/planning` (already exists; deepen).                                 | 5-year forecast; bench cost; certification matching.                                                            |

**Exit criteria:** OpenSpace walk-through embedded on project page; AI assistant answers "show me all open RFIs touching electrical that reference spec section 26 and have been waiting > 7 days" with cited sources; daily log auto-captures weather; risk dashboard surfaces three at-risk projects; workforce planner forecasts crew demand 18 months out.

### Wave 5 — Differentiator wave (Q2 2027, 6 weeks)

**Theme:** leapfrog parity on the three vectors uniquely available to us.

| #   | Deliverable                                                | Notes                                                                                                                                                                                                                                                                   |
| --- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5.1 | **Unified events ⇄ construction project template library** | Stadium event-day overlay, retail buildouts, festival site-construction, brand activations — each a project type that toggles between event-mode (Run-of-Show, talent, advancing) and construction-mode (drawings, RFIs, pay-apps). Single source of truth across both. |
| 5.2 | **Marketplace-native prequalified-sub network**            | Public discovery + prequalification + insurance + bonding capacity + COI on file → instant-invite ITB. Stripe Connect for direct payouts. The first construction platform where "find a sub" and "pay a sub" are one workflow with no third-party.                      |
| 5.3 | **AI-first authoring**                                     | Generate first-draft RFIs, submittal logs, daily logs, change orders, punch items from photos + voice + drawings. "Take a photo, get a punch item with location, trade, and assignee" on mobile.                                                                        |

---

## Sequencing rationale

Why this order:

1. **Drawings/BIM first** because every other workflow links to a sheet number or spec section. Build the spine before adding ribs.
2. **Scheduling/takeoff/ITB second** because precon-to-execution traceability needs a baseline schedule and a quantity-driven budget. Also, ITB closes the sub-onboarding loop with our marketplace.
3. **Accounting/financials third** because by this point we have the full document/cost trail to back AIA pay-apps and lien waivers credibly. Integrating with Sage/QB earlier would mean syncing incomplete cost data.
4. **Reality capture + AI fourth** because both are layers on top of the now-complete project record. Earlier and they have less to ingest.
5. **Differentiators last** because they compound the parity foundation. Shipping them earlier would feel gimmicky.

## Resourcing implication (rough)

Assuming 2 full-stack ICs + 1 designer + 0.5 PM + access to existing Supabase MCP for migrations:

- Wave 1: ~640 IC-hours
- Wave 2: ~680 IC-hours
- Wave 3: ~720 IC-hours (heavy on connectors)
- Wave 4: ~480 IC-hours
- Wave 5: ~520 IC-hours

Total ~3,040 IC-hours ≈ 7 calendar months at the current pace. Compatible with current velocity (recent rounds 30–34 closed sub-week each).

## Quality gates per wave

Every wave must pass the canonical `/validate` suite (typecheck, lint, test, build, brand SSOT, URL canon, LDP naming, unsafe casts) AND:

- A new section of the COMPVSS smoke harness for any new mobile surface.
- A new actions-smoke entry for any new RLS-gated mutation.
- An LDP audit row in `reports/LDP_LIFECYCLE_AUDIT.md` for any new state/phase enum.
- An ADR under `docs/decisions/` for any cross-shell architectural decision.

## Risk register

| Risk                                                                      | Likelihood | Impact | Mitigation                                                                                       |
| ------------------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------ |
| AIA G702/G703 PDF fidelity rejected by sureties                           | M          | H      | Submit early sample to a participating surety (Travelers, Liberty Mutual) before locking format. |
| QB / Sage connector certification slips                                   | M          | M      | Start QB Online cert in parallel with Wave 1; certification is 6-8 weeks of vendor process.      |
| BIM viewer performance on large RVT (>1GB)                                | M          | M      | Federate at view-time; lazy-load by storey/discipline; never ship full RVT to client.            |
| Calibrated takeoff measurement disputed by estimators                     | L          | H      | Round-trip with Bluebeam exported QTO CSV; ship a "swear-by-Bluebeam" reconciliation tool.       |
| Marketplace prequal capture insufficient for enterprise procurement gates | M          | H      | Mirror TradeTapp + Billy field set; commission Vertikal RMS as advisor.                          |
| AI assistant hallucinates on project documents                            | M          | H      | RAG-only with citation requirement; UI surfaces source links; never answer without grounding.    |
| Connecteam-parity surfaces neglected during construction push             | L          | M      | Maintain `compvss-smoke.mjs` as the regression gate; any failure blocks merge to main.           |
