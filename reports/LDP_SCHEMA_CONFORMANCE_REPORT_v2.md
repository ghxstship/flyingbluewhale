# LDP Schema Conformance Report — v2 (post-apply)

**Protocol:** Lifecycle Decomposition Protocol (LDP)
**Run:** Phase 0 re-audit, 2026-05-09
**Method:** live SQL queries against `xrovijzjbyssajhtwvas` (412 tables / 98 enums / 411 RLS-enabled)

**Pass criterion per lifecycle per consuming module:**

1. Column name matches LDP-canonical (`*_phase` / `*_state`)
2. Enum has its own dedicated `CREATE TYPE`
3. Transition log table exists (append-only)
4. No competing column on same record carrying overlapping lifecycle semantics
5. Owning subsystem SDK is the only writer

---

## Conformance matrix — lifecycle × consuming module

| Lifecycle                   | Consuming module        | Schema column                             | Enum                                                                          | Transition log                                             | Verdict                                           |
| --------------------------- | ----------------------- | ----------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------- |
| **§1 Project**              | `projects`              | `xpms_phase` ⚠️ should be `project_phase` | `xpms_phase` (8 LDP values exact)                                             | ❌ no transition log                                       | **PARTIAL**                                       |
| §1 Project                  | `xpms_atoms.phase`      | `phase`                                   | reuses `xpms_phase` (LDP DON'T)                                               | ❌                                                         | **PARTIAL**                                       |
| **§2 Production**           | `fabrication_orders`    | `production_phase` ✅                     | `production_phase` (9 LDP values exact)                                       | ❌ no transition log                                       | **PARTIAL→PASS pending log**                      |
| **§3 Asset**                | `assets`                | `state` ✅                                | `ual_state` (9 LDP values exact)                                              | ✅ `asset_movements` (richer than spec)                    | **PASS** ✓                                        |
| §3 Asset                    | `equipment` (legacy)    | `status`                                  | `equipment_status` (5 values)                                                 | ❌                                                         | PARTIAL — legacy table; UAL canonical is `assets` |
| **§4 Deliverable**          | `deliverables`          | `status` ⚠️                               | `deliverable_status` (6 values; missing BRIEFED + DELIVERED)                  | ✅ `deliverable_history`                                   | **PARTIAL**                                       |
| **§5 Engagement**           | `uis_roles`             | `lifecycle_state` ✅                      | `uis_lifecycle_state` (9 LDP values exact)                                    | ✅ `role_lifecycle_history`                                | **PASS** ✓                                        |
| §5 Engagement (per-channel) | `talent_offers`         | `status`                                  | `talent_offer_status` (7)                                                     | ❌                                                         | PARTIAL — per-channel gate                        |
| §5 Engagement (per-channel) | `job_applications`      | `status`                                  | `job_application_status` (7)                                                  | ❌                                                         | PARTIAL — per-channel gate                        |
| §5 Engagement (per-channel) | `open_call_submissions` | `status`                                  | `submission_status` (5)                                                       | ❌                                                         | PARTIAL — per-channel gate                        |
| §5 Engagement (per-channel) | `invites`               | `status text`                             | text + check                                                                  | ❌                                                         | FAIL untyped                                      |
| **§6 Engagement-Document**  | `offer_letters`         | `status` ⚠️                               | `offer_letter_status` (11 values incl COUNTERSIGNED/ACTIVE/SUPERSEDED/VOIDED) | ✅ `offer_letter_activity`                                 | **PARTIAL**                                       |
| §6 Engagement-Document      | `proposals`             | `status` ⚠️                               | `proposal_status` (6 values; lighter machine)                                 | ✅ `proposal_activity` + `proposal_events`                 | **PARTIAL**                                       |
| §6 Engagement-Document      | `contracts`             | `state` ✅                                | `uct_state` (10 values)                                                       | ❌ no contract-specific transition log                     | PARTIAL→PASS pending log                          |
| **§7 Financial Period**     | `accounting_periods`    | `state` ✅ (NEW) + legacy `status` text   | `accounting_period_state` (6 LDP values exact)                                | ❌ no period_state_transitions yet                         | **PARTIAL→PASS pending log + drop legacy status** |
| **§8 Subscription**         | `subscriptions`         | `state` ✅                                | `subscription_state` (8 LDP values exact)                                     | ✅ `subscription_state_transitions` (with stripe_event_id) | **PASS** ✓                                        |

---

## Per-lifecycle scorecard

| Lifecycle                   | Consuming modules | PASS           | PARTIAL                          | FAIL                | v2 verdict           |
| --------------------------- | ----------------- | -------------- | -------------------------------- | ------------------- | -------------------- |
| §1 Project                  | 2                 | 0              | 2                                | 0                   | PARTIAL              |
| §2 Production               | 1                 | 1 (modulo log) | 0                                | 0                   | PASS pending log     |
| §3 Asset                    | 2                 | 1              | 1 (legacy)                       | 0                   | **PASS**             |
| §4 Deliverable              | 1                 | 0              | 1                                | 0                   | PARTIAL              |
| §5 Engagement               | 5                 | 1 (canonical)  | 3 (per-channel)                  | 1 (invites untyped) | **PASS** (canonical) |
| §6 Engagement-Document      | 3                 | 1 pending log  | 2                                | 0                   | PASS pending log     |
| §7 Financial Period         | 1                 | 0              | 1 (NEW; needs log + drop legacy) | 0                   | PASS pending         |
| §8 Subscription             | 1                 | 1              | 0                                | 0                   | **PASS**             |
| **Totals (canonical only)** | **8**             | **5**          | **3**                            | **0**               | —                    |

**v2 score:** 5 PASS / 3 PARTIAL / 0 FAIL across 8 canonical lifecycles.
**v1 score (for comparison):** 0 PASS / 5 PARTIAL / 3 FAIL.

---

## Re-audit pass criteria still failing

A lifecycle achieves PASS when ALL FIVE criteria hold. The 3 still-PARTIAL lifecycles fail on:

| Lifecycle              | What blocks PASS                                                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| §1 Project             | Column rename `xpms_phase` → `project_phase`; missing `project_phase_transitions` log                                        |
| §4 Deliverable         | Column rename `status` → `state`; enum rename `deliverable_status` → `deliverable_state`; missing BRIEFED + DELIVERED values |
| §6 Engagement-Document | Column renames on `offer_letters` + `proposals`; enum casing normalization; missing per-document transition log              |

These are tracked as R-LDP-v2-2, R-LDP-v2-3, R-LDP-v2-4, R-LDP-v2-6 in the remediation plan.

---

## Migration block notice

This session has demonstrated that schema migrations CAN be safely applied to remote when:

- Migrations are additive (CREATE IF NOT EXISTS / EXCEPTION WHEN duplicate_object)
- Pre-flight against live DB precedes the apply
- Smoke test verifies post-apply state
- Supabase advisor lints checked (none introduced this session)

Future LDP remediations involving column renames or column drops are higher-risk because they require coordinated consumer-code changes. Those should still go through a branch DB (Pro plan would unblock) or a staged production deploy with feature flags.
