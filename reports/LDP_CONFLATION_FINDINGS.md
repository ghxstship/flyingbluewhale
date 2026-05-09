# LDP Conflation Findings

**Protocol:** Lifecycle Decomposition Protocol (LDP) — 7 conflation heuristic patterns
**Run:** Phase 0 of E2E-LRP, 2026-05-09
**Method:** walk LDP §CONFLATION DETECTION HEURISTICS Patterns 1–7 against observed schema; cite file:line

For each LDP pattern: every match in this codebase, severity, recommended split.

---

## P1 — Single `status` column on parent record mixing lifecycles

**LDP symptom:** A `projects.status` column with values like `('draft', 'active', 'in_production', 'closed', 'archived')` mixing what looks like a Project phase with a Production state.

**Search results:**

- `projects.status project_status` enum (`draft, active, paused, archived, complete`) at [0001:4434](supabase/migrations/0001_remote_snapshot.sql:4434) **coexists with** `projects.xpms_phase xpms_phase` enum (`discovery, concept, development, advance, build, show, strike, wrap`) at [0001:4444](supabase/migrations/0001_remote_snapshot.sql:4444).

**Verdict:** **Not strict P1**, but related anti-pattern.

The two columns are split (one for activity-level, one for production-arc). LDP P1 warns about a SINGLE column mixing both — this codebase has TWO columns instead, which is closer to canonical decomposition. The remaining issue is naming: `status` should be split into operational state and a separate lifecycle column. Currently `project_status` carries both "is this project active vs paused" (operational) and "is it archived vs complete" (terminal-state). LDP would prefer:

- `project_phase` (DISCOVERY → ... → WRAP → ARCHIVED) — would absorb `archived` from status
- `project_active_state` (or remove altogether) — for paused/active toggle

**Other potential P1 matches:**

- `fabrication_orders.status text CHECK ('open', 'in_progress', 'blocked', 'complete')` at [0001:3541](supabase/migrations/0001_remote_snapshot.sql:3541) — single column carrying production-execution semantics for what should be `production_phase` (FAB / LOGISTICS / INSTALL / STRIKE per LDP §2). Mixing 4 workflow states with what should be 9 phase states. **MEDIUM severity P1.**
- `events.status event_status` (draft/scheduled/...) — mixes calendar lifecycle with show-state. Lower severity; events are a calendar primitive, not a multi-lifecycle entity.

---

## P2 — Engagement state on the Party record (not per Party × Project)

**LDP symptom:** `parties.status` with values like `('lead', 'active', 'inactive')` per Party globally rather than per Party per Project.

**Search results:**

- ✅ Good news: there IS a `project_members` table at [0001:4981](supabase/migrations/0001_remote_snapshot.sql:4981), referenced by RLS helpers `private.has_project_role(target_project, required[])` at [0001:870](supabase/migrations/0001_remote_snapshot.sql:870) and `private.is_project_member(target_project)` at [0001:925](supabase/migrations/0001_remote_snapshot.sql:925). This is the LDP-correct per-Party-per-Project membership join.
- ❌ Bad news: `project_members` does NOT carry an `engagement_state` column. State is implicit (record exists = engaged; record absent = not engaged). No DISCOVERED → INTERESTED → VETTED → ... → ACTIVE machine.
- The actual engagement-state machinery is **distributed across 4 channel-specific tables**:
  - `talent_offers.status talent_offer_status` (`draft, sent, countered, accepted, contracted, declined, cancelled`) at [0002:364](supabase/migrations/0002_marketplace_canon.sql:364)
  - `job_applications.status job_application_status` (`new, reviewed, phone, booked, hold, pass, withdrawn`) at [0002:464](supabase/migrations/0002_marketplace_canon.sql:464)
  - `open_call_submissions.status submission_status` (`submitted, shortlisted, rejected, awarded, withdrawn`) at [0002:313](supabase/migrations/0002_marketplace_canon.sql:313)
  - `invites.status text` (`pending, accepted, revoked`) at [0001:4013](supabase/migrations/0001_remote_snapshot.sql:4013)
- `memberships.role` carries a global org-level role, not engagement state. Working as designed for tenancy.

**Verdict:** **DISTRIBUTED CONFLATION** — not strict P2 (state is per Party × Channel × Project, not per Party globally), but LDP §5 envisions one Engagement Lifecycle visible across all channels. Currently no unified view.

**Severity:** MEDIUM. Each channel works in isolation but cross-channel reporting (e.g., "show me all engagements in COMMITTED state for project X regardless of channel") cannot be answered without union queries across 4+ tables with disjoint enums.

---

## P3 — Deliverable state rolled up onto parent

**LDP symptom:** A `projects.deliverables_status` field, or a `contracts.completion_status` field that aggregates child deliverable progress.

**Search results:**

- No `projects.deliverables_status` or similar aggregator columns observed in the snapshot grep.
- `projects.status project_status` does NOT include rollup values like "deliverables_complete".
- `proposals.status proposal_status` (`draft, sent, approved, rejected, expired, signed`) at [0001:456](supabase/migrations/0001_remote_snapshot.sql:456) — does not roll up child deliverables.

**Verdict:** **NO P3 INSTANCES FOUND** — deliverable state is correctly per-record at `deliverables.status` and `deliverable_history`. ✅

---

## P4 — Asset state inferred from related events

**LDP symptom:** No `asset_state` column; asset availability inferred by querying the latest reservation event and checking dates.

**Search results:**

- ✅ `equipment.status equipment_status` (`available, reserved, in_use, maintenance, retired`) is an explicit, typed column at [0001:3428](supabase/migrations/0001_remote_snapshot.sql:3428).
- ⚠️ However, no `asset_movements` append-only ledger. Reservation/return history must be reconstructed from `rentals` table state changes + `audit_log`. LDP §3 requires "first-class `asset_state` column with append-only `asset_movements` ledger." First half satisfied, second half missing.

**Verdict:** **PARTIAL P4** — column exists (clears the strict pattern); ledger missing (clears the inference-only failure but doesn't reach the LDP §3 ideal).

**Severity:** LOW. Equipment usage history is reconstructable from `rentals` + `audit_log`; the gap is consistency of inference logic across consumers, not data loss.

---

## P5 — Document state implicit in file presence

**LDP symptom:** A signed contract file in storage is the only signal that the contract is countersigned. No explicit document state.

**Search results:**

- ✅ `offer_letters.status offer_letter_status` enum (`draft, sent, viewed, accepted, declined, withdrawn, expired`) at [0001:4367](supabase/migrations/0001_remote_snapshot.sql:4367) — explicit document state. Activity log at `offer_letter_activity` [0001:4325](supabase/migrations/0001_remote_snapshot.sql:4325). Strong implementation.
- ⚠️ `proposals.status proposal_status` enum (`draft, sent, approved, rejected, expired, signed`) at [0001:456](supabase/migrations/0001_remote_snapshot.sql:456) — explicit but coarser. No SENT → VIEWED transition. View tracking would have to come from `proposal_share_links` access events, not the document itself.
- ⚠️ Proposal share-link views: presumably tracked via `proposal_events` at [0001:5103](supabase/migrations/0001_remote_snapshot.sql:5103) — but the proposal's own state machine doesn't surface the "viewed" event distinct from "sent."
- Signed-document file presence does NOT appear to be the sole signal anywhere (offer-letters and proposals both have explicit state).

**Verdict:** **NO STRICT P5** — but **proposals could be richer**. Severity LOW. Best-of-class: offer-letters; legacy: proposals.

---

## P6 — Mixing financial period state with project phase

**LDP symptom:** Financial reports keyed off project phase rather than period state. A "Q1 closed" status that depends on every Q1 project being in Wrap.

**Search results:**

- ❌ NO `financial_periods` table in any migration.
- ❌ NO `period_state` enum.
- ❌ Finance routes (`/console/finance/reports/page.tsx` per `scripts/routes.txt:105`, plus all sub-finance) cannot key off period state because no period state exists.
- Finance roll-ups (P&L, cash flow per `routes.txt:105`) appear to be computed projections from `expenses`, `invoices`, `time_entries`, `mileage_logs` filtered by date — no closed-period freeze.

**Verdict:** **STRICT P6 — confirmed.**

The Financial Period Lifecycle (LDP §7) is entirely absent. This is not "implemented incorrectly" — it is "not implemented." Reports cannot be locked, audited, or signed off; corrections cannot be tracked as reversing entries against a closed period. For a bookkeeping system, this is an architectural gap. For a creative-services SaaS that doesn't yet sell into accounting workflows, it may be acceptable. Severity contingent on product positioning.

**Severity:** ARCHITECTURAL. Out of scope for this run's auto-fix mode; logged.

---

## P7 — Subscription tracked as a series of Engagements

**LDP symptom:** A member's history is reconstructed by querying their Engagement records across projects. No standalone Subscription record.

**Search results:**

- ❌ NO `subscriptions` table in any migration.
- ❌ NO `subscription_state` enum.
- The `tier` enum (`portal, starter, professional, enterprise`) on `orgs.tier` at [0001:607](supabase/migrations/0001_remote_snapshot.sql:607) tracks the org's plan, not any per-Party recurring relationship.
- Stripe Connect/Stripe events (`stripe_events` at [0001:5935](supabase/migrations/0001_remote_snapshot.sql:5935)) flow in but no canonical Subscription record receives renewal/lapse/churn events.
- HVRBOR-style member relationships, retainer contracts, recurring sponsors — none of these are first-class.

**Verdict:** **STRICT P7 — confirmed.**

**Severity:** ARCHITECTURAL. Out of scope for this run's auto-fix mode; logged. Severity is contingent on whether HVRBOR-style membership is on the near-term product roadmap. If yes, this becomes BLOCKING. If no, defer.

---

## Summary

| Pattern                                    | Match?                                          | Severity      | Action                                                                                          |
| ------------------------------------------ | ----------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------- |
| P1 — single status mixing lifecycles       | Partial (`fabrication_orders.status`)           | MEDIUM        | Split into `production_phase`                                                                   |
| P2 — engagement state on Party             | Distributed (4 channel tables, no unified view) | MEDIUM        | Add `engagement_state` to `project_members`; reduce per-channel state to channel-specific gates |
| P3 — deliverable rolled up onto parent     | None found                                      | —             | ✅                                                                                              |
| P4 — asset state inferred from events      | Partial (column ✓, ledger ✗)                    | LOW           | Add `asset_movements` append-only ledger                                                        |
| P5 — document state implicit in file       | None strict; proposals could be richer          | LOW           | Adopt offer-letters pattern for proposals: SENT/VIEWED granularity                              |
| P6 — financial period coupled to project   | **Confirmed strict**                            | ARCHITECTURAL | Out of scope; logged                                                                            |
| P7 — subscription as series of engagements | **Confirmed strict**                            | ARCHITECTURAL | Out of scope; logged                                                                            |

**3 confirmed conflations · 2 partial · 2 cleared.**

Two of the three confirmed (P6, P7) are absences of entire lifecycles, not mis-implementations. They are flagged as architectural backlog items, not in-scope defects for this run.
