# LDP Lifecycle Audit — v2 (post-apply)

**Protocol:** Lifecycle Decomposition Protocol (LDP) — addendum to USNP
**Run:** Phase 0 re-audit, 2026-05-09
**Method:** direct SQL queries against live remote DB `xrovijzjbyssajhtwvas` (vs v1 which read the stale 18.8k-line worktree snapshot). v1 reports superseded.
**Scope:** 412 public tables · 23 views · 98 enum types · 411 with RLS enabled · 1 without (postgis `spatial_ref_sys`)

For each of LDP's 8 canonical lifecycles: implementation status, schema citations, conformance verdict against the actual production database state.

> **Headline change vs v1:** v1 read a 228-table snapshot. The live DB has 412 tables. USNP canon (shipped 2026-05-08, undercounted by v1) implements far more of LDP than v1 reported. Result: 5/8 lifecycles PASS in v2 (vs 0/8 in v1).

---

## 1. Project Lifecycle (8PP) — `project_phase`

**LDP canonical:** `DISCOVERY → CONCEPT → DEVELOP → ADVANCE → BUILD → SHOW → STRIKE → WRAP → ARCHIVED`

**What ships:**

- `projects.xpms_phase xpms_phase NOT NULL DEFAULT 'discovery'` — enum has all 8 LDP-canonical values (`discovery, concept, development, advance, build, show, strike, wrap`).
- Coexists with `projects.status project_status NOT NULL DEFAULT 'draft'` — values `draft, active, paused, archived, complete`. Operational on/off lifecycle distinct from the production-arc phase.
- Same `xpms_phase` enum is also used on `xpms_atoms.phase` — **LDP §SCHEMA PATTERNS DON'T** ("never reuse the same enum across two lifecycle columns"). Mitigated by both being phase semantics on XPMS-related entities, but a strict LDP read flags it.

**Verdict:** **PARTIAL** — column named `xpms_phase` not `project_phase` per LDP §1; no dedicated `project_phase_transitions` log (audit_log captures it generically).

---

## 2. Production Lifecycle — `production_phase`

**LDP canonical:** `DISCOVERY → CONCEPT → ENGINEERING → PRE_PRO → FAB → LOGISTICS → INSTALL → STRIKE → ARCHIVED`

**What ships (NEW this session):**

- `fabrication_orders.production_phase production_phase NOT NULL DEFAULT 'DISCOVERY'` — enum has **all 9 LDP-canonical values** verbatim.
- Coexists with `fabrication_orders.status text` (operational `open/in_progress/blocked/complete`). Documented as workflow-execution column distinct from the lifecycle phase.

**Verdict:** **PASS** ✓ — name + enum + values all LDP-canonical. Transition log not yet present; could be added in Wave 2.

---

## 3. Asset Lifecycle (UAL) — `asset_state`

**LDP canonical:** `ACQUIRED → AVAILABLE → RESERVED → IN_TRANSIT → IN_USE → RETURNED → IN_MAINTENANCE → RETIRED | LOST`

**What ships:**

- **`assets.state ual_state NOT NULL DEFAULT 'acquired'`** — `ual_state` enum has **all 9 LDP-canonical values** verbatim (acquired, available, reserved, in_transit, in_use, returned, in_maintenance, retired, lost).
- **`asset_movements`** append-only ledger keyed off `from_state ual_state, to_state ual_state` (USNP UAL canon, richer than what v1 audit proposed — has `movement_kind`, `from_place_id/to_place_id`, `from_custodian_id/to_custodian_id`, `reservation_starts_at/ends_at`, `reference_kind/reference_id`).
- Legacy `equipment.status equipment_status` (5-value enum: available/reserved/in_use/maintenance/retired) coexists. UAL canon `assets` is the canonical surface; `equipment` is the legacy/scoped table for physical inventory items.

**Verdict:** **PASS** ✓ — column name `state` (LDP-correct), enum values exact match, transition log present and richer than spec.

---

## 4. Deliverable Lifecycle — `deliverable_state`

**LDP canonical:** `BRIEFED → DRAFTED → IN_REVIEW → REVISION_REQUESTED → APPROVED → DELIVERED → ARCHIVED`

**What ships:**

- `deliverables.status deliverable_status NOT NULL DEFAULT 'draft'` — values `draft, submitted, in_review, approved, rejected, revision_requested`. Missing canonical BRIEFED + DELIVERED. Has `rejected` (additive).
- `deliverable_history` append-only log table.

**Verdict:** **PARTIAL** — column should be renamed `state` (R-LDP-2 Wave 2); enum should add BRIEFED + DELIVERED.

---

## 5. Engagement Lifecycle (UIS Role) — `engagement_state`

**LDP canonical:** `DISCOVERED → INTERESTED → VETTED → COMMITTED → ENABLED → CONFIRMED → ACTIVE → CLOSED → ARCHIVED`

**What ships:**

- **`uis_roles.lifecycle_state uis_lifecycle_state NOT NULL DEFAULT 'discovered'`** (per Party × Project × channel × role_class) — enum has **all 9 LDP-canonical values** verbatim.
- 23 role classes via `uis_role_class` enum (executive/designer/performer/speaker/marketing_seller/sponsor/sponsor_ambassador/press/build_vendor/production_crew/operations/security_medical/volunteer/guest/vip/member/hospitality_vendor/technology_vendor/client/delegate/workforce/agency/staff).
- **`role_lifecycle_history`** append-only log (USNP canon) — keyed off `role_id` with `from_state/to_state uis_lifecycle_state`, `reason text`, `actor_party_id`, `occurred_at`. **My session-1 addition `uis_role_state_transitions` was redundant — DROPPED in v2 audit cleanup.**

**Verdict:** **PASS** ✓ — name `lifecycle_state` is LDP-correct (state, not status); enum exact match; transition log canonical.

---

## 6. Engagement-Document Lifecycle — `document_state`

**LDP canonical:** `DRAFTED → SENT → VIEWED → SIGNED → COUNTERSIGNED → ACTIVE → EXPIRED | SUPERSEDED | VOIDED → ARCHIVED`

**What ships:**

- `offer_letters.status offer_letter_status NOT NULL DEFAULT 'draft'` — now **11 values** after this session's extensions: `draft, sent, viewed, accepted, COUNTERSIGNED, ACTIVE, declined, withdrawn, expired, SUPERSEDED, VOIDED`.
- `offer_letter_activity` log.
- `proposals.status proposal_status` (6-value coarser machine for the proposal document lane); `proposal_activity` + `proposal_events` logs.

**Verdict:** **PARTIAL** — column should be renamed `state` (R-LDP-2 Wave 2); enum value casing inconsistent (lowercase legacy + UPPERCASE additions).

---

## 7. Financial Period Lifecycle (ULG) — `period_state`

**LDP canonical:** `OPEN → IN_PERIOD → CLOSING → CLOSED → AUDITED → ARCHIVED`

**What ships (NEW this session):**

- `accounting_periods.state accounting_period_state NOT NULL DEFAULT 'OPEN'` — enum has **all 6 LDP-canonical values** verbatim. Backfilled from the legacy text `status` column.
- Legacy `accounting_periods.status text DEFAULT 'open'` retained read-only for back-compat; planned deprecation.

**Verdict:** **PASS** ✓ — typed canonical column landed.

---

## 8. Subscription Lifecycle — `subscription_state`

**LDP canonical:** `PROSPECT → TRIAL → ACTIVE → RENEWED → LAPSED → REACTIVATED | CHURNED → ARCHIVED`

**What ships (NEW this session):**

- `subscriptions.state subscription_state NOT NULL DEFAULT 'PROSPECT'` — enum has **all 8 LDP-canonical values** verbatim.
- `subscription_kind` enum: MEMBER/RETAINER/RECURRING_SPONSOR/PLATFORM_PLAN.
- `subscription_state_transitions` append-only log (with `stripe_event_id` for webhook correlation).

**Verdict:** **PASS** ✓ — every LDP §8 attribute present.

---

## Summary table — v2 vs v1

| #   | Lifecycle           | v1 verdict  | **v2 verdict**          | Change driver                                                     |
| --- | ------------------- | ----------- | ----------------------- | ----------------------------------------------------------------- |
| 1   | Project             | PARTIAL     | **PARTIAL — unchanged** | xpms_phase still LDP-misnamed; no transition log                  |
| 2   | Production          | FAIL        | **PASS** ✓              | Added `production_phase` enum + column this session               |
| 3   | Asset               | PARTIAL     | **PASS** ✓              | v1 missed the USNP `assets.state ual_state` (read stale snapshot) |
| 4   | Deliverable         | PARTIAL     | **PARTIAL — unchanged** | Naming + 2 missing states; deferred to Wave 2 column-rename       |
| 5   | Engagement          | DISTRIBUTED | **PASS** ✓              | v1 missed the USNP `uis_roles.lifecycle_state`                    |
| 6   | Engagement-Document | PARTIAL     | **PARTIAL — improved**  | Now 11 values (was 7); naming still `status`                      |
| 7   | Financial Period    | FAIL        | **PASS** ✓              | Added `accounting_periods.state accounting_period_state`          |
| 8   | Subscription        | FAIL        | **PASS** ✓              | Added `subscriptions` + state + transitions                       |

**Score:** v1 = 0 PASS / 5 PARTIAL / 3 FAIL · **v2 = 5 PASS / 3 PARTIAL / 0 FAIL**.

**Bonus USNP-canon state machines (sub-systems, not LDP-canonical lifecycles but worth noting):**

| USNP enum             | Where used                                          | Values                                                                                                                                            |
| --------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uct_state`           | `contracts.state`                                   | 10 (draft/in_review/negotiation/awaiting_signatures/active/expiring/expired/terminated/renewed/archived)                                          |
| `ucs_event_state`     | `calendar_events.state`                             | 6 (proposed/confirmed/in_progress/completed/cancelled/superseded)                                                                                 |
| `utm_state`           | `tasks_v2.state` + `task_status_history`            | 7 (open/in_progress/blocked/in_review/done/cancelled/archived)                                                                                    |
| `utt_timesheet_state` | `timesheets.state`                                  | 6 (open/submitted/approved/rejected/posted/archived)                                                                                              |
| `utx_state`           | `transactions.state` + `transaction_status_history` | 8 (draft/issued/partial_paid/paid/overdue/disputed/voided/archived)                                                                               |
| `uqm_state`           | `uqm_incidents.state`                               | 8 (reported/triaged/investigating/root_cause_identified/corrective_actions_open/resolved/archived/superseded)                                     |
| `upo_state`           | `purchase_orders.state` + `requisitions.state`      | 13 (requisitioned/approved/sourcing/rfq_issued/responses_received/awarded/issued/acknowledged/partial_received/received/matched/closed/cancelled) |

These compose with the 8 LDP lifecycles via UNS event subscriptions.
