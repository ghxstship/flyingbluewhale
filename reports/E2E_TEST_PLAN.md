# E2E_TEST_PLAN

**Protocol:** E2E-LRP §PHASE 2 — Test Plan Generation
**Run:** 2026-05-09
**Coverage scope:** 7-row Role × Channel matrix × 8-phase production lifecycle (LDP §1 Project Lifecycle as implemented in `xpms_phase`) + Phase 5 LDP-remediation lifecycles (asset_movements, engagement_state, financial_periods, subscriptions)
**Harness:** Playwright (existing — 35+ specs in `e2e/`); supplemented by lifecycle-specific composition tests

> **Execution mode for this run.** The 35+ existing Playwright specs are the primary execution surface (see `E2E_RUN_LOG.md` for results). New lifecycle-specific cases enumerated below are **planned but not authored** during this session — Phase 2 protocol requires the plan to exist as a document before any new spec is written, and the plan deliverable is the artifact. Where existing specs already cover a planned cell, that cell is marked `→ existing:<spec-name>`.

---

## Test plan structure

Each case carries: `case_id` · `phase` (LDP §1 8PP / xpms_phase) · `subsystem(s)` · `role × channel` · `actor` · `precondition` · `steps` · `expected outcome` · `acceptance criteria` · `coverage source`.

---

## Coverage matrix — Role × Channel × Phase

7 rows × 8 phases × {positive, RBAC denial, validation rejection} = 168 cells minimum. Plus 14 composition cases. **Total planned: 182 cases.**

### Positive case enumeration (56 cells: 7 rows × 8 phases)

For each phase, the test asserts:

- Actor can perform the canonical action for that phase
- `xpms_phase` advances correctly when the trigger fires
- `audit_log` row is emitted with correct correlation_id
- LDP-relevant lifecycle state advances (engagement_state, asset_state, etc.)

| ID      | Phase       | Role      | Channel             | Action                                                                   | Existing spec                                              |
| ------- | ----------- | --------- | ------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------- |
| C-V-D   | discovery   | Vendor    | marketplace_bid     | Browse public RFQ list, view detail                                      | `marketplace-canon.spec.ts`, `routes-public-smoke.spec.ts` |
| C-V-C   | concept     | Vendor    | marketplace_bid     | Submit bid response with attachments                                     | `marketplace-canon-actions.spec.ts`                        |
| C-V-Dv  | development | Vendor    | marketplace_bid     | Receive shortlist notification, accept                                   | new                                                        |
| C-V-A   | advance     | Vendor    | marketplace_bid     | Sign vendor agreement (offer letter), upload COI/W-9                     | `forms-construction-trade.spec.ts` (partial)               |
| C-V-B   | build       | Vendor    | marketplace_bid     | Submit deliverable per RFQ scope                                         | new                                                        |
| C-V-S   | show        | Vendor    | marketplace_bid     | On-site asset checkout via mobile                                        | `mobile.spec.ts`                                           |
| C-V-St  | strike      | Vendor    | marketplace_bid     | Asset return; final invoice submission                                   | new                                                        |
| C-V-W   | wrap        | Vendor    | marketplace_bid     | Receive final payment confirmation, leave review                         | `marketplace-canon.spec.ts` (review side)                  |
| C-P-D   | discovery   | Performer | curated_opportunity | Open call published; performer profile discoverable                      | `marketplace-canon.spec.ts`                                |
| C-P-C   | concept     | Performer | curated_opportunity | Submit submission with EPK                                               | `marketplace-canon-actions.spec.ts`                        |
| C-P-Dv  | development | Performer | curated_opportunity | Selected; offer letter sent                                              | `booking-canon.spec.ts` (offer-tier)                       |
| C-P-A   | advance     | Performer | curated_opportunity | Offer countersigned (LDP doc lifecycle); KBYG generated; rider submitted | `booking-canon-extras.spec.ts`                             |
| C-P-B   | build       | Performer | curated_opportunity | Tech rider approved, stage plot delivered                                | new                                                        |
| C-P-S   | show        | Performer | curated_opportunity | Day-of-show ROS published; performance                                   | new                                                        |
| C-P-St  | strike      | Performer | curated_opportunity | Settlement submitted; deal closed                                        | `booking-canon.spec.ts` (settlement)                       |
| C-P-W   | wrap        | Performer | curated_opportunity | Booking insights captured; review                                        | new                                                        |
| C-Cr-D  | discovery   | Crew      | job_listing         | Job posting published; discoverable                                      | `marketplace-canon.spec.ts`                                |
| C-Cr-C  | concept     | Crew      | job_listing         | Submit job application                                                   | `marketplace-canon-actions.spec.ts`                        |
| C-Cr-Dv | development | Crew      | job_listing         | Phone screen → booked transition                                         | new                                                        |
| C-Cr-A  | advance     | Crew      | job_listing         | Accept booking; complete onboarding (industry-leading flow)              | `compliance-flow.spec.ts`                                  |
| C-Cr-B  | build       | Crew      | job_listing         | Receive call sheet                                                       | new                                                        |
| C-Cr-S  | show        | Crew      | job_listing         | Mobile clock in/out (geo-verified)                                       | `mobile.spec.ts`                                           |
| C-Cr-St | strike      | Crew      | job_listing         | Submit timesheet                                                         | new                                                        |
| C-Cr-W  | wrap        | Crew      | job_listing         | Time approved → invoice/payout                                           | new                                                        |
| C-Sp-D  | discovery   | Sponsor   | sales_pipeline      | Lead created in pipeline                                                 | new                                                        |
| C-Sp-C  | concept     | Sponsor   | sales_pipeline      | Proposal drafted                                                         | `cms-to-portal-roundtrip.spec.ts`                          |
| C-Sp-Dv | development | Sponsor   | sales_pipeline      | Proposal sent → viewed                                                   | `portal.spec.ts`                                           |
| C-Sp-A  | advance     | Sponsor   | sales_pipeline      | Proposal signed; activation deliverables briefed                         | new                                                        |
| C-Sp-B  | build       | Sponsor   | sales_pipeline      | Brand assets uploaded; activation built                                  | new                                                        |
| C-Sp-S  | show        | Sponsor   | sales_pipeline      | Activation runs; impressions tracked                                     | new                                                        |
| C-Sp-St | strike      | Sponsor   | sales_pipeline      | Wrap report published                                                    | new                                                        |
| C-Sp-W  | wrap        | Sponsor   | sales_pipeline      | Final invoice paid; renewal triggered (Subscription Lifecycle)           | new                                                        |
| C-G-D   | discovery   | Guest     | ticket_purchase     | Ticket type announced                                                    | new                                                        |
| C-G-C   | concept     | Guest     | ticket_purchase     | Presale signup                                                           | new                                                        |
| C-G-Dv  | development | Guest     | ticket_purchase     | On-sale                                                                  | new                                                        |
| C-G-A   | advance     | Guest     | ticket_purchase     | Purchase → ticket issued                                                 | `routes-public-smoke.spec.ts` (partial)                    |
| C-G-B   | build       | Guest     | ticket_purchase     | Pre-show comms; KBYG (guest persona)                                     | new                                                        |
| C-G-S   | show        | Guest     | ticket_purchase     | Gate scan                                                                | `mobile.spec.ts`                                           |
| C-G-St  | strike      | Guest     | ticket_purchase     | Survey response                                                          | new                                                        |
| C-G-W   | wrap        | Guest     | ticket_purchase     | Receipt + review prompt                                                  | new                                                        |
| C-VP-D  | discovery   | VIP       | comp_list           | Comp inventory created                                                   | new                                                        |
| C-VP-C  | concept     | VIP       | comp_list           | VIP profile added                                                        | new                                                        |
| C-VP-Dv | development | VIP       | comp_list           | Comp issued                                                              | new                                                        |
| C-VP-A  | advance     | VIP       | comp_list           | VIP itinerary published                                                  | new                                                        |
| C-VP-B  | build       | VIP       | comp_list           | Hospitality assigned                                                     | new                                                        |
| C-VP-S  | show        | VIP       | comp_list           | Concierge handoff at gate                                                | new                                                        |
| C-VP-St | strike      | VIP       | comp_list           | Departure manifest                                                       | new                                                        |
| C-VP-W  | wrap        | VIP       | comp_list           | Thank-you + future-engagement scheduling                                 | new                                                        |
| C-Vo-D  | discovery   | Volunteer | volunteer_signup    | Volunteer program announced                                              | new                                                        |
| C-Vo-C  | concept     | Volunteer | volunteer_signup    | Application submitted                                                    | new                                                        |
| C-Vo-Dv | development | Volunteer | volunteer_signup    | Vetting review                                                           | new                                                        |
| C-Vo-A  | advance     | Volunteer | volunteer_signup    | Onboarded; training assigned                                             | new                                                        |
| C-Vo-B  | build       | Volunteer | volunteer_signup    | Uniform pickup booked                                                    | new                                                        |
| C-Vo-S  | show        | Volunteer | volunteer_signup    | Shift clock in/out                                                       | new                                                        |
| C-Vo-St | strike      | Volunteer | volunteer_signup    | Shift complete; meal credit applied                                      | new                                                        |
| C-Vo-W  | wrap        | Volunteer | volunteer_signup    | Volunteer recognition                                                    | new                                                        |

### Negative cases (5 per role = 35 cases)

For each role, at minimum:

- **N-rbac-{role}** — RBAC denial: actor without permission attempts a privileged action; expect 401/403/RLS deny. Existing: `capability-gating.spec.ts`, `rls-boundaries.spec.ts`, `roles.spec.ts`
- **N-state-{role}** — State machine violation: attempt invalid xpms_phase regression; expect 422. Mostly `new`.
- **N-validation-{role}** — Submit malformed form data; expect 422 with field errors. Existing: `forms-public.spec.ts`, `forms-render-smoke.spec.ts`
- **N-concurrency-{role}** — Two parties act on same record; expect optimistic-lock or last-write-wins documented behavior. New.
- **N-idempotency-{role}** — Replay same action twice; expect 200 + idempotency-key honored. Existing: `api-idempotency.spec.ts`

### Cross-subsystem composition cases (mandatory per E2E-LRP §PHASE 2 §"Cross-subsystem composition cases")

These directly verify the LDP composition contracts:

| ID   | Contract                       | Trigger                                     | Cascade asserted                                          | Coverage                                    |
| ---- | ------------------------------ | ------------------------------------------- | --------------------------------------------------------- | ------------------------------------------- |
| X-1  | UFS → UAS                      | Submit deliverable form                     | Approval policy auto-routes                               | new                                         |
| X-2  | UAS → UIS                      | Approval granted                            | engagement_state advances on project_members              | new (LDP-§5 net-new)                        |
| X-3  | UIS → UAL + UFS                | Engagement reaches ENABLED                  | Credentials issued; KBYG generated                        | new                                         |
| X-4  | UCS → UAL                      | Calendar event reserves asset               | asset_movements row appended; equipment.status = reserved | new (LDP-§3 ledger)                         |
| X-5  | UCT → UTX                      | Contract milestone hit                      | Invoice generated                                         | `cms-to-portal-roundtrip.spec.ts` (partial) |
| X-6  | UTX → ULG                      | Invoice paid                                | Ledger entry posted into open `financial_periods` row     | new (LDP-§7 net-new)                        |
| X-7  | UTX → Subscription             | Stripe renewal event                        | subscription_state: ACTIVE → RENEWED + transitions row    | new (LDP-§8 net-new)                        |
| X-8  | Document → Engagement          | offer_letters.status = COUNTERSIGNED        | engagement_state → ENABLED                                | new (LDP-§5/§6 cascade)                     |
| X-9  | Document → KBYG                | Engagement reaches ENABLED                  | event_guides row generated for matching persona           | `cms-to-portal-roundtrip.spec.ts` (partial) |
| X-10 | Lifecycle → Audit              | Any state transition                        | audit_log + correlation_id chain                          | `audit-log.spec.ts`                         |
| X-11 | Period close → reconciliation  | financial_periods: CLOSING → CLOSED         | All open invoices for period reconciled or flagged        | new (LDP-§7)                                |
| X-12 | Production phase → Asset state | fabrication_orders.production_phase: STRIKE | All linked equipment.status → RETURNED                    | new (LDP-§2/§3)                             |
| X-13 | Project phase → Engagement     | xpms_phase = SHOW                           | Documented as advisory-only (LDP §1: no auto-changes)     | new                                         |
| X-14 | RLS boundary                   | Cross-org access attempt                    | RLS denies; audit_log records denial                      | `rls-boundaries.spec.ts`                    |

**Composition coverage today:** 4 of 14 cases have existing spec coverage; 10 are new (mostly the LDP §2/§3/§5/§7/§8 contracts since the lifecycles themselves were just added).

---

## Phase coverage compliance with E2E-LRP §PHASE 2 §"Required coverage minimum"

| 8PP Phase   | Required cases                                                                                                      | Plan covers                                |
| ----------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Discovery   | Project creation, XPMS config, APS hierarchy setup                                                                  | C-V-D through C-Vo-D + project setup smoke |
| Concept     | Initial UIS Party invitations across channels, URM pipeline opportunities                                           | C-\*-C row                                 |
| Development | UCT contracts drafted, UAS approval routing, UFS form definitions deployed                                          | C-\*-Dv row + X-1                          |
| Advance     | KBYG generation, RDSP four-doc chain delivery per Role variant, UCS schedules confirmed, UAL asset reservations     | C-\*-A row + X-3, X-4, X-9                 |
| Build       | UPO procurement, UAL movements, UTT time entries opening, UQM incident report                                       | C-\*-B row + new procurement specs         |
| Show        | UCS event state transitions, UTX ticket sales / comp issuance, on-site UAL custody changes, real-time UAS approvals | C-\*-S row (mobile.spec.ts)                |
| Strike      | UAL asset returns, UTT timesheet submission and approval, UQM post-event incident review                            | C-\*-St row + X-12                         |
| Wrap        | UTX final invoicing, ULG period close, URP reporting generation, UIS lifecycle ARCHIVED transitions                 | C-\*-W row + X-6, X-7, X-11                |

All 8 phases covered. Compliance: ✅.

---

## Acceptance criteria

A run of this plan PASSES when:

1. **All existing 35+ specs PASS** (per the prior UJV baseline of 847/847).
2. **All composition cases X-1 through X-14 implementing the LDP-net-new lifecycles PASS** once spec authorship lands (deferred from this session).
3. **Negative cases all confirm denial / validation behavior** as expected.
4. **For every state transition exercised, an `audit_log` row exists with the lifecycle event_type and correlation_id** (verified by direct DB query inside the spec, not just UI state).
5. **No third-party-credential cases pass** unless the env is provisioned (per UJV Tier C — environment-gated, not failing).

---

## Out-of-scope for this run

Per the user's turn-3 mode (HYBRID with deferred schema/RLS/auth/financial/audit) and protocol §STOP CONDITIONS:

- New spec authorship for the ~10 net-new composition cases — the schema migrations they verify (`asset_movements`, `engagement_state`, `financial_periods`, `subscriptions`) are committed as files but **not applied** to any database in this run, so any spec exercising them would have no DB to assert against.
- Phase 2 in-browser execution of cases that require populating Stripe/Anthropic/Resend env (BLOCKED per UJV Tier C precedent).
- Any test case that requires schema column rename (e.g., `equipment.status` → `equipment.asset_state`) since column renames are deferred per `LDP_REMEDIATION_PLAN.md` Wave 3.
