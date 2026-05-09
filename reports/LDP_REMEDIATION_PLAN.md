# LDP Remediation Plan

**Protocol:** Lifecycle Decomposition Protocol (LDP)
**Run:** Phase 0 of E2E-LRP, 2026-05-09
**Mode:** HYBRID per user direction in turn 3 — but ALL LDP-class fixes are schema migrations, which E2E-LRP §PHASE 5 §"Always-deferred categories" classifies as **always logged, never auto-fixed regardless of mode**.

> **None of the items in this plan will be applied during this run.** They are logged for separate PR review and prioritisation. Schema migrations require explicit approval per both protocols.

---

## Severity scale

- **S1 CRITICAL** — data loss / audit gap / financial miscalculation risk. None found.
- **S2 MAJOR** — core lifecycle blocked, composition contract violation, missing required document. P6 (financial periods) and P7 (subscriptions) qualify but only if those lifecycles are roadmap-current.
- **S3 FUNCTIONAL** — non-blocking incorrect behavior, naming violation, missing intermediate state. The bulk of this list.
- **S4 COSMETIC** — name-only with semantically-correct enum. The renames.

---

## Always-deferred per E2E-LRP §PHASE 5

The protocol disallows in-loop application of: **schema migrations · RLS policy changes · authentication/session logic · financial calculation logic · cryptography/secrets · audit-log integrity**.

Every item below is a schema migration. Every item is deferred.

---

## R-LDP-1 — Add `production_phase` enum + column (LDP §2)

**Severity:** S2 MAJOR if Production Lifecycle is roadmap-current; S3 FUNCTIONAL otherwise.
**Scope:** architectural.
**Pattern:** none of P1-P7 strict; absence-of-lifecycle.

**Proposed change:**

1. Decision needed: which Production Lifecycle sequence is canonical for this codebase?
   - **Option A** — LDP §2 sequence: `DISCOVERY → CONCEPT → ENGINEERING → PRE_PRO → FAB → LOGISTICS → INSTALL → STRIKE → ARCHIVED`
   - **Option B** — Repo memory `feedback_8_phase_lifecycle.md` (same as Option A in different casing)
   - **Option C** — Per the user's note in turn 3: "both should exist, with the fab one as a domain variant" — if so, then `production_phase` for general-purpose production and `fab_phase` for fabrication-shop sub-domain.
2. Once decided: `CREATE TYPE production_phase AS ENUM (...);`
3. Add `fabrication_orders.production_phase production_phase` column.
4. Add `production_phase_transitions` append-only log table (per LDP §1 transition pattern).
5. Migrate `fabrication_orders.status` values into the new column where mappable; drop `status` after data migration.
6. Update `src/lib/db/`, `src/components/production/*`, server actions to read/write the new column.

**Risk:** medium. `fabrication_orders` is a real table with extant rows in the demo seed; migration must preserve data. RLS policies on `fabrication_orders` must be re-applied to the new column.

**Effort estimate:** 1–2 weeks if Option C (most flexible); 3–5 days if Option A.

---

## R-LDP-2 — Rename status→state and add transition logs (LDP naming discipline)

**Severity:** S3 FUNCTIONAL (semantically OK columns) and S2 MAJOR (untyped status text columns).
**Scope:** local per table; cumulatively shared.
**Pattern:** LDP §NAMING DISCIPLINE.

**Approach:** **batch by lifecycle ownership**, not by table count. Two passes:

**Pass A — typed-enum status columns (S4 cosmetic-name-only):**

| Table                                                                   | Old                   | New                            | Enum rename         | Notes                                    |
| ----------------------------------------------------------------------- | --------------------- | ------------------------------ | ------------------- | ---------------------------------------- |
| `deliverables.status`                                                   | `deliverable_status`  | `deliverables.state`           | `deliverable_state` | LDP §4                                   |
| `equipment.status`                                                      | `equipment_status`    | `equipment.asset_state`        | `asset_state`       | LDP §3; also expand enum to 9 values     |
| `offer_letters.status`                                                  | `offer_letter_status` | `offer_letters.document_state` | `document_state`    | LDP §6; also expand enum                 |
| `events.status`                                                         | `event_status`        | `events.event_state`           | `event_state`       | non-canonical lifecycle, LDP-naming only |
| ... all other typed-enum status columns from `LDP_NAMING_AUDIT.md §C.1` |                       |                                |                     |                                          |

**Pass B — untyped-text status columns (S2 type + S3 name):**

For each row in `LDP_NAMING_AUDIT.md §C.2`:

1. Promote text+CHECK to a typed enum.
2. Rename column `status` → `*_state` (or `*_phase` if it's a phase machine — currently none of these are).
3. Add transition log table where the lifecycle is non-trivial (e.g., `itil_changes`, `payment_applications`).

**Risk:** LOW per table; HIGH cumulatively. ~50 column renames touching the entire codebase. Best executed as one "naming reconciliation" PR after `R-LDP-1` lands.

**Effort estimate:** 2–3 weeks for Pass A + B if done as one batch; longer if incremental.

---

## R-LDP-3 — Add `engagement_state` column to `project_members` (LDP §5, P2)

**Severity:** S3 FUNCTIONAL (currently distributed; not broken, just not unified).
**Scope:** shared.
**Pattern:** LDP P2.

**Proposed change:**

1. `CREATE TYPE engagement_state AS ENUM ('DISCOVERED','INTERESTED','VETTED','COMMITTED','ENABLED','CONFIRMED','ACTIVE','CLOSED','ARCHIVED');`
2. `ALTER TABLE project_members ADD COLUMN engagement_state engagement_state NOT NULL DEFAULT 'COMMITTED';` (default is the implicit current state — record-exists = COMMITTED).
3. Add `engagement_state_transitions` append-only log.
4. Build a view `engagement_unified_view` that JOINs `project_members.engagement_state` with the per-channel `talent_offers.status`, `job_applications.status`, `open_call_submissions.status`, `invites.status` — surfacing one row per Party × Project × Channel.
5. Document that the per-channel status columns remain authoritative for channel-specific gates (e.g., a job application's `phone` state has no equivalent in `engagement_state`); `engagement_state` is the cross-channel summary.

**Risk:** LOW. `project_members` has a small surface area. The view does the heavy lifting.

**Effort estimate:** 3–5 days.

---

## R-LDP-4 — Asset movements append-only ledger (LDP §3, P4 partial)

**Severity:** S3 FUNCTIONAL.
**Scope:** local.
**Pattern:** LDP P4.

**Proposed change:**

1. `CREATE TABLE asset_movements (movement_id ulid PK, equipment_id uuid REFERENCES equipment, from_state asset_state, to_state asset_state NOT NULL, moved_at timestamptz NOT NULL DEFAULT now(), moved_by uuid, project_id uuid, rental_id uuid, reason text, correlation_id ulid);`
2. Trigger on `equipment.asset_state` UPDATE to insert a movement row.
3. Backfill from `audit_log` rows where `entity_table='equipment' AND old_value->>'status' != new_value->>'status'`.

**Risk:** LOW. Pure addition.

**Effort estimate:** 2 days.

---

## R-LDP-5 — Expand asset_state and document_state enums (LDP §3 §6)

**Severity:** S3 FUNCTIONAL.
**Scope:** local.

**Proposed change:**

- `asset_state`: add `ACQUIRED`, `IN_TRANSIT`, `RETURNED`, `LOST`. Existing values stay.
- `document_state`: add `COUNTERSIGNED` (split from `accepted`), `ACTIVE`, `SUPERSEDED`, `VOIDED`. Existing values stay.
- Decide migration: re-classify existing `accepted` rows as `COUNTERSIGNED` if org countersigned, `SIGNED` if only counterparty signed.

**Risk:** LOW per enum; migration logic for `accepted → COUNTERSIGNED|SIGNED` requires reading historical activity.

**Effort estimate:** 3 days.

---

## R-LDP-6 — Promote untyped status columns to typed enums

**Severity:** S2 MAJOR for the columns missing CHECK constraints; S3 FUNCTIONAL for those with CHECK.

**Approach:** for each untyped-text status column (~25+ from `LDP_NAMING_AUDIT.md §C.2`):

1. Inventory current distinct values in production data (out of scope for this Phase 0 run — would need DB read).
2. Define `<table>_state` enum from observed values.
3. Migrate column type.
4. Add transition log if not present.
5. Remove the CHECK constraint (replaced by enum's inherent constraint).

**Risk:** MEDIUM. ~25 tables × non-trivial migration each. Some have RLS policies that reference the status text values (e.g., `invites_select_consolidated` at [0001:15184](supabase/migrations/0001_remote_snapshot.sql:15184)) and must be re-cast to the new enum.

**Effort estimate:** 3–5 weeks if done sequentially; 1–2 weeks if batched.

---

## R-LDP-7 — Resolve `proposal_phase_status` hybrid name (LDP §NAMING DISCIPLINE)

**Severity:** S4 COSMETIC.

**Proposed change:** rename `proposal_phase_status` enum to `proposal_phase_state`. The values (`locked, active, in_review, approved, complete`) read like state, not phase, despite the name. The "phase" component refers to the line-item-phase concept; the column tracks whether that phase is locked/active/etc. Misnaming.

**Risk:** TRIVIAL.

**Effort estimate:** 0.5 day.

---

## R-LDP-8 — Financial Period Lifecycle (LDP §7, P6) — DEFERRED

**Severity:** ARCHITECTURAL. **DECISION NEEDED before scoping.**

If finance reporting is going to claim period-close semantics:

- Add `financial_periods` table (period_id, org_id, period_kind, period_start, period_end, period_state period_state, opened_at, closed_at, audited_at).
- Add `period_state` enum (OPEN/IN_PERIOD/CLOSING/CLOSED/AUDITED/ARCHIVED).
- Migrate `expenses`, `invoices`, `payment_applications`, `time_entries`, `mileage_logs` to reference `period_id` (or compute from `entry_date`).
- Wire close workflow into `/console/finance/reports/page.tsx`.

If finance is positioned as operational tracking only (not bookkeeping), defer indefinitely.

---

## R-LDP-9 — Subscription Lifecycle (LDP §8, P7) — DEFERRED

**Severity:** ARCHITECTURAL. **DECISION NEEDED before scoping.**

If HVRBOR-style member / retainer / recurring-sponsor relationships are roadmap-current:

- Add `subscriptions` table (subscription_id, org_id, party_id, subscription_kind, started_at, renewed_at, lapsed_at, churned_at, subscription_state subscription_state).
- Add `subscription_state` enum.
- Add `subscription_renewals` append-only log.
- Wire renewal events from Stripe webhook into Subscription state advancement.

If membership-as-recurring is not on roadmap, defer.

---

## R-LDP-10 — Establish schema-review checklist enforcement

**Severity:** S3 PROCESS.

**Proposed change:** add a CI job (or a CLAUDE.md / CONTRIBUTING note) that fails any new migration introducing a column named `status` on a core entity without an explicit `SCHEMA-REVIEW-EXEMPT: <reason>` comment in the migration. Cite this LDP audit as the precedent.

**Effort estimate:** 1 day.

---

## Sequencing recommendation

**Wave 1 (highest leverage, low risk):**

1. R-LDP-10 — process gate FIRST (otherwise the audit is a snapshot that decays)
2. R-LDP-7 — proposal_phase_status rename (0.5 day)
3. R-LDP-4 — asset_movements ledger (2 days)
4. R-LDP-3 — engagement_state on project_members (3–5 days)
5. R-LDP-5 — expand asset_state + document_state enums (3 days)

**Wave 2 (medium effort, higher value):** 6. R-LDP-1 — production_phase decision + implementation (1–2 weeks) 7. R-LDP-2 Pass A — typed-enum status renames (1 week)

**Wave 3 (large surface, batch carefully):** 8. R-LDP-2 Pass B + R-LDP-6 — untyped status promotion to typed state enums (2–4 weeks)

**Wave 4 (architectural, decision-gated):** 9. R-LDP-8 — Financial Period Lifecycle (only if roadmap-current) 10. R-LDP-9 — Subscription Lifecycle (only if roadmap-current)

**Total estimated effort:** Waves 1–3 = ~6–8 weeks. Wave 4 = +4–6 weeks if both done.

**Total decisions needed from a human before execution:**

- R-LDP-1 Option A vs B vs C (Production Lifecycle sequence)
- R-LDP-8 yes/no (Financial Period Lifecycle on roadmap?)
- R-LDP-9 yes/no (Subscription Lifecycle on roadmap?)
