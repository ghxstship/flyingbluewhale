> **HISTORICAL — superseded 2026-05-09 by reports/LDP_LIFECYCLE_AUDIT_v2.md.**
> v1 audit was built against the stale 18.8k-line worktree snapshot which
> reflected only ~228 of the live database's 412 tables. v2 audit was built
> against direct SQL queries to the live remote DB and corrects multiple
> false-negative findings (notably USNP canon already implemented LDP §3, §5).

# LDP Lifecycle Audit

**Protocol:** Lifecycle Decomposition Protocol (LDP) — addendum to USNP
**Run:** Phase 0 of E2E-LRP, 2026-05-09
**Schema scope:** `supabase/migrations/0001_remote_snapshot.sql` (208 tables, 18,853 lines), `0002_marketplace_canon.sql` (11 tables), `0003_booking_canon.sql` (9 tables), 10 dated migrations 20260505*–20260508* (incremental)
**Method:** direct grep/read against migration files; no inferences from CLAUDE.md

For each of LDP's 8 canonical lifecycles: implementation status, schema citations, conformance verdict.

---

## 1. Project Lifecycle (8PP) — `project_phase`

**LDP canonical:** `DISCOVERY → CONCEPT → DEVELOP → ADVANCE → BUILD → SHOW → STRIKE → WRAP → ARCHIVED`
**LDP column:** `project_phase`

**What ships in code:**

- Enum: `xpms_phase` AS ENUM (`discovery`, `concept`, `development`, `advance`, `build`, `show`, `strike`, `wrap`) — at [0001_remote_snapshot.sql:709-718](supabase/migrations/0001_remote_snapshot.sql:709)
- Column: `projects.xpms_phase xpms_phase NOT NULL DEFAULT 'discovery'` at [0001:4444](supabase/migrations/0001_remote_snapshot.sql:4444)
- Sibling column: `projects.status project_status NOT NULL DEFAULT 'draft'` at [0001:4434](supabase/migrations/0001_remote_snapshot.sql:4434), enum values `(draft, active, paused, archived, complete)` at [0001:432-438](supabase/migrations/0001_remote_snapshot.sql:432)
- TS mirror: [src/lib/xpms/index.ts:115-127](src/lib/xpms/index.ts:115)

**Verdict:** **PARTIAL — name violation, no transition log, no ARCHIVED state.**

- ✅ Phase enum exists with all 8 LDP-canonical values (modulo `development` vs `develop` — single-token cosmetic gap).
- ⚠️ Column is named `xpms_phase`, not `project_phase` per LDP §1. Subsystem-prefix naming is fine in principle but inconsistent with LDP's discipline.
- ⚠️ No `ARCHIVED` value in the `xpms_phase` enum. Archive semantics live on `projects.status` (`archived` value) — split lifecycle representation.
- ❌ No `project_phase_transitions` (or equivalent) append-only log. Phase changes likely overwrite the column with no history beyond `audit_log` rows.
- ⚠️ `projects.status` (project_status enum) coexists with `xpms_phase`. Status is "is this project active vs paused vs archived" — operational lifecycle. Phase is "where in the event arc are we" — production lifecycle. **They are not strictly redundant**, but the dual existence is the kind of "two columns trying to be one machine" that LDP P1 warns about.

---

## 2. Production Lifecycle — `production_phase`

**LDP canonical:** `DISCOVERY → CONCEPT → ENGINEERING → PRE_PRO → FAB → LOGISTICS → INSTALL → STRIKE → ARCHIVED`
**LDP column:** `production_phase`

**What ships in code:**

- ❌ NO `production_phase` enum or column anywhere in any migration.
- Closest existing: `fabrication_orders.status text DEFAULT 'open' NOT NULL CHECK ('open', 'in_progress', 'blocked', 'complete')` at [0001:3541, 3546](supabase/migrations/0001_remote_snapshot.sql:3541)
- Production-adjacent tables present: `fabrication_orders` `:3534`, `equipment` `:3421`, `rentals`, `dispatch_runs` `:3325`, `daily_logs` `:3173`, `inspections` `:3946`, `punch_items`, `submittals`, `rfis`, `change_orders`, `payment_applications`, `venue_build_log` `:6605` — Olympic-/construction-grade tables.

**Verdict:** **NOT IMPLEMENTED.**

- ❌ The fab-shop 8-phase sequence in `feedback_8_phase_lifecycle.md` (Discovery → Concept → Engineering → Pre-Pro → Fab → Logistics → Install → Strike) has **zero schema representation**. It is a proposal-document convention only.
- ⚠️ `fabrication_orders.status` is 4 coarse states (open/in_progress/blocked/complete) — captures workflow execution, not phase semantics.
- ⚠️ `venue_build_log` is the closest thing to a production transition log but is venue-build-specific.
- The "Olympic" route surface under `/console/programs/`, `/console/venues/[venueId]/build/`, `/console/venues/[venueId]/handover/` implies production-phase tracking ought to exist; it doesn't.

---

## 3. Asset Lifecycle (UAL) — `asset_state`

**LDP canonical:** `ACQUIRED → AVAILABLE → RESERVED → IN_TRANSIT → IN_USE → RETURNED → IN_MAINTENANCE → AVAILABLE | RETIRED | LOST`
**LDP column:** `asset_state`

**What ships in code:**

- Enum: `equipment_status` AS ENUM (`available`, `reserved`, `in_use`, `maintenance`, `retired`) at [0001:196-201](supabase/migrations/0001_remote_snapshot.sql:196)
- Column: `equipment.status equipment_status NOT NULL DEFAULT 'available'` at [0001:3428](supabase/migrations/0001_remote_snapshot.sql:3428)
- Adjacent: `rentals` table (status TBD — not surfaced in this audit's grep), `asset_links` `:2716`, `maintenance_jobs` `:4189`, `maintenance_schedules` `:4213`

**Verdict:** **PARTIAL — wrong name, missing 4 states, no movement ledger.**

- ✅ Typed enum exists; not inferred from event presence (LDP P4 cleared).
- ⚠️ Column is `equipment.status`, not `equipment.asset_state`. Naming violation.
- ❌ Missing canonical states: `ACQUIRED`, `IN_TRANSIT`, `RETURNED`, `LOST`. The schema models a 5-state machine where LDP wants 9.
- ❌ No append-only `asset_movements` ledger (LDP §3 critical attribute). Reservations and returns must be reconstructed from `rentals` table activity + `audit_log`.

---

## 4. Deliverable Lifecycle — `deliverable_state`

**LDP canonical:** `BRIEFED → DRAFTED → IN_REVIEW → REVISION_REQUESTED → APPROVED → DELIVERED → ARCHIVED`
**LDP column:** `deliverable_state`

**What ships in code:**

- Enum: `deliverable_status` AS ENUM (`draft`, `submitted`, `in_review`, `approved`, `rejected`, `revision_requested`) at [0001:123-130](supabase/migrations/0001_remote_snapshot.sql:123)
- Column: `deliverables.status deliverable_status NOT NULL DEFAULT 'draft'` at [0001:3305](supabase/migrations/0001_remote_snapshot.sql:3305)
- Append-only: `deliverable_history` table at [0001:3264](supabase/migrations/0001_remote_snapshot.sql:3264)
- Comments side-table: `deliverable_comments` at [0001:3251](supabase/migrations/0001_remote_snapshot.sql:3251)
- 16 typed deliverable types via `deliverable_type` enum [0001:136-156](supabase/migrations/0001_remote_snapshot.sql:136)

**Verdict:** **STRONG — wrong name, near-canonical state set, transition log present.**

- ✅ Append-only `deliverable_history` table is the LDP-canonical pattern.
- ✅ Typed enum, not free text.
- ⚠️ Column is `status`, not `state`. Naming violation.
- ⚠️ Missing `BRIEFED` (pre-draft state — kicked off but not started). Missing `DELIVERED` (post-approval ship event distinct from APPROVED). Has `rejected` which isn't in LDP — fine, additive.
- ✅ `deliverable_type` enum (16 values) gives discipline-leadership routing per LDP §4 ("discipline lead per deliverable type").

---

## 5. Engagement Lifecycle (UIS Role) — `engagement_state`

**LDP canonical:** `DISCOVERED → INTERESTED → VETTED → COMMITTED → ENABLED → CONFIRMED → ACTIVE → CLOSED → ARCHIVED`
**LDP column:** `engagement_state` per Party × Project (NOT `role_status` on Party)

**What ships in code:**

- ❌ NO `engagement_state` column anywhere.
- ❌ NO `roles` or `engagements` table per Party × Project unifying engagement state.
- Per-Party-globally: `memberships` at [0001:4272](supabase/migrations/0001_remote_snapshot.sql:4272) (org-level role).
- Per-Party-per-Project: `project_members` at [0001:4981](supabase/migrations/0001_remote_snapshot.sql:4981) (referenced by RLS helpers `private.has_project_role(project_id, required[])` `:870` and `private.is_project_member(project_id)` `:925`). Has `role` column but no `engagement_state`.
- Per-channel partial implementations of engagement state:
  - `talent_offers.status talent_offer_status` (draft/sent/countered/accepted/contracted/declined/cancelled) at [0002:364](supabase/migrations/0002_marketplace_canon.sql:364)
  - `job_applications.status job_application_status` (new/reviewed/phone/booked/hold/pass/withdrawn) at [0002:464](supabase/migrations/0002_marketplace_canon.sql:464)
  - `open_call_submissions.status submission_status` (submitted/shortlisted/rejected/awarded/withdrawn) at [0002:313](supabase/migrations/0002_marketplace_canon.sql:313)
  - `invites.status text` (pending/accepted/revoked) at [0001:4013](supabase/migrations/0001_remote_snapshot.sql:4013)

**Verdict:** **DISTRIBUTED / CONFLATED — LDP P2 hit.**

- ❌ No unified per-Party-per-Project engagement state machine. The conceptual single Engagement Lifecycle is split across 4+ tables, each with its own enum.
- ⚠️ This split is not strictly "engagement state on the Party record" (the strict LDP P2 anti-pattern) — the marketplace tables ARE per-Party-per-Project. But there's no canonical "this Party is now ENABLED on this Project" view across all channels.
- ✅ `project_members` table exists and is the natural home for a future `engagement_state` column.

---

## 6. Engagement-Document Lifecycle — `document_state`

**LDP canonical:** `DRAFTED → SENT → VIEWED → SIGNED → COUNTERSIGNED → ACTIVE → EXPIRED | SUPERSEDED | VOIDED → ARCHIVED`
**LDP column:** `document_state`

**What ships in code:**

- Enum: `offer_letter_status` AS ENUM (`draft`, `sent`, `viewed`, `accepted`, `declined`, `withdrawn`, `expired`) at [0001:375-385](supabase/migrations/0001_remote_snapshot.sql:375)
- Column: `offer_letters.status offer_letter_status NOT NULL DEFAULT 'draft'` at [0001:4367](supabase/migrations/0001_remote_snapshot.sql:4367)
- Activity log: `offer_letter_activity` at [0001:4325](supabase/migrations/0001_remote_snapshot.sql:4325)
- Org-level config: `org_offer_letter_settings` at [0001:4390](supabase/migrations/0001_remote_snapshot.sql:4390)
- Contract-tier sibling: `proposals.status proposal_status` AS ENUM (`draft`, `sent`, `approved`, `rejected`, `expired`, `signed`) at [0001:456-468](supabase/migrations/0001_remote_snapshot.sql:456) — coarser machine for the proposal document.
- Activity log for proposals: `proposal_activity` at [0001:5038](supabase/migrations/0001_remote_snapshot.sql:5038), `proposal_events` at [0001:5103](supabase/migrations/0001_remote_snapshot.sql:5103)

**Verdict:** **STRONG (offer_letters) — wrong name, missing COUNTERSIGNED + ACTIVE + SUPERSEDED + VOIDED states; PARTIAL (proposals) — coarser.**

- ✅ Offer-letter implementation is the closest to canonical LDP §6 — granular SENT → VIEWED state, activity log, org-level template config.
- ⚠️ Naming: `status`, not `document_state`.
- ❌ Missing distinction between SIGNED (counterparty signed) and COUNTERSIGNED (org countersigned). `accepted` collapses both. Missing ACTIVE (in-force lifecycle), SUPERSEDED (replaced by newer doc), VOIDED (cancelled before completion).
- ⚠️ Proposal status only has 6 values, no SENT → VIEWED granularity, no countersignature distinction.

---

## 7. Financial Period Lifecycle (ULG) — `period_state`

**LDP canonical:** `OPEN → IN_PERIOD → CLOSING → CLOSED → AUDITED → ARCHIVED`
**LDP column:** `period_state`

**What ships in code:**

- ❌ NO `financial_periods` table anywhere in any migration.
- ❌ NO `period_state` enum.
- Operational finance: `expenses` `:3489`, `budgets` `:2842`, `time_entries` `:3664`, `mileage_logs` `:3621`, `invoices` `:4051`, `cost_codes` `:2975`, `usage_events` `:6155`, `payment_applications` `:4802`.

**Verdict:** **NOT IMPLEMENTED — LDP P6 confirmed.**

- ❌ No accounting-period state machine. Closing/AUDIT semantics are not represented.
- ❌ Reports under `/console/finance/reports/` (per `scripts/routes.txt:105`) cannot key off period state because no period state exists.
- The operational finance tables are present, but the calendar-month/quarterly close cycle is absent. Finance roll-ups are at-best computed projections, never frozen.

---

## 8. Subscription Lifecycle — `subscription_state`

**LDP canonical:** `PROSPECT → TRIAL → ACTIVE → RENEWED → LAPSED → REACTIVATED | CHURNED → ARCHIVED`
**LDP column:** `subscription_state`

**What ships in code:**

- ❌ NO `subscriptions` table.
- ❌ NO `subscription_state` enum.
- ❌ NO membership-as-recurring tracking. `memberships` table is identity-tenancy (org membership), not Subscription Lifecycle.
- Adjacent: `tier` enum (`portal`, `starter`, `professional`, `enterprise`) on `orgs` at [0001:607-619](supabase/migrations/0001_remote_snapshot.sql:607) — tracks plan, not lifecycle.
- Stripe Connect is wired via `stripe.ts` and `stripe_events` `:5935` but no canonical Subscription record receives renewal/lapse/churn events.

**Verdict:** **NOT IMPLEMENTED — LDP P7 confirmed.**

- ❌ HVRBOR-style member / retainer / recurring-sponsor lifecycle entirely absent at schema level.
- The marketing pricing tier is on the org record (`orgs.tier`), but lifecycle transitions (TRIAL, RENEWED, LAPSED, CHURNED) are not modelled.

---

## Summary table

| #   | Lifecycle           | LDP column           | Schema impl                                   | Naming | Transition log             | States    | Verdict                                      |
| --- | ------------------- | -------------------- | --------------------------------------------- | ------ | -------------------------- | --------- | -------------------------------------------- |
| 1   | Project             | `project_phase`      | `xpms_phase`                                  | ⚠️     | ❌                         | ✅ 8/8    | PARTIAL                                      |
| 2   | Production          | `production_phase`   | —                                             | ❌     | ⚠️ (`venue_build_log`)     | ❌ 0/9    | NOT IMPLEMENTED                              |
| 3   | Asset               | `asset_state`        | `equipment.status`                            | ⚠️     | ❌                         | ⚠️ 5/9    | PARTIAL                                      |
| 4   | Deliverable         | `deliverable_state`  | `deliverables.status`                         | ⚠️     | ✅ `deliverable_history`   | ⚠️ 6/7    | STRONG                                       |
| 5   | Engagement          | `engagement_state`   | distributed across 4 tables                   | ❌     | ⚠️ per-table               | ⚠️ varies | DISTRIBUTED (P2 risk)                        |
| 6   | Engagement-Document | `document_state`     | `offer_letters.status` (+ `proposals.status`) | ⚠️     | ✅ `offer_letter_activity` | ⚠️ 7/11   | STRONG (offer_letters) / PARTIAL (proposals) |
| 7   | Financial Period    | `period_state`       | —                                             | —      | —                          | ❌ 0/6    | NOT IMPLEMENTED (P6)                         |
| 8   | Subscription        | `subscription_state` | —                                             | —      | —                          | ❌ 0/8    | NOT IMPLEMENTED (P7)                         |

**Score:** 0 fully-conformant lifecycles · 2 STRONG · 2 PARTIAL · 1 DISTRIBUTED · 3 NOT IMPLEMENTED.
