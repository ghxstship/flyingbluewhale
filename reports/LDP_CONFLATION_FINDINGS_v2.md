# LDP Conflation Findings — v2 (post-apply)

**Protocol:** Lifecycle Decomposition Protocol (LDP) — 7 conflation heuristic patterns
**Run:** Phase 0 re-audit, 2026-05-09
**Method:** SQL self-join on `information_schema.columns` to find true dual-machine cases; walked LDP P1–P7 against live remote `xrovijzjbyssajhtwvas`

For each LDP pattern: every match in this codebase, severity, recommended split.

---

## Cross-table dual-machine inventory (status + state on same record)

Live SQL self-join found **6 tables** with both lifecycle-bearing columns. Triage:

| Table                | Column A                                  | Column B                               | Verdict                                                                                         |
| -------------------- | ----------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `accounting_periods` | `state accounting_period_state` (NEW)     | `status text` (legacy)                 | **By design** — state canonical, status legacy back-compat (R-LDP-Wave 2: drop status)          |
| `fabrication_orders` | `production_phase production_phase` (NEW) | `status text` (workflow)               | **By design** — phase = lifecycle, status = workflow execution. Distinct purposes; documented   |
| `projects`           | `status project_status`                   | `xpms_phase xpms_phase`                | **By design** — status = active/paused operational, phase = LDP §1 lifecycle. Distinct purposes |
| `purchase_orders`    | `state upo_state` (USNP, 13 values)       | `status po_status` (legacy, 5 values)  | 🔴 **P1 CONFLATION** — both attempt to be the PO state machine                                  |
| `requisitions`       | `state upo_state` (USNP, 13 values)       | `status req_status` (legacy, 5 values) | 🔴 **P1 CONFLATION** — same pattern                                                             |
| `xpms_atoms`         | `phase xpms_phase`                        | `state xpms_state` (uac/tpc)           | **By design** — phase = lifecycle position, state = atom variant                                |

**True conflations: 2 (purchase_orders + requisitions).**

---

## P1 — Single `status` column on parent record mixing lifecycles

**LDP symptom:** A `projects.status` column with values like `('draft', 'active', 'in_production', 'closed', 'archived')` mixing what looks like a Project phase with a Production state.

**Search results:**

- ❌ **`purchase_orders` and `requisitions`** are NEW HARD P1 cases (v1 missed because it didn't have live DB access). The USNP UPO canon added `state upo_state` (13-value rich machine) but the legacy `status po_status` / `status req_status` columns were retained. Two state machines, same record, same domain — exactly what P1 forbids.
- `projects.status` + `projects.xpms_phase` is **NOT P1** — they serve different audiences (operational on/off vs production-arc phase). Documented.
- `accounting_periods.state` + `.status` is intentional migration coexistence, not P1.
- `fabrication_orders.production_phase` + `.status` is intentional (lifecycle vs workflow execution).

**Verdict:** **STRICT P1 confirmed × 2** (purchase_orders, requisitions). MEDIUM-HIGH severity. Remediation: drop the legacy `status` column or document it as a derived projection of `state`.

---

## P2 — Engagement state on the Party record (not per Party × Project)

**LDP symptom:** `parties.status` per Party globally rather than per Party per Project.

**Search results:**

- ✅ **CLEARED** — `uis_roles` (USNP UIS canon) is per-Party × Project × channel × role_class with `lifecycle_state uis_lifecycle_state`. `role_lifecycle_history` is the append-only log.
- The per-channel `talent_offers.status`, `job_applications.status`, `open_call_submissions.status`, `invites.status` remain authoritative for channel-internal gates; cross-channel summary is on `uis_roles.lifecycle_state`.
- **No party-level engagement_state column found.**

**Verdict:** **NO P2** ✓ — fully cleared after USNP canon (was DISTRIBUTED in v1; v1 missed `uis_roles`).

---

## P3 — Deliverable state rolled up onto parent

**LDP symptom:** A `projects.deliverables_status` field, or `contracts.completion_status` aggregating child progress.

**Search results:** none found in live DB. ✅

**Verdict:** **NO P3** ✓ (unchanged from v1).

---

## P4 — Asset state inferred from related events

**LDP symptom:** No `asset_state` column; availability inferred from query results.

**Search results:**

- ✅ **CLEARED** — `assets.state ual_state` is explicit and typed. `asset_movements` is the append-only ledger keyed off the same enum (richer than spec — has movement_kind, place tracking, custodian tracking, reservation windows).
- Legacy `equipment.status equipment_status` (5-value) coexists; should eventually be deprecated in favor of `assets.state`.

**Verdict:** **NO P4** ✓ — fully cleared (was PARTIAL in v1; v1 missed `assets` table).

---

## P5 — Document state implicit in file presence

**LDP symptom:** A signed contract file in storage is the only signal.

**Search results:**

- ✅ `offer_letters.status offer_letter_status` (now 11 values incl COUNTERSIGNED/ACTIVE/SUPERSEDED/VOIDED).
- ✅ `contracts.state uct_state` (10 values: draft/in_review/negotiation/awaiting_signatures/active/expiring/expired/terminated/renewed/archived) — discovered in v2.
- ✅ `proposals.status proposal_status` (6 values).
- ✅ `contract_signatures.state text` — captures explicit signature state (untyped, but explicit).
- All explicit; no file-presence-as-state pattern found.

**Verdict:** **NO P5** ✓ (unchanged).

---

## P6 — Mixing financial period state with project phase

**Search results:**

- ✅ **CLEARED** — `accounting_periods.state accounting_period_state` (NEW this session) is independent from `projects.xpms_phase`. Period close is a separate cadence per the LDP §7 spec.
- Legacy `accounting_periods.status text` retained but not coupled to project phase.

**Verdict:** **NO P6** ✓ (was confirmed strict P6 in v1; resolved this session).

---

## P7 — Subscription tracked as a series of Engagements

**Search results:**

- ✅ **CLEARED** — `subscriptions` table (NEW this session) is a first-class record with `state subscription_state`, `subscription_state_transitions` log, and Stripe correlation. Distinct from `uis_roles` Engagement records.

**Verdict:** **NO P7** ✓ (was confirmed strict P7 in v1; resolved this session).

---

## Summary v2 vs v1

| Pattern                              | v1                                    | **v2**                                         | Δ                                           |
| ------------------------------------ | ------------------------------------- | ---------------------------------------------- | ------------------------------------------- |
| P1 — single status mixing lifecycles | Partial (`fabrication_orders.status`) | **STRICT × 2** (purchase_orders, requisitions) | **WORSE** — v1 missed the actual hard cases |
| P2 — engagement state on Party       | Distributed                           | **CLEARED** ✅                                 | Better                                      |
| P3 — deliverable rollup              | None                                  | None                                           | unchanged                                   |
| P4 — asset state inferred            | Partial                               | **CLEARED** ✅                                 | Better                                      |
| P5 — document state implicit         | None strict                           | None                                           | unchanged                                   |
| P6 — financial period coupled        | **STRICT**                            | **CLEARED** ✅                                 | Better                                      |
| P7 — subscription as engagements     | **STRICT**                            | **CLEARED** ✅                                 | Better                                      |

**Score change:** v1 = 3 strict + 2 partial · **v2 = 2 strict + 0 partial.**

The two remaining strict conflations (purchase_orders, requisitions) are real architectural debt from the USNP UPO canon migration, which added `state upo_state` without dropping or rationalizing the legacy `status` columns. They should be the next remediation priority.
