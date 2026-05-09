> **HISTORICAL — superseded 2026-05-09 by reports/LDP_SCHEMA_CONFORMANCE_REPORT_v2.md.**
> v1 audit was built against the stale 18.8k-line worktree snapshot which
> reflected only ~228 of the live database's 412 tables. v2 audit was built
> against direct SQL queries to the live remote DB and corrects multiple
> false-negative findings (notably USNP canon already implemented LDP §3, §5).

# LDP Schema Conformance Report

**Protocol:** Lifecycle Decomposition Protocol (LDP)
**Run:** Phase 0 of E2E-LRP, 2026-05-09

**Pass criterion per lifecycle per consuming module:** the module owns a state column matching LDP's canonical name + enum + transition log. PASS = all three. PARTIAL = some-of-three. FAIL = none-of-three or wrong direction.

---

## Conformance matrix — lifecycle × consuming module

| Lifecycle                  | Consuming module                    | Schema column                                  | Enum                                                                                        | Transition log                                      | Verdict                                                                |
| -------------------------- | ----------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------- |
| **§1 Project**             | `projects`                          | `xpms_phase` (should be `project_phase`)       | `xpms_phase` (8 values, missing ARCHIVED)                                                   | ❌ no `project_phase_transitions`; `audit_log` only | **PARTIAL**                                                            |
| **§1 Project**             | `xpms_atoms` (per-atom phase reuse) | `phase`                                        | `xpms_phase` (reused)                                                                       | ❌                                                  | **PARTIAL** (LDP-violates "each lifecycle has its own enum" via reuse) |
| **§2 Production**          | `fabrication_orders`                | ❌ none (`status` text/CHECK)                  | ❌ no production_phase enum                                                                 | ⚠️ `venue_build_log` covers venue-build slice only  | **FAIL**                                                               |
| **§2 Production**          | `venues.handover_state`             | `handover_state` (sub-lifecycle of production) | `handover_state` enum                                                                       | ❌                                                  | PARTIAL (sub-state correctly named; parent production_phase missing)   |
| **§3 Asset**               | `equipment`                         | `status` (should be `asset_state`)             | `equipment_status` enum (5 values, missing 4)                                               | ❌ no `asset_movements`                             | **PARTIAL**                                                            |
| **§3 Asset**               | `rentals`                           | (status — not surfaced in this audit)          | TBD                                                                                         | ❌                                                  | TBD                                                                    |
| **§4 Deliverable**         | `deliverables`                      | `status` (should be `deliverable_state`)       | `deliverable_status` enum (6 values, missing BRIEFED + DELIVERED)                           | ✅ `deliverable_history`                            | **PARTIAL** (transition log present is a clear win)                    |
| **§5 Engagement**          | `project_members`                   | ❌ no `engagement_state` column                | —                                                                                           | ❌                                                  | **FAIL**                                                               |
| **§5 Engagement**          | `talent_offers` (channel)           | `status`                                       | `talent_offer_status` enum                                                                  | ❌                                                  | PARTIAL (per-channel only; not unified)                                |
| **§5 Engagement**          | `job_applications` (channel)        | `status`                                       | `job_application_status` enum                                                               | ❌                                                  | PARTIAL (per-channel only)                                             |
| **§5 Engagement**          | `open_call_submissions` (channel)   | `status`                                       | `submission_status` enum                                                                    | ❌                                                  | PARTIAL (per-channel only)                                             |
| **§5 Engagement**          | `invites`                           | `status` (text)                                | ❌ untyped + CHECK                                                                          | ❌                                                  | **FAIL** (untyped)                                                     |
| **§6 Engagement-Document** | `offer_letters`                     | `status` (should be `document_state`)          | `offer_letter_status` enum (7 values, missing 4: COUNTERSIGNED, ACTIVE, SUPERSEDED, VOIDED) | ✅ `offer_letter_activity`                          | **PARTIAL** (strongest implementation in the schema)                   |
| **§6 Engagement-Document** | `proposals`                         | `status` (should be `document_state`)          | `proposal_status` enum (6 values, missing SENT→VIEWED granularity)                          | ✅ `proposal_activity` + `proposal_events`          | **PARTIAL**                                                            |
| **§7 Financial Period**    | `financial_periods` (would-be)      | ❌ table absent                                | ❌                                                                                          | ❌                                                  | **FAIL — not implemented**                                             |
| **§8 Subscription**        | `subscriptions` (would-be)          | ❌ table absent                                | ❌                                                                                          | ❌                                                  | **FAIL — not implemented**                                             |

---

## Per-lifecycle scorecard

| Lifecycle              | Total consumer modules audited | PASS  | PARTIAL | FAIL          | Verdict                                                             |
| ---------------------- | ------------------------------ | ----- | ------- | ------------- | ------------------------------------------------------------------- |
| §1 Project             | 2                              | 0     | 2       | 0             | PARTIAL                                                             |
| §2 Production          | 2                              | 0     | 1       | 1             | FAIL                                                                |
| §3 Asset               | 2                              | 0     | 1       | 0 (1 TBD)     | PARTIAL                                                             |
| §4 Deliverable         | 1                              | 0     | 1       | 0             | PARTIAL (closest to PASS — only naming + 2 missing states blocking) |
| §5 Engagement          | 5                              | 0     | 3       | 2             | FAIL                                                                |
| §6 Engagement-Document | 2                              | 0     | 2       | 0             | PARTIAL                                                             |
| §7 Financial Period    | 1                              | 0     | 0       | 1             | FAIL                                                                |
| §8 Subscription        | 1                              | 0     | 0       | 1             | FAIL                                                                |
| **Totals**             | **16**                         | **0** | **10**  | **5 + 1 TBD** | —                                                                   |

**Overall:** 0/16 PASS · 10/16 PARTIAL · 5/16 FAIL · 1/16 TBD.

**Highest-conformance lifecycle:** §4 Deliverable — only blockers are name (status→state) and 2 missing enum values. Closest to a one-PR fix.

**Lowest-conformance lifecycles:** §7 Financial Period and §8 Subscription — not implemented at all. Architectural decision required before any remediation.

---

## Pass criteria for future re-audit

A lifecycle achieves PASS when **all** of:

1. **Column name** matches LDP-canonical (`project_phase` / `production_phase` / `asset_state` / `deliverable_state` / `engagement_state` / `document_state` / `period_state` / `subscription_state`).
2. **Enum type** has its own dedicated `CREATE TYPE` (not reused across tables) and includes all canonical states from LDP §1–§8 (additive states allowed).
3. **Transition log table** exists and is append-only (`*_transitions` or `*_history`), with from-state, to-state, transitioned-by, transitioned-at, optional reason and correlation_id columns.
4. **No competing column** on the same record carrying overlapping lifecycle semantics (no `projects.status` AND `projects.project_phase` both modelling the same arc).
5. **Owning subsystem SDK** is the only writer of the state column (cross-subsystem changes route through the SDK, not direct UPDATEs).

Today, **0 of 16 audited consumer-modules** meet all 5 criteria.

---

## Migration block notice

Per E2E-LRP §PHASE 5 §"Always-deferred categories" and LDP §STOP CONDITIONS, every remediation in this report is **out of scope for in-loop fixes during this run**. They are documented in `LDP_REMEDIATION_PLAN.md` for separate PR review. No schema change is applied during this E2E-LRP execution.
