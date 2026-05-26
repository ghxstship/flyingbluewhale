# Construction-PM Parity — 02 — Lifecycle Parity Matrix

**Companion to:** [00 master roadmap](00-master-roadmap.md) · [01 competitive landscape](01-competitive-landscape.md)

ATLVS / GVTEWAY / COMPVSS scored against the 55 table-stakes features (from [01](01-competitive-landscape.md#2026-table-stakes-checklist-55-items)) organized by construction-project lifecycle phase. Score scale:

- **C** = Core / native strength (matches or exceeds best-in-class)
- **S** = Supported / adequate (table-stakes-met)
- **P** = Partial / present but incomplete
- **G** = Gap (absent or unreachable from current schema)

ATLVS column shows current state. The "Code anchor" column points to the file/table/route that proves the claim (or would prove it once built).

---

## A. Identity, Access & Cross-Org

| #   | Capability                                                     | ATLVS | Code anchor                                                                                    | Best-in-class                                    | Gap delta                                                                        |
| --- | -------------------------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| A1  | SSO via SAML/OIDC                                              | **C** | `org_sso_providers` table; `/console/settings/sso`                                             | Procore, ACC, Aconex, Viewpoint                  | —                                                                                |
| A2  | SCIM provisioning                                              | **S** | `org_scim_tokens` table                                                                        | Procore, ACC                                     | Production SCIM v2.0 endpoints verified; lifecycle event handling.               |
| A3  | Multi-tenant role/permission matrix (company × project × tool) | **S** | `memberships`, `org_roles`, `project_members`; RLS via `is_org_member` / `has_org_role`        | Procore (best granularity)                       | Procore-grade tool-level granularity (e.g. "can publish drawings but not RFIs"). |
| A4  | External-party invite without per-seat fees                    | **C** | `invites`, portal personas; per-`slug` authorization boundary                                  | Procore (collaborator seat model is contentious) | — — actually an advantage.                                                       |
| A5  | Audit log of every state change, exportable for discovery      | **C** | `audit_log` table; `compliance/audit-export` API; `domain_events`; LDP state-transition tables | Aconex (the standard)                            | Verify retention policy ≥ 7 years; legal-hold workflow.                          |

**Phase score:** A = 4C / 1S / 0G — **At parity.**

---

## B. Documents & Drawings

| #   | Capability                                                | ATLVS | Code anchor                                                                                      | Best-in-class                     | Gap delta                                                             |
| --- | --------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------ | --------------------------------- | --------------------------------------------------------------------- |
| B6  | Sheet-set publishing w/ auto-versioning + slip-sheet diff | **P** | `site_plans`, `site_plan_revisions` (single-plan model, not sheet sets); `/console/site-plans`   | ACC, PlanGrid lineage             | Rename to drawings + add `sheet_sets` + diff renderer. **Wave 1.1**.  |
| B7  | PDF markup w/ calibrated measurement, custom toolsets     | **P** | `site_plan_pins` (pin-based only)                                                                | Bluebeam (gold standard)          | Vector + cloud + text + dimension; calibration storage. **Wave 1.2**. |
| B8  | BIM viewer (IFC, RVT, NWD)                                | **G** | —                                                                                                | ACC (native; lineage from Revit)  | Build IFC viewer (web-ifc); Forge SDK for RVT/NWD. **Wave 1.3**.      |
| B9  | Clash detection (native or partner)                       | **G** | —                                                                                                | ACC BIM Collaborate (native)      | Forge Model Coordination integration. **Wave 2.6**.                   |
| B10 | Specifications module w/ section linking                  | **G** | submittals reference spec section as free text                                                   | ACC (2026 added), Procore, Aconex | `spec_sections` + linking. **Wave 1.4**.                              |
| B11 | Transmittals w/ read receipts, immutable timestamps       | **G** | —                                                                                                | Aconex (the standard)             | `transmittals` + acknowledgements. **Wave 1.5**.                      |
| B12 | Folder-level permissions + document holds                 | **S** | `record_grants`, RLS per file in Supabase Storage buckets; `share_links`                         | Procore, Aconex                   | Add "legal hold" flag + lock-down semantics.                          |
| B13 | Offline drawing access on iPad/Android                    | **P** | mobile shell exists; service worker registered on `compvss.*`; no drawing-specific offline cache | Fieldwire (gold standard)         | Drawing-tile pre-cache; conflict-free markup sync. **Wave 1.2**.      |

**Phase score:** B = 0C / 1S / 4P / 3G — **Largest gap cluster.** Wave 1 closes B6/B7/B8/B10/B11/B13. Wave 2.6 closes B9.

---

## C. Communications & Workflow

| #   | Capability                                                                             | ATLVS | Code anchor                                                                                                                                                 | Best-in-class             | Gap delta                                                                                           |
| --- | -------------------------------------------------------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------- |
| C14 | RFI workflow (configurable types, ball-in-court, due dates, escalation)                | **S** | `rfis` table; `/console/rfis` (list + `[id]` + `new`); portal exchange via existing inbox                                                                   | Procore                   | Configurable RFI types per project; escalation rules; spec-section linking (gated on B10).          |
| C15 | Submittal workflow (review cycles, spec-section linking, distribution)                 | **S** | `submittals`, `submittal_revisions`; `/console/submittals` + templates                                                                                      | Procore, ACC              | Multi-step review chain; spec-section linking (gated on B10).                                       |
| C16 | Punch list (pin-on-plan, photo, assignee, location, status, PDF report)                | **S** | `punch_lists`, `punch_items`; `PunchKanban.tsx`; `/console/punch` + `/m/punch`                                                                              | Fieldwire (gold standard) | PDF report generator; trade-grouped sign-off. **Wave 1.1 dependency** (pin-on-plan needs drawings). |
| C17 | Daily report (weather, manpower, equipment, work performed, notes, photos, signatures) | **S** | 6-table normalized model (`daily_logs`, `_manpower`, `_deliveries`, `_equipment`, `_visitors`, `_photos`); `/console/operations/daily-log` + `/m/daily-log` | Raken (gold standard)     | Auto-weather (Wave 4.4); voice-to-log AI (Wave 5.3).                                                |
| C18 | Meeting minutes w/ action items → tasks                                                | **P** | `/console/meetings` exists; `tasks` table; no auto-promotion of action items                                                                                | Procore                   | One-click "convert to task" from meeting notes; participant routing.                                |
| C19 | Email-in to file correspondence                                                        | **G** | —                                                                                                                                                           | Aconex, Procore           | Per-project email address (`{slug}+{project}@in.atlvs.pro`); SES inbound handler; deduplication.    |

**Phase score:** C = 0C / 4S / 1P / 1G — Near parity. C16/C17 jump to **C** once their dependencies land.

---

## D. Schedule, Budget, Contracts

| #   | Capability                                                      | ATLVS | Code anchor                                                                         | Best-in-class          | Gap delta                                                                                   |
| --- | --------------------------------------------------------------- | ----- | ----------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------- |
| D20 | Native Gantt w/ critical path + P6 / MS Project / Asta import   | **G** | `ScheduleCalendar.tsx` (calendar only); no Gantt engine                             | Procore, Unifier       | Build Gantt + CPM + XER/XML import. **Wave 2.1 + 2.2**.                                     |
| D21 | 3- / 6-week lookahead view                                      | **P** | `/console/operations/look-ahead` exists (route)                                     | Procore, Fieldwire     | Derive from Gantt baseline (gated on D20).                                                  |
| D22 | Budget w/ CSI MasterFormat + AIA G703 SOV                       | **S** | `budgets`, `cost_codes`, `payment_application_lines`                                | Sage, Procore          | Cost-code library import (MasterFormat-2026 + Uniformat + NRM2); SOV-from-budget generator. |
| D23 | Budget columns: original / approved CO / pending CO / projected | **P** | `budgets` table exists; column model unclear                                        | Procore                | Confirm/extend schema; budget detail page rebuild.                                          |
| D24 | Contracts module (prime + sub, retention, NTE, allowance)       | **P** | `independent_contractor_msas`, `offer_letters`, sub contracts via `purchase_orders` | Procore                | Unified `contracts` model w/ retention/NTE/allowance; prime contract concept.               |
| D25 | PCO → CO workflow (cost + schedule impact, ball-in-court)       | **S** | `po_change_orders`, `po_change_order_lines`; `proposal_change_orders`               | Procore                | Schedule-impact field; combined PCO→CO promotion UI.                                        |
| D26 | Change order routing w/ markup rules                            | **P** | exists in PO change orders; no rule engine                                          | Procore                | Per-CO `markup_rules` (labor%, equipment%, sub%); approval chain.                           |
| D27 | Forecast / EAC at project + portfolio level                     | **G** | —                                                                                   | Sage, Procore, Unifier | EAC engine. **Wave 3.4**.                                                                   |

**Phase score:** D = 0C / 2S / 4P / 2G — Wave 2 + Wave 3 close.

---

## E. Field Execution

| #   | Capability                                                          | ATLVS | Code anchor                                                                                                                    | Best-in-class                                | Gap delta                                                                            |
| --- | ------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- | ------------------------------------------------------------------------------------ |
| E28 | Mobile iOS + Android parity                                         | **C** | `(mobile)/m/` 45 surfaces; PWA; service worker on `compvss.*`                                                                  | Fieldwire, Procore                           | Native iOS/Android wrappers if app-store distribution required (PWA may suffice).    |
| E29 | Offline-first sync w/ conflict resolution                           | **P** | service worker registered; surface-by-surface offline status unclear                                                           | Fieldwire                                    | Sync queue audit; conflict-resolution UX on drawings, punch, daily logs.             |
| E30 | Crew clock-in w/ geofence + photo, export to payroll                | **S** | `time_clock_zones`, `time_entries`, `/m/clock`; geofencing live                                                                | Procore Field Productivity, Raken            | Payroll export to ADP/Gusto/Paychex (Wave 3.7); photo capture confirmation.          |
| E31 | Equipment time + utilization                                        | **S** | `equipment`, `asset_movements`, `maintenance_jobs`, `rentals`                                                                  | Procore, Trimble                             | Utilization analytics; idle-time detection.                                          |
| E32 | Inspections / QA-QC checklists (templates, signatures, fail→issue)  | **C** | `inspections`, `inspection_items`, `inspection_templates`, `inspection_template_items`; `/console/inspections` + `/m/check-in` | Procore, Fieldwire                           | Verify fail→punch-item auto-creation; signature capture.                             |
| E33 | Safety: JHA, 500+ toolbox talks, OSHA 300/300A/301                  | **S** | `safety_briefings` + attendees, `incidents` table modeled for OSHA, `/console/safety/osha` route                               | Raken (500+ talks; bundled library), Procore | **Ship a toolbox-talk content library** (500+ talks). 300A annual roll-up generator. |
| E34 | 360° / photo / video capture (OpenSpace / DroneDeploy / Matterport) | **G** | —                                                                                                                              | All best-in-class                            | Integrate. **Wave 4.1**.                                                             |
| E35 | Push notifications + per-kind opt-out                               | **C** | `push_subscriptions`, `notification_kind_catalog`, `notification_preferences.matrix`, `PushKind` enum, `sendPushTo/Bulk`       | Procore, Fieldwire                           | — — actually advantage on per-kind granularity.                                      |

**Phase score:** E = 3C / 3S / 1P / 1G — Near parity. Toolbox-talk library is the highest-leverage cheap win.

---

## F. Financials

| #   | Capability                                                                        | ATLVS | Code anchor                                                                                              | Best-in-class                       | Gap delta                                                      |
| --- | --------------------------------------------------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------- |
| F36 | AIA G702/G703 pay-app generation (retainage, stored materials, prior periods)     | **P** | `payment_applications`, `payment_application_lines`; `/console/finance/pay-apps`; PDF export unconfirmed | Sage, Foundation, Procore           | Pixel-accurate G702/G703 PDF export. **Wave 3.1**.             |
| F37 | Sub pay-app collection w/ lien-waiver capture                                     | **G** | —                                                                                                        | Sage, Foundation, Textura (Procore) | Lien-waiver model + workflow. **Wave 3.2**.                    |
| F38 | AP invoice OCR w/ PO/sub-contract matching                                        | **P** | `invoices`, `invoice_line_items`; OCR is `credentials/extract` only                                      | Procore Invoice Mgmt                | OCR pipeline for vendor invoices; auto-match against PO.       |
| F39 | AR w/ progress billing, T&M, fixed price, retention release                       | **S** | `invoices`, `payment_applications`; multi-billing-method support unclear                                 | Sage, Procore                       | Confirm/extend billing types; retention-release workflow.      |
| F40 | Job cost ledger w/ committed/incurred/forecast/EAC columns                        | **P** | `budgets`, `cost_codes`, `expenses`, `time_entries`, `mileage_logs` exist; ledger view absent            | Sage 300, Foundation, Viewpoint     | Build job-cost ledger view. **Wave 3.4 dependency**.           |
| F41 | Time-card → certified payroll / union / multi-state / prevailing wage             | **G** | `time_entries` exists; certified payroll modeling absent                                                 | Sage, Foundation, Viewpoint         | Build. **Wave 3.7**.                                           |
| F42 | WIP report (over/under-billing) for surety/bonding                                | **G** | —                                                                                                        | Sage, Foundation (standard)         | Build. **Wave 3.3**.                                           |
| F43 | Accounting connector (Sage 100/300, Foundation, QuickBooks, Viewpoint, Acumatica) | **G** | —                                                                                                        | Procore (300+ marketplace)          | Build certified connectors. **Wave 3.5**.                      |
| F44 | Multi-currency + multi-entity consolidation                                       | **P** | `orgs` is single-entity; multi-currency unclear                                                          | Procore, Aconex                     | Multi-entity orgs (sister-orgs) + FX conversion at line level. |
| F45 | Bank-grade payment rails (ACH, Connect, virtual cards)                            | **S** | Stripe Connect Express live; `/api/v1/stripe/connect/onboarding`                                         | Procore + Textura                   | ACH payouts to subs; virtual-card issuance for vendor pre-pay. |

**Phase score:** F = 0C / 2S / 3P / 5G — **Second-largest gap cluster.** Wave 3 owns this entirely.

---

## G. Closeout & Handover

| #   | Capability                                          | ATLVS | Code anchor                                                                   | Best-in-class                 | Gap delta                                                                            |
| --- | --------------------------------------------------- | ----- | ----------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------ |
| G46 | Punch-list close-out workflow w/ sign-offs by trade | **S** | `punch_lists`, `punch_items` + `PunchKanban`; sign-off workflow unclear       | Fieldwire                     | Trade-grouped sign-off + final certification PDF.                                    |
| G47 | Warranty period tracking w/ reminder cadence        | **G** | —                                                                             | Aconex, Kahua                 | `warranties`, `warranty_reminders`; pings sub on anniversary.                        |
| G48 | O&M manual / asset handover package                 | **P** | `venue_handover_items`, `venue_closeout_items` exist; package compiler absent | Kahua (asset-centric), Aconex | Compiler that bundles submittals + as-builts + spec sections + warranties per asset. |
| G49 | Final lien-waiver collection at job close           | **G** | —                                                                             | Sage, Foundation              | Gated on F37.                                                                        |

**Phase score:** G = 0C / 1S / 1P / 2G — Wave 3 (F37 unlock) + targeted Wave 4 work.

---

## H. Analytics, AI & Ecosystem

| #   | Capability                                                                 | ATLVS | Code anchor                                                                                         | Best-in-class                                  | Gap delta                                                                                |
| --- | -------------------------------------------------------------------------- | ----- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------- |
| H50 | Portfolio dashboards w/ drill-down, role-based views                       | **S** | `dashboards`, `client_dashboards`, `pinboards` tables; `/console/dashboards`, `/console/programs`   | Procore Analytics, Unifier                     | Role-based dashboard library; portfolio-level financial roll-ups.                        |
| H51 | Resource planning across projects                                          | **P** | `workforce_deployments`, `workforce/planning` route exists                                          | Bridgit Bench (gold standard)                  | 5-year forecast + bench-cost view. **Wave 4.5**.                                         |
| H52 | AI assistant grounded on project documents                                 | **P** | Anthropic streaming chat live at `/api/v1/ai/chat`; vector index over project docs absent           | Procore Copilot, ACC, Kahua Noa, Newforma Vojo | RAG over `deliverables` + `submittals` + `rfis` + daily logs + drawings. **Wave 4.2**.   |
| H53 | Predictive risk scoring (schedule slip, cost overrun, safety, sub default) | **G** | `risks` table exists (manual register only)                                                         | Procore (introduced 2024)                      | Build. **Wave 4.3**.                                                                     |
| H54 | Open REST/GraphQL API + webhooks + sandbox                                 | **S** | `/api/v1/*` REST surface; `webhook_endpoints` + `webhook_deliveries`; `/api/v1/openapi.json` exists | Procore, ACC                                   | GraphQL layer; sandbox environments via Supabase branches.                               |
| H55 | App marketplace / ≥100 certified integrations                              | **P** | Stripe / Slack / Zapier present; marketplace UI absent                                              | Procore (300+)                                 | Integration marketplace surface + certification program. Long-tail Wave 5 / post-parity. |

**Phase score:** H = 0C / 2S / 3P / 1G — Wave 4 closes the AI + risk + workforce-planning trio; marketplace is post-parity.

---

## Aggregate score by phase

| Phase                            | C     | S      | P      | G      | Total  | Parity % (C+S) / Total |
| -------------------------------- | ----- | ------ | ------ | ------ | ------ | ---------------------- |
| A. Identity / Access             | 4     | 1      | 0      | 0      | 5      | **100%**               |
| B. Documents / Drawings          | 0     | 1      | 4      | 3      | 8      | 13%                    |
| C. Communications / Workflow     | 0     | 4      | 1      | 1      | 6      | 67%                    |
| D. Schedule / Budget / Contracts | 0     | 2      | 4      | 2      | 8      | 25%                    |
| E. Field Execution               | 3     | 3      | 1      | 1      | 8      | **75%**                |
| F. Financials                    | 0     | 2      | 3      | 5      | 10     | 20%                    |
| G. Closeout / Handover           | 0     | 1      | 1      | 2      | 4      | 25%                    |
| H. Analytics / AI / Ecosystem    | 0     | 2      | 3      | 1      | 6      | 33%                    |
| **Total**                        | **7** | **16** | **17** | **15** | **55** | **42%**                |

**At-parity (C+S):** 23 / 55 = **42%**
**Partial (P):** 17 / 55 = **31%**
**Gap (G):** 15 / 55 = **27%**

The "~70% of the way" framing in the master roadmap counts P as "in-progress, scaffolding present" — 23+17 = 40/55 = **73%**. The remaining 15 hard gaps are the targets for Waves 1–4.

## Post-roadmap target score

| Phase                            | Target after Wave 4 | Notes                                                          |
| -------------------------------- | ------------------- | -------------------------------------------------------------- |
| A. Identity                      | 100% (unchanged)    | —                                                              |
| B. Documents / Drawings          | 100%                | Wave 1 + Wave 2.6 (clash).                                     |
| C. Communications / Workflow     | 100%                | Wave 4.4 (weather), Wave 5.3 (AI-authored).                    |
| D. Schedule / Budget / Contracts | 100%                | Wave 2.1 + 2.2; Wave 3.4.                                      |
| E. Field Execution               | 100%                | Wave 4.1 (reality capture); toolbox-talk library.              |
| F. Financials                    | 90%+                | Wave 3 closes most; multi-entity consolidation is post-parity. |
| G. Closeout / Handover           | 100%                | Wave 3.2 unlock + targeted Wave 4 sprints.                     |
| H. Analytics / AI / Ecosystem    | 90%+                | Wave 4.2 + 4.3 + 4.5; marketplace UI is post-parity.           |

Net: **>95% parity by end of Wave 4** (Q1–Q2 2027). Differentiator wave then leapfrogs.
