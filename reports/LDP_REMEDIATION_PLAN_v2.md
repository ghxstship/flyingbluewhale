# LDP Remediation Plan — v2 (post-apply)

**Protocol:** Lifecycle Decomposition Protocol (LDP)
**Run:** Phase 0 re-audit, 2026-05-09
**Mode:** HYBRID per user direction; user has authorized direct apply to remote production. Schema migrations are now in scope (overriding the protocol's standard "always-deferred" rule, as confirmed in this session's prior turns).

> The v1 plan proposed 10 R-LDP items; 6 of them landed this session and 4 turned out to be redundant with USNP canon. v2 enumerates what remains.

---

## What landed this session (closed items)

| Item                                                     | Outcome                          | Reference                                                                                                                |
| -------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| R-LDP-1 (Production Lifecycle)                           | ✅ APPLIED                       | `production_phase` enum + `fabrication_orders.production_phase` column                                                   |
| R-LDP-3 (Engagement state column)                        | ✅ DEFERRED-BY-PRE-EXISTING-USNP | `uis_roles.lifecycle_state` (USNP) is canonical; my `project_members.engagement_state` add was redundant and not applied |
| R-LDP-4 (Asset movements ledger)                         | ✅ DEFERRED-BY-PRE-EXISTING-USNP | `asset_movements` (USNP, ual_state-typed) already richer than spec; my add was redundant                                 |
| R-LDP-5a (Asset state expansion)                         | ✅ DEFERRED-BY-PRE-EXISTING-USNP | `ual_state` enum already has all 9 LDP states (`equipment_status` legacy left as-is)                                     |
| R-LDP-5b (Document state expansion)                      | ✅ APPLIED                       | `offer_letter_status` extended +COUNTERSIGNED/ACTIVE/SUPERSEDED/VOIDED                                                   |
| R-LDP-7 (proposal_phase rename)                          | ✅ APPLIED                       | `proposal_phase_status` → `proposal_phase_state`                                                                         |
| R-LDP-8 (Financial Period)                               | ✅ APPLIED                       | `accounting_periods.state accounting_period_state` (NEW typed column, backfilled)                                        |
| R-LDP-9 (Subscription)                                   | ✅ APPLIED                       | `subscriptions` table + `subscription_state_transitions` log + RLS                                                       |
| R-LDP-10 (process gate)                                  | ✅ APPLIED                       | CLAUDE.md §"Backend (Supabase)" updated with LDP naming-discipline note                                                  |
| **(NEW v2)** Drop redundant `uis_role_state_transitions` | ✅ APPLIED                       | v2 audit found `role_lifecycle_history` (USNP) covers same lifecycle                                                     |

---

## What v1 missed (because it read a stale snapshot)

The v1 plan was built against an 18.8k-line snapshot that was missing **184 tables** worth of USNP canon work. v2 audit (against live DB) found that USNP canon already implemented far more LDP infrastructure than v1 reported. Specifically:

- `assets.state ual_state` (LDP §3 PASS — v1 thought PARTIAL)
- `uis_roles.lifecycle_state uis_lifecycle_state` (LDP §5 PASS — v1 thought DISTRIBUTED)
- `contracts.state uct_state` (10-value contract lifecycle)
- `calendar_events.state ucs_event_state`
- `tasks_v2.state utm_state` + `task_status_history` log
- `transactions.state utx_state` + `transaction_status_history` log
- `timesheets.state utt_timesheet_state`
- `uqm_incidents.state uqm_state`
- `purchase_orders.state upo_state` (rich 13-value)

These were ALL already shipped before this run. The schema is ~80% LDP-conformant; the remaining gaps are concentrated in column naming + a few hard P1 conflations.

---

## R-LDP-v2-1 — UPO conflation: drop legacy `status` from purchase_orders + requisitions

**Severity:** S2 MAJOR (true LDP P1 conflation — two state machines on one record).
**Scope:** local per table; consumer code refactor required.
**Pattern:** LDP P1.

**Problem:** USNP UPO canon added `purchase_orders.state upo_state` (13-value rich machine) and `requisitions.state upo_state` but did not drop the legacy `status po_status` (5 values) and `status req_status` (5 values). Both are populated by application code; readers don't know which is authoritative. Per LDP §SCHEMA PATTERNS DON'T this is a top-priority defect.

**Proposed change** (multi-PR, NOT applied this session):

1. **Audit consumer code** for every read of `purchase_orders.status` and `requisitions.status`. List them.
2. **Add a migration view** `purchase_orders_with_legacy_status` that derives `po_status` from `upo_state` for back-compat readers.
3. **Migrate consumer code** to read `state upo_state` instead.
4. **Drop the legacy columns** in a clean follow-up migration.

**Risk:** MEDIUM. Touches every PO/requisition consumer. Must be coordinated.

**Effort:** 1–2 weeks per table; can be parallelized.

---

## R-LDP-v2-2 — Project Lifecycle column rename + transition log

**Severity:** S3 (naming + missing log).
**Scope:** local on `projects`.

**Proposed change:**

1. `ALTER TABLE projects RENAME COLUMN xpms_phase TO project_phase;` (preferred — drops the XPMS prefix that doesn't reflect LDP §1 ownership).
   - Alt: keep `xpms_phase` and add a generated/synonym column. Less clean.
2. Add `project_phase_transitions` append-only log (id, project_id, from_phase, to_phase, transitioned_at, transitioned_by, reason).
3. Update `src/lib/db/`, server actions, all consumer reads.
4. Decouple `xpms_atoms.phase` enum reuse — give XPMS atoms their own `xpms_atom_phase` enum if needed (or document the reuse as intentional for the XPMS atom semantics).

**Risk:** MEDIUM (column rename touches all readers).
**Effort:** 1 week.

---

## R-LDP-v2-3 — Deliverable Lifecycle: rename + 2 missing states

**Severity:** S3.
**Scope:** local on `deliverables`.

**Proposed change:**

1. `ALTER TYPE deliverable_status ADD VALUE 'briefed' BEFORE 'draft'; ADD VALUE 'delivered' AFTER 'approved';`
2. `ALTER TABLE deliverables RENAME COLUMN status TO state; ALTER TYPE deliverable_status RENAME TO deliverable_state;`
3. Update consumers.

**Risk:** LOW–MEDIUM. Smaller blast radius than UPO.
**Effort:** 3–5 days.

---

## R-LDP-v2-4 — Engagement-Document Lifecycle: rename + casing fix

**Severity:** S3 (naming + casing inconsistency).
**Scope:** local on `offer_letters`, `proposals`.

**Proposed change:**

1. `ALTER TYPE offer_letter_status RENAME TO document_state` (since this IS the LDP §6 Document Lifecycle).
2. `ALTER TABLE offer_letters RENAME COLUMN status TO state`.
3. Normalize enum value casing — currently mixed (`draft, sent, viewed, accepted, COUNTERSIGNED, ACTIVE, declined, withdrawn, expired, SUPERSEDED, VOIDED`). Pick one (suggest lowercase to match legacy values), migrate values, drop old.
4. Repeat for `proposals.status proposal_status` if it should also conform to LDP §6 (or document why it's a separate lighter-weight document machine).

**Risk:** LOW–MEDIUM.
**Effort:** 3–5 days.

---

## R-LDP-v2-5 — Untyped text status columns (~58) → typed enum promotion

**Severity:** S3 functional / S2 if integrity-critical (e.g., invites, payment_applications, accreditation_changes).
**Scope:** shared (multiple subsystems).

**Approach** — batch by subsystem:

1. **Wave A — high-value typed promotions:** `accounting_periods.status` (drop now that `state` exists), `fabrication_orders.status` (decide if drop or keep as workflow column distinct from production_phase), `invites.status`, `payment_applications.status`, `accreditation_changes.status`.
2. **Wave B — venue / build operations:** `daily_logs`, `inspections`, `punch_items`, `punch_lists`, `submittals`, `rfis`, `venue_*` columns. Likely a single `venue_workflow_state` enum could cover several.
3. **Wave C — comms / delivery:** `notification_*`, `notification_deliveries`, `automation_step_runs`, `dispatch_runs`, `import_runs`, `export_runs`. Each gets its own typed `*_state` enum.
4. **Wave D — campaigns / playbooks / governance:** lower-priority text-status columns.

**Risk:** MEDIUM cumulatively. Must coordinate with consumer code per wave.
**Effort:** 4–6 weeks total across waves.

---

## R-LDP-v2-6 — Add transition logs for the lifecycles missing them

**Severity:** S3.
**Scope:** local additions per table.

**Missing logs:**

- `project_phase_transitions` (LDP §1)
- `production_phase_transitions` (LDP §2 — `fabrication_orders` doesn't have one)
- `accounting_periods_state_transitions` (LDP §7)
- `document_state_transitions` keyed off offer_letters / proposals (LDP §6)
- `deliverable_state_transitions` (currently only have `deliverable_history` which may cover it — confirm)

**Effort:** 1 week.

---

## R-LDP-v2-7 — Decouple `xpms_phase` enum reuse

**Severity:** S4 cosmetic.
**Scope:** local.

`xpms_phase` is used by both `projects.xpms_phase` (LDP §1) and `xpms_atoms.phase` (per-atom phase). LDP §SCHEMA DON'T forbids enum reuse. Either:

- Confirm both columns track the same LDP §1 lifecycle (then reuse is fine, just rename column on projects).
- Or split into `project_phase` and `xpms_atom_phase` if they diverge.

**Effort:** 0.5 day per table touched.

---

## R-LDP-v2-8 — Build SDK + UI surfaces for the new lifecycles

**Severity:** S2 functional (no UI = lifecycle is dead infrastructure).
**Scope:** shared.

Now that schema exists, add the consumer surface:

- `/console/finance/periods` — open/close/audit accounting periods, view transitions
- `/console/subscriptions` — admin UI for member/retainer/sponsor renewal
- Stripe webhook handler — emit `subscription_state_transitions` rows on renewal/lapse events
- `src/lib/subscriptions.ts` SDK (typed wrapper around subscriptions + transitions)
- `src/lib/accounting-periods.ts` SDK (typed wrapper)
- `src/lib/production-phase.ts` SDK (typed wrapper for fabrication_orders.production_phase)

**Effort:** 2–3 weeks per surface.

---

## Sequencing recommendation

**Wave 1 — high-leverage, low-risk (within 2 weeks):**

1. R-LDP-v2-1 — UPO P1 conflation resolution (start with code audit)
2. R-LDP-v2-7 — xpms_phase enum decoupling decision
3. R-LDP-v2-3 — Deliverable rename + 2 missing states
4. R-LDP-v2-6 — Add 3–5 missing transition logs

**Wave 2 — medium effort (3–6 weeks):** 5. R-LDP-v2-2 — Project Lifecycle rename + transition log 6. R-LDP-v2-4 — Document Lifecycle rename + casing fix 7. R-LDP-v2-8 — SDK + UI for new lifecycles (Subscription, Financial Period, Production Phase)

**Wave 3 — large surface, batched (4–6 weeks):** 8. R-LDP-v2-5 — 58 untyped status columns → typed enum promotion (per-wave subsystem batch)

**Total estimated effort:** 9–14 weeks.

---

## Out-of-scope per protocol

- Any change to `auth.*` schema, encryption, audit-log integrity.
- Changes to USNP canon enum names (would break upstream).
- Renaming the 23 `uis_role_class` values.
