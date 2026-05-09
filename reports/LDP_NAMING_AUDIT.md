> **HISTORICAL — superseded 2026-05-09 by reports/LDP_NAMING_AUDIT_v2.md.**
> v1 audit was built against the stale 18.8k-line worktree snapshot which
> reflected only ~228 of the live database's 412 tables. v2 audit was built
> against direct SQL queries to the live remote DB and corrects multiple
> false-negative findings (notably USNP canon already implemented LDP §3, §5).

# LDP Naming Audit

**Protocol:** LDP — naming discipline (locked)
**Run:** Phase 0 of E2E-LRP, 2026-05-09
**Rule:** `phase` = sequential macro arc (lifecycles 1–2). `state` = cyclical operational (lifecycles 3–8). `status` = RESERVED, every column is a defect candidate.

This is the comprehensive inventory of every column in the schema whose name carries lifecycle meaning, classified against LDP's locked vocabulary.

---

## Inventory totals

- **Enums declared:** ~61 in `0001_remote_snapshot.sql` + 6 in `0003_booking_canon.sql` + 13 in `0002_marketplace_canon.sql` ≈ **80 enum types**.
- **Columns named `status`:** ≥45 in `0001` (counted via grep on `"status"` typed columns); 4 more in `0002`/`0003`. Every one is a P-naming-violation per LDP.
- **Columns named `*_state`:** 14 in `0001`. Mostly correctly typed.
- **Columns named `*_phase`:** 1 (`projects.xpms_phase`) + 1 inside `xpms_atoms.phase`.
- **Columns named `*_stage`:** 1 (`leads.stage`).

---

## A. `*_state` columns (LDP-correct naming)

| Column                                 | Type                       | Default       | Lifecycle                                                                     | LDP fit                                               | Cite                                                              |
| -------------------------------------- | -------------------------- | ------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------- |
| `job_queue.state`                      | `job_state` enum           | `pending`     | platform-utility                                                              | ✅ correct name; non-canonical lifecycle (job runner) | [0001:1226](supabase/migrations/0001_remote_snapshot.sql:1226)    |
| `accreditations.state`                 | `accreditation_state` enum | `applied`     | engagement-doc adjacent                                                       | ✅ correct                                            | [0001:2569](supabase/migrations/0001_remote_snapshot.sql:2569)    |
| `import_jobs.state`                    | `import_job_state` enum    | `pending`     | platform-utility                                                              | ✅ correct                                            | [0001:3817](supabase/migrations/0001_remote_snapshot.sql:3817)    |
| `venues.handover_state`                | `handover_state` enum      | `not_started` | production-adjacent                                                           | ✅ correct                                            | [0001:4489](supabase/migrations/0001_remote_snapshot.sql:4489)    |
| `approvals.state`                      | `approval_state` enum      | `pending`     | UAS                                                                           | ✅ correct                                            | [0001:5064](supabase/migrations/0001_remote_snapshot.sql:5064)    |
| `po_change_orders.state`               | `change_order_state` enum  | `requested`   | UPO                                                                           | ✅ correct                                            | [0001:5087](supabase/migrations/0001_remote_snapshot.sql:5087)    |
| `revisions.state`                      | `revision_state` enum      | `open`        | UFS-adjacent                                                                  | ✅ correct                                            | [0001:5184](supabase/migrations/0001_remote_snapshot.sql:5184)    |
| `rosters.state`                        | `roster_state` enum        | `draft`       | workforce                                                                     | ✅ correct                                            | [0001:5634](supabase/migrations/0001_remote_snapshot.sql:5634)    |
| `xpms_atoms.state`                     | `xpms_state` enum          | `uac`         | XPMS APS atom (uac/tpc — Universal Atomic Code / Tagged Production Component) | ✅ correct (subsystem-specific)                       | [0001:6373](supabase/migrations/0001_remote_snapshot.sql:6373)    |
| `*.ui_state`                           | `jsonb`                    | `{}`          | UI persistence (not a lifecycle column)                                       | ⚠️ name confusable, not a state machine               | [0001:6219](supabase/migrations/0001_remote_snapshot.sql:6219)    |
| (one) `*.state text DEFAULT 'pending'` | text                       | `pending`     | unidentified                                                                  | ⚠️ untyped                                            | [0001:6800](supabase/migrations/0001_remote_snapshot.sql:6800)    |
| `vetting_state` enum (declared)        | —                          | —             | accreditation                                                                 | declared, usage TBD                                   | enum [0001:636](supabase/migrations/0001_remote_snapshot.sql:636) |

**Subtotal:** ~12 columns + 1 jsonb · LDP-correct naming · most are typed enums.

---

## B. `*_phase` / `*_stage` columns

| Column                | Type              | Default     | Lifecycle                              | LDP fit                                                                                                   | Cite                                                           |
| --------------------- | ----------------- | ----------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `projects.xpms_phase` | `xpms_phase` enum | `discovery` | LDP §1 Project Lifecycle               | ⚠️ should be `project_phase` per LDP §1                                                                   | [0001:4444](supabase/migrations/0001_remote_snapshot.sql:4444) |
| `xpms_atoms.phase`    | `xpms_phase` enum | `discovery` | XPMS atom phase (per-atom not project) | ⚠️ overload — same enum reused on different entity                                                        | [0001:6374](supabase/migrations/0001_remote_snapshot.sql:6374) |
| `leads.stage`         | `lead_stage` enum | `new`       | URM pipeline stage                     | ⚠️ "stage" is a third word LDP didn't define; for CRM kanban this is conventional but technically non-LDP | [0001:4156](supabase/migrations/0001_remote_snapshot.sql:4156) |

**Subtotal:** 2 phase columns + 1 stage column.

**Critical absence:** NO `production_phase` column anywhere. The LDP §2 Production Lifecycle has zero schema representation.

---

## C. `status` columns — defect candidates per LDP §NAMING DISCIPLINE

Every row below is an LDP-violation candidate. Some are merely-misnamed (already typed enum, semantics correct) — they need a rename. Others are conflated/coarse and need split-and-migrate. Severity rating per the remediation plan.

### C.1 Typed-enum status columns (rename required, semantics OK)

| Table                                | Column                        | Enum                    | Values                                                                | Maps to LDP lifecycle                                                                                          | Severity                                                       |
| ------------------------------------ | ----------------------------- | ----------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `annotations`                        | `status`                      | `annotation_status`     | (open/resolved/dismissed inferred from CHECK)                         | Comment / annotation moderation                                                                                | low — non-canonical lifecycle                                  |
| `automation_runs`                    | `status`                      | `automation_run_status` | (pending/running/...)                                                 | Job runner                                                                                                     | low                                                            |
| `deliverables`                       | `status`                      | `deliverable_status`    | `draft, submitted, in_review, approved, rejected, revision_requested` | **LDP §4 Deliverable** — should be `deliverable_state`                                                         | **medium**                                                     |
| `dsar_requests`                      | `status`                      | `dsar_status`           | (received/...)                                                        | Privacy / GDPR DSAR                                                                                            | low                                                            |
| `equipment`                          | `status`                      | `equipment_status`      | `available, reserved, in_use, maintenance, retired`                   | **LDP §3 Asset** — should be `asset_state`; missing 4 states                                                   | **medium**                                                     |
| `events`                             | `status`                      | `event_status`          | (draft/scheduled/...)                                                 | UCS calendar event                                                                                             | low                                                            |
| `expenses`                           | `status`                      | `expense_status`        | (pending/approved/...)                                                | Operational finance                                                                                            | low                                                            |
| `export_runs`                        | `status`                      | `export_status`         | (pending/...)                                                         | Job runner                                                                                                     | low                                                            |
| `incidents`                          | `status`                      | `incident_status`       | (open/...)                                                            | Safety incident                                                                                                | low                                                            |
| `invoices`                           | `status`                      | `invoice_status`        | (draft/sent/paid/overdue per prior audit)                             | UTX transaction                                                                                                | low                                                            |
| `offer_letters`                      | `status`                      | `offer_letter_status`   | `draft, sent, viewed, accepted, declined, withdrawn, expired`         | **LDP §6 Engagement-Document** — should be `document_state`; missing COUNTERSIGNED, ACTIVE, SUPERSEDED, VOIDED | **medium**                                                     |
| `projects`                           | `status`                      | `project_status`        | `draft, active, paused, archived, complete`                           | Active vs archived (operational); coexists with `xpms_phase`                                                   | low (not a phase machine)                                      |
| `purchase_orders`                    | (status)                      | `po_status`             | (declared)                                                            | UPO                                                                                                            | low                                                            |
| `requisitions` (or sibling)          | (status)                      | `req_status`            | (declared)                                                            | UPO                                                                                                            | low                                                            |
| `risks`                              | `status`                      | `risk_status`           | (declared)                                                            | Risk register                                                                                                  | low                                                            |
| `tasks`                              | `status`                      | `task_status`           | (declared)                                                            | Operational task                                                                                               | low                                                            |
| `tickets`                            | `status`                      | `ticket_status`         | (declared)                                                            | UTX ticket                                                                                                     | low                                                            |
| `tours.status` (booking canon)       | `tour_status` enum            | `planning` (default)    | Tour state                                                            | low                                                                                                            | [0003:292](supabase/migrations/0003_booking_canon.sql:292)     |
| `settlements.status` (booking canon) | `settlement_status` enum      | `draft`                 | UTX settlement                                                        | low                                                                                                            | [0003:117](supabase/migrations/0003_booking_canon.sql:117)     |
| `talent_offers.status`               | `talent_offer_status` enum    | `draft`                 | **LDP §5 Engagement** (per Party × Project)                           | medium — distributed engagement                                                                                | [0002:364](supabase/migrations/0002_marketplace_canon.sql:364) |
| `job_postings.status`                | `job_posting_status` enum     | `draft`                 | URM-adjacent posting                                                  | low                                                                                                            | [0002:419](supabase/migrations/0002_marketplace_canon.sql:419) |
| `job_applications.status`            | `job_application_status` enum | `new`                   | **LDP §5 Engagement** (per applicant × posting)                       | medium — distributed engagement                                                                                | [0002:464](supabase/migrations/0002_marketplace_canon.sql:464) |
| `open_calls.status`                  | `open_call_status` enum       | `draft`                 | URM-adjacent                                                          | low                                                                                                            | [0002:269](supabase/migrations/0002_marketplace_canon.sql:269) |
| `open_call_submissions.status`       | `submission_status` enum      | `submitted`             | **LDP §5 Engagement** (per submitter × call)                          | medium — distributed engagement                                                                                | [0002:313](supabase/migrations/0002_marketplace_canon.sql:313) |

### C.2 Untyped-text status columns with CHECK constraints (severity HIGH — both name and type need fix)

| Table                                                                         | Column line | Default     | Allowed (from CHECK)                                                                            | Cite                                                                |
| ----------------------------------------------------------------------------- | ----------- | ----------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `accreditations.status`                                                       | text        | `pending`   | (no CHECK shown in audit)                                                                       | [0001:2550](supabase/migrations/0001_remote_snapshot.sql:2550)      |
| `ad_manifests.status`                                                         | text        | `scheduled` | (untyped)                                                                                       | [0001:2598](supabase/migrations/0001_remote_snapshot.sql:2598)      |
| `automation_subscriptions.status`                                             | text        | `pending`   | (untyped)                                                                                       | [0001:2793](supabase/migrations/0001_remote_snapshot.sql:2793)      |
| `automations.last_run_status`                                                 | text        | (none)      | (untyped)                                                                                       | [0001:2830](supabase/migrations/0001_remote_snapshot.sql:2830)      |
| `campaigns.status`                                                            | text        | `draft`     | `draft, scheduled, live, paused, complete, cancelled`                                           | [0001:2871-2880](supabase/migrations/0001_remote_snapshot.sql:2871) |
| `cues.status`                                                                 | text        | `pending`   | `pending, standby, live, done, skipped`                                                         | [0001:3076-3083](supabase/migrations/0001_remote_snapshot.sql:3076) |
| `daily_logs.status`                                                           | text        | `draft`     | `draft, submitted, approved`                                                                    | [0001:3185-3193](supabase/migrations/0001_remote_snapshot.sql:3185) |
| `delegation_entries.status`                                                   | text        | `submitted` | (untyped)                                                                                       | [0001:3225](supabase/migrations/0001_remote_snapshot.sql:3225)      |
| `dispatch_runs.status`                                                        | text        | `scheduled` | (untyped)                                                                                       | [0001:3338](supabase/migrations/0001_remote_snapshot.sql:3338)      |
| `fabrication_orders.status`                                                   | text        | `open`      | `open, in_progress, blocked, complete`                                                          | [0001:3541-3546](supabase/migrations/0001_remote_snapshot.sql:3541) |
| `form_defs.status`                                                            | text        | `draft`     | `draft, published, archived`                                                                    | [0001:3564-3568](supabase/migrations/0001_remote_snapshot.sql:3564) |
| `governance_policies.status`                                                  | text        | `draft`     | `draft, active, archived`                                                                       | [0001:3737-3740](supabase/migrations/0001_remote_snapshot.sql:3737) |
| `guard_tours.status`                                                          | text        | `scheduled` | `scheduled, in_progress, completed, cancelled, overdue`                                         | [0001:3756-3763](supabase/migrations/0001_remote_snapshot.sql:3756) |
| `import_runs.status`                                                          | text        | `queued`    | `queued, running, succeeded, failed, cancelled`                                                 | [0001:3844-3851](supabase/migrations/0001_remote_snapshot.sql:3844) |
| `inspections.status`                                                          | text        | `scheduled` | `scheduled, in_progress, passed, failed, cancelled`                                             | [0001:3954-3966](supabase/migrations/0001_remote_snapshot.sql:3954) |
| `invites.status`                                                              | text        | `pending`   | `pending, accepted, revoked`                                                                    | [0001:4013-4020](supabase/migrations/0001_remote_snapshot.sql:4013) |
| `itil_changes.status`                                                         | text        | `proposed`  | `proposed, in_review, approved, rejected, scheduled, implementing, implemented, closed, failed` | [0001:4085-4098](supabase/migrations/0001_remote_snapshot.sql:4085) |
| `itil_problems.status`                                                        | text        | `new`       | `new, investigating, known_error, resolved, closed`                                             | [0001:4113-4125](supabase/migrations/0001_remote_snapshot.sql:4113) |
| `major_incidents.status`                                                      | text        | `active`    | (untyped)                                                                                       | [0001:4246](supabase/migrations/0001_remote_snapshot.sql:4246)      |
| `org_integrations.status`                                                     | text        | `disabled`  | `disabled, installing, installed, error`                                                        | [0001:4653-4659](supabase/migrations/0001_remote_snapshot.sql:4653) |
| `payment_applications.status`                                                 | text        | `draft`     | `draft, submitted, in_review, approved, rejected, paid`                                         | [0001:4811-4826](supabase/migrations/0001_remote_snapshot.sql:4811) |
| `playbooks.status`                                                            | text        | `draft`     | (untyped)                                                                                       | [0001:4842](supabase/migrations/0001_remote_snapshot.sql:4842)      |
| `po_change_order_lines.status`                                                | text        | `proposed`  | (untyped)                                                                                       | [0001:4877](supabase/migrations/0001_remote_snapshot.sql:4877)      |
| `po_checklist_items.status`                                                   | text        | `pending`   | (untyped)                                                                                       | [0001:4900](supabase/migrations/0001_remote_snapshot.sql:4900)      |
| (and ~20 more past line 5000 — full list deferred to LDP_REMEDIATION_PLAN.md) |             |             |                                                                                                 |                                                                     |

**Subtotal C.2:** 25+ untyped-text status columns with at-most-CHECK enforcement. Highest LDP severity — both name and type need remediation.

---

## D. Hybrid name violations

| Pattern                                     | Example                                                                                                                                            | Issue                                                                                                                      |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `*_phase_status`                            | `proposal_phase_status` enum at [0001:444-450](supabase/migrations/0001_remote_snapshot.sql:444) (`locked, active, in_review, approved, complete`) | Name carries BOTH `phase` AND `status` — violates LDP's lock that they mean different things. Consumers must guess intent. |
| `*_status` enum applied to lifecycle column | `deliverable_status`, `equipment_status`, `offer_letter_status` enums all carry LDP-§3-/§4-/§6-relevant semantics                                  | Enum name and column name both wrong; lifecycle pretends to be a status                                                    |
| `_state` text column (untyped)              | one untyped text column at [0001:6800](supabase/migrations/0001_remote_snapshot.sql:6800)                                                          | Right name, wrong type — should be enum                                                                                    |

---

## E. Aggregate score

| Category                                     | Count                                           | LDP-correct?                                                                                         |
| -------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `*_state` columns, typed enum                | 11                                              | ✅                                                                                                   |
| `*_state` column, untyped text               | 1                                               | ⚠️                                                                                                   |
| `*_phase` columns                            | 2                                               | ⚠️ (one is reuse of same enum across two tables)                                                     |
| `*_stage` column                             | 1                                               | ⚠️ (third vocabulary word; CRM-conventional)                                                         |
| `status` columns, typed enum                 | ~25                                             | ❌ name violation                                                                                    |
| `status` columns, untyped text + CHECK       | ~25+                                            | ❌❌ name + type violation                                                                           |
| `status` columns, untyped text without CHECK | ≥5                                              | ❌❌❌ name + type + no enforcement                                                                  |
| Hybrid `*_phase_status` enums                | 1                                               | ❌ semantically broken                                                                               |
| Same enum reused across tables               | 1 (`xpms_phase` on `projects` AND `xpms_atoms`) | ⚠️ violates LDP "each lifecycle has its own enum type" rule, mitigated by both being phase semantics |

**Naming compliance rate:** ~14 / ~70 lifecycle-bearing columns = **20%** LDP-name-compliant.
