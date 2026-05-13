# XPMS → FLYTEHAUS Mapping

**Status:** canonical · **Authority:** USNP/XPMS conceptual layer ⇄ FLYTEHAUS implementation layer · **Owner:** platform · **Created:** Phase 0 deliverable item zero, E2E-LRP run 2026-05-09

This document is the single source of truth for translating between the **conceptual XPMS/USNP architecture vocabulary** and the **FLYTEHAUS implementation vocabulary** as it exists in this codebase. Future protocols (E2E-LRP, LDP, USNP work, audits) reference this doc instead of duplicating the mapping.

> **Two layers, one platform.** XPMS/USNP names the abstractions. FLYTEHAUS names the tables, route groups, and SDK modules that ship them. When a protocol says "UIS," look here for the implementation. When the codebase says `talent_offers`, look here for the conceptual placement.

---

## Layer 1 — Subsystem mapping

| Conceptual (XPMS / USNP)                         | FLYTEHAUS implementation                                                                                                                                                                                                      | Status in code                                                                                                                | Anchors                                                                                                                            |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **UIS** — Identity / Parties / Roles / Lifecycle | `orgs`, `users`, `memberships`, `project_members`, `crew_members`, `delegations`, `delegation_entries`, marketplace `talent_profiles`, `user_profiles`; SDK in `src/lib/auth.ts`, `src/lib/security/`, `src/lib/webauthn.ts`  | **REAL** — multi-table; lacks unified `engagement_state` (see LDP audit)                                                      | `0001_remote_snapshot.sql:4272` (memberships), `:4981` (project_members), `0002:160` (talent_profiles), `0002:590` (user_profiles) |
| **UAL** — Asset Ledger                           | `equipment`, `rentals`, `asset_links`, `maintenance_jobs`, `maintenance_schedules`; warehouse routes under `/console/production/warehouse/*`                                                                                  | **REAL** — typed `equipment_status` enum; missing IN_TRANSIT / RETURNED / LOST states; no append-only movement ledger         | `0001:3421` (equipment), `:2716` (asset_links), `:4189` (maintenance_jobs), enum `:196`                                            |
| **UCS** — Calendar / Scheduling                  | `events`, `locations`, `dispatch_runs`, `availability_slots`, `automation_schedules`, `event_milestones` (booking canon); SDK fragments in `src/lib/db/`, ICS export at `/api/v1/schedule.ics`                                | **REAL** — events typed enum; calendar route at `/console/schedule`                                                           | `0001:3470` (events), `:4169` (locations), `0002:490` (availability_slots), `0003:311` (event_milestones)                          |
| **UFS** — Forms                                  | `form_defs`, `form_submissions`, `deliverables`, `deliverable_comments`, `deliverable_history`, `deliverable_templates`; `src/lib/forms/`, `src/lib/zod/`                                                                     | **REAL** — typed deliverable_status; deliverable_history is the transition log                                                | `0001:3557` (form_defs), `:3575` (form_submissions), `:3299` (deliverables), `:3264` (deliverable_history)                         |
| **UAS** — Approvals                              | `approvals` (typed `approval_state`), `po_change_orders` (typed `change_order_state`), `payment_applications`, `prequalification_questionnaires`; no centralised `src/lib/approvals/` SDK                                     | **REAL** — multi-table; approval logic is per-domain not unified                                                              | `0001:5060` (approvals; near `:5064` state column), `:4868` (po_change_orders), `:4802` (payment_applications)                     |
| **UCT** — Contracts                              | `proposals`, `proposal_share_links`, `proposal_activity`, `proposal_events`, `offer_letters`, `offer_letter_activity`, `org_offer_letter_settings`; SDK in `src/lib/proposals/`, `src/lib/offer-letters/`                     | **REAL** — proposals upstream, offer_letters are signed instruments; granular `offer_letter_status` enum                      | `0001:5103` (proposal_events), `:4341` (offer_letters), `:4325` (offer_letter_activity), `:4390` (org_offer_letter_settings)       |
| **UTX** — Transactions                           | `invoices`, `invoice_line_items`, `payment_applications`, `payment_application_lines`, `stripe_events`; SDK in `src/lib/stripe.ts`                                                                                            | **REAL** — typed invoice_status; Stripe webhook receiver at `/api/v1/webhooks/stripe`                                         | `0001:4051` (invoices), `:4035` (invoice_line_items), `:4802` (payment_applications), `:5935` (stripe_events)                      |
| **ULG** — Ledger                                 | `expenses`, `budgets`, `time_entries`, `mileage_logs`, `cost_codes`, `usage_events`; no `financial_periods` table                                                                                                             | **PARTIAL** — operational finance tables present; **no financial period lifecycle** (LDP P6 conflation, see audit)            | `0001:3489` (expenses), `:2842` (budgets), `:3664` (time_entries), `:2975` (cost_codes)                                            |
| **UPO** — Procurement                            | `vendors`, `requisitions`, `purchase_orders`, `po_line_items`, `po_change_orders`, `po_change_order_lines`, `po_checklist_items`, `prequalification_*`; routes under `/console/procurement/*`; RFQs in marketplace canon      | **REAL** — full RFQ/PO/CO lifecycle with checklists                                                                           | `0001:4913` (po_line_items), `:4868` (po_change_orders), `:4929` (prequalification_questionnaires)                                 |
| **UAP** — Audit                                  | `audit_log`, `domain_events`, `proposal_events`, `service_request_events`, `stripe_events`, `usage_events`, `venue_build_log`, `accreditation_changes`; SDK in `src/lib/audit.ts`                                             | **REAL** — single canonical `audit_log`; per-subsystem event tables; emit helper in audit.ts                                  | `0001:2731` (audit_log), `:3346` (domain_events), `0001:5103` (proposal_events)                                                    |
| **URM** — Pipeline / CRM                         | `clients`, `leads`, `campaigns`, `pipeline` (route), `proposals`; lead_stage enum on leads                                                                                                                                    | **REAL** — proposals act as deals; `/console/pipeline` and `/console/leads` routes shipped                                    | `0001:2912` (clients), `:4149` (leads), `:2864` (campaigns); enum `lead_stage:341`                                                 |
| **UNS** — Notifications                          | `notifications`, `automation_runs`, `automation_subscriptions`, `webhook_deliveries`, `crisis_alerts`, `crisis_alert_receipts`; SDK in `src/lib/notify.ts`, `src/lib/notify-resolver.ts`, `src/lib/push/`, `src/lib/email.ts` | **REAL** — single `notify({...})` emitter, push subs, web-push, RPC `emit_notification`                                       | `0001:4307` (notifications), `:3036` (crisis_alert_receipts), `:3050` (crisis_alerts)                                              |
| **UFI** — File Storage                           | Supabase Storage buckets (`advancing`, `receipts`, `proposals`, `credentials`, `branding`); signed-URL endpoints                                                                                                              | **REAL** — described in CLAUDE.md, used by deliverables/offer-letters/proposals                                               | CLAUDE.md "Supabase Storage"                                                                                                       |
| **UIN** — External integrations                  | `integration_connectors`, `org_integrations`, `org_sso_providers`, `org_event_log_destinations`, `ticketing_connections` (booking canon); SDK in `src/lib/integrations/`, `src/lib/external/`                                 | **PARTIAL** — Stripe wired; SSO providers table present but **SSO/SCIM not implemented** per `reports/03_REMEDIATIONS.md` R-2 | `0001:3990` (integration_connectors), `:4706` (org_sso_providers), `0003:185` (ticketing_connections)                              |
| **URP** — Reporting / Analytics                  | `dashboards`, `views`, `reports/` runtime endpoints; SDK in `src/lib/dashboards/`, `src/lib/views/`                                                                                                                           | **REAL** — dashboard widgets, query views                                                                                     | `0001:3200` (dashboards)                                                                                                           |

**Subsystems referenced by USNP/XPMS but not implemented as discrete tables in this codebase:**

| Conceptual                                      | Reason / status                                                                                                                                                       | Action                                             |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Subscription / membership-as-recurring (LDP §8) | No `subscriptions` table                                                                                                                                              | Out of scope this run; see LDP_REMEDIATION_PLAN.md |
| Financial Period (LDP §7)                       | No `financial_periods` table                                                                                                                                          | Out of scope this run; see LDP_REMEDIATION_PLAN.md |
| Engagement Lifecycle (LDP §5)                   | Per-Party-per-Project state distributed across `talent_offers`, `job_applications`, `open_call_submissions`, `project_members` — no unified `engagement_state` column | See LDP audit                                      |

---

## Layer 2 — Lifecycle vocabulary mapping (the central reconciliation)

There are **three** competing 8-phase models in the project ecosystem. The implementation column tells you what `xpms_phase` actually contains in the database today.

| Model                                                      | Sequence                                                                                             | Where it lives                                                                                                                                                       | Authority                                 |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| **LDP §1 Project Lifecycle** (canonical 8PP)               | DISCOVERY → CONCEPT → DEVELOP → ADVANCE → BUILD → SHOW → STRIKE → WRAP → ARCHIVED                    | `LIFECYCLE_DECOMPOSITION_PROTOCOL.md`                                                                                                                                | Conceptual / addendum to USNP             |
| **`xpms_phase` enum (in code)**                            | discovery → concept → **development** → advance → build → show → strike → wrap                       | [src/lib/xpms/index.ts:118-127](src/lib/xpms/index.ts:118), [supabase/migrations/0001_remote_snapshot.sql:709-718](supabase/migrations/0001_remote_snapshot.sql:709) | **Implementation — what runs in prod**    |
| **Repo memory `feedback_8_phase_lifecycle.md`** (fab-shop) | Discovery → Concept → **Engineering** → **Pre-Pro** → **Fab** → **Logistics** → **Install** → Strike | User memory file                                                                                                                                                     | Convention for proposals; **NOT in code** |

**Resolution applied for this E2E-LRP run** (per user direction in turn 3, reconciled with code):

- `xpms_phase` enum (event-production sequence) **IS** the LDP §1 Project Lifecycle. They differ only by `development` vs `develop` — a single-token cosmetic gap.
- The fab-shop sequence in memory is the LDP §2 **Production Lifecycle** as applied to the fabrication sub-domain. It is **not implemented in schema** (no `production_phase` column anywhere). `fabrication_orders.status` (text: `open|in_progress|blocked|complete`) is the closest existing column and is too coarse to be a real production phase machine.
- For test-plan sequencing in this run we will exercise the implemented column (`projects.xpms_phase`), not the memory file's sequence. The fab sequence is logged as an architectural backlog item per the user's note, not blocking.

---

## Layer 3 — Shell / surface mapping

| Conceptual (USNP)                            | FLYTEHAUS shell          | Route prefix                                | Subdomain                  | Brand                     |
| -------------------------------------------- | ------------------------ | ------------------------------------------- | -------------------------- | ------------------------- |
| Marketing / SEO surface                      | `(marketing)`            | `/`                                         | `flytehaus.studio`         | FLYTEHAUS apex            |
| Auth / pre-session                           | `(auth)`                 | `/login`, `/signup`, `/accept-invite/*` etc | apex                       | FLYTEHAUS apex            |
| Personal (any authed user)                   | `(personal)`             | `/me/*`                                     | apex                       | FLYTEHAUS apex            |
| Internal Ops Console                         | `(platform)` / **ATLVS** | `/console/*`                                | `atlvs.flytehaus.studio`   | red                       |
| External Stakeholder Portal                  | `(portal)` / **GVTEWAY** | `/p/[slug]/*`                               | `gvteway.flytehaus.studio` | blue                      |
| Field Ops PWA                                | `(mobile)` / **COMPVSS** | `/m/*`                                      | `compvss.flytehaus.studio` | yellow/amber              |
| Parent-co marketing (out of FLYTEHAUS scope) | `(ghxstship)`            | `/ghxstship/*`                              | apex                       | bermuda-triangle (locked) |

---

## Layer 4 — Naming discipline (LDP-locked)

| Word     | Meaning                                                                               | Where                                                        | Status in this codebase                                                                                                                                                                                           |
| -------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `phase`  | Time-bounded macro arc, sequential, gated                                             | `xpms_phase`, prospective `project_phase`/`production_phase` | Partial — `xpms_phase` is correct; `production_phase` missing; `proposal_phase_status` is a hybrid (one column carrying both phase and status meaning)                                                            |
| `state`  | Repeatable operational state, can cycle                                               | `*_state` enums                                              | Some correct (`approval_state`, `change_order_state`, `revision_state`, `roster_state`, `accreditation_state`, `handover_state`, `vetting_state`, `import_job_state`, `job_state`, `xpms_state`); some violations |
| `status` | RESERVED — preferably never used; every `status` column is a defect candidate per LDP | banned in new schema                                         | **45+ status columns present** — see `LDP_NAMING_AUDIT.md`                                                                                                                                                        |

---

## Use of this document

- **By future protocols (E2E-LRP, USNP audits):** treat the table above as the canonical translation. Reference this file by path; do not duplicate.
- **By new schema work:** if a new table needs a state column, the column **MUST** be named `*_state` or `*_phase` per the discipline table above. `status` is the legacy default and is being deprecated.
- **By PRs touching state machines:** schema review checks naming first. A `status` column in new code is a review-stop.
- **When XPMS/USNP terminology is ambiguous:** add a row to the Layer 1 table and PR it. The conceptual layer is the slow-moving spec; the implementation layer is the fast-moving reality.

---

## Out of scope for this mapping

- Per-table column-level mapping (lives in `LDP_NAMING_AUDIT.md`).
- State machine transition diagrams (lives in `LDP_LIFECYCLE_AUDIT.md`).
- Remediation prioritisation (lives in `LDP_REMEDIATION_PLAN.md`).
- Cross-shell URL composition (lives in `src/lib/urls.ts` + CLAUDE.md "Cross-shell URLs").
