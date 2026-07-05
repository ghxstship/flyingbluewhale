# Competitive Vertical Parity — Research + Implementation Plan

**Date:** 2026-07-05
**Scope:** Vertical (industry-specific) competitor scan across all four ATLVS Technologies products — ATLVS (ERP×CRM×PM), COMPVSS (deskless workforce), GVTEWAY (marketplace/portal), LEG3ND (LMS/knowledge/compliance) — as a companion to `docs/COMPETITIVE_PARITY_IMPLEMENTATION_PLAN.md` (2026-06-13), which covered horizontal productivity-suite parity (SmartSuite/ClickUp). This pass instead benchmarks against direct industry competitors: Momentus/Ungerboeck, LASSO, Rentman, Current RMS, Flex, Cvent, Bizzabo (ATLVS); Connecteam, Deputy, Homebase, 7shifts, UKG, WorkJam, Legion (COMPVSS); Eventbrite, PartySlate, Upwork, Thumbtack, Backstage, GigSalad, HoneyBook, Dubsado (GVTEWAY); Trainual, Guru, Confluence, Notion, TalentLMS, Docebo, Absorb, SafetyCulture, Vector Solutions (LEG3ND).
**Constraint:** research + plan, with two concretely-scoped, no-migration P0 items **implemented in this pass** (see §2). Everything else is a phased, ready-to-build roadmap for follow-up work — the full feature set was not implemented autonomously; larger items (schema changes, new UI surfaces) warrant human sign-off before building, consistent with how the prior competitive-parity doc scoped its own P1–P3 phases.

---

## 0. Recalibration — what already exists

Before proposing work, the following was confirmed **not yet built** (see investigation notes below each), so nothing here duplicates existing code:

| Area | Existing substrate | Gap confirmed |
|---|---|---|
| Credential/cert expiry | `credential_assignment_details.expires_on`, LEG3ND `legend_compliance.ts` (`effectiveAccreditationState`), `subcontractor.ts` (`deriveDocStatus`) — all **pure derivation, read on page load only** | No proactive push/nudge anywhere. No cron/job scans `expires_on`. |
| Shift-swap guardrails | `shift_swaps` + `decideSwap` (studio `src/app/(platform)/studio/workforce/shift-swaps/actions.ts` + mobile `src/app/(mobile)/m/requests/actions.ts`) — raw state-machine UPDATE, no hours math | No overtime/labor-law check before approval. **Fixed in this pass — see §2.1.** |
| Training-gated eligibility | `courses`, `course_completions`, `master_catalog_items.prerequisites` (free-text, zero code references) | Completely disconnected — no join from "completed course X" to "eligible for assignment/credential Y." |
| Automation/scheduling infra | `automation_schedules` (RRULE-based) + `job_queue` + `/api/v1/internal/automations/{dispatch,schedule}` (JOB_WORKER_TOKEN-secured, external cron pings every minute) — **built since the 2026-06-13 plan's P3.1 was scoped as net-new** | This is the correct hook point for any new proactive/scheduled feature (credential-expiry nudges, re-certification reminders) — do not add Vercel-native crons (`vercel.json` still has `"crons": []`) or invent parallel infra. |
| `PushKind` catalog | `src/lib/push/send.ts` (11 kinds) + SQL view `notification_kind_catalog` (`supabase/migrations/20260606230000_baseline.sql:11166`) | Adding a kind needs both: the TS union **and** a `CREATE OR REPLACE VIEW` migration appending a row to the `VALUES` list — miss either and the settings UI / preference gating fork. |

---

## 1. Cross-cutting competitive themes (all four products)

Synthesized from the four research passes (full per-competitor notes retained in the session that produced this doc; summarized here to keep this file actionable):

1. **Grounded, reversible AI agents over one unified data model** (Momentus Ask Mo, LASSO Lassie, Salesforce Agentforce, monday.com agents) — natural-language Q&A + multi-step actions (approvals, staffing offers, requisitions) over our own `assignments`/`requisitions`/`approval_instances`, with full audit/undo. Extends existing `ai_conversations`/`ai_messages` from chat into action-taking.
2. **Proactive expiry/compliance nudges** (Absorb auto re-enrollment, Vector Solutions incident→retraining, LASSO/Deputy conversational scheduling) — closing the loop between a stored expiry/state and a push, instead of leaving it as a derived read. **§2.2 below is the concretely-scoped version of this for credentials.**
3. **Compliance-aware shift-swap / scheduling guardrails** (Homebase, WorkJam, Deputy) — auto-filter/block trades that would create overtime or coverage gaps. **Shipped in this pass — §2.1.**
4. **Training-gated assignment/shift eligibility** (WorkJam ties badge completion to shift-marketplace access) — turns LMS completion into a functional gate, not just a record. Requires new FK from `master_catalog_items`/credential types to `courses`; scoped in §3.1, deferred (schema decision needed).
5. **AI-assisted bulk data intake + document/data → course generation** (Momentus Smart Imports, Trainual/TalentLMS/Absorb doc→course) — cuts manual setup friction; scoped in §3.3.
6. **Explainable AI matching + multimodal intake for RFQs/casting** (Thumbtack, Upwork) — don't just rank vendors/talent, say why; accept photo/voice descriptions. Scoped in §3.4.
7. **Incident → targeted retraining recommendation** (Vector Solutions, SafetyCulture) — ties COMPVSS incident reports directly to LEG3ND course assignment. Scoped in §3.2.
8. **Proactive "needs attention" surfacing** (Dubsado, HoneyBook) — **already shipped** as the Home "Copilot Suggests" rail (kit 20) — no further work needed here, noted for completeness.
9. **Cross-profile crediting/portfolio richness** (PartySlate auto-credits every collaborator across their profiles) — a GVTEWAY marketplace enhancement, scoped in §3.5.
10. **Integrated e-signature + native payment/tax collection on documents** (Current RMS, LASSO Payments + AvaTax) — extends the 29-type Documents system; scoped in §3.6.

---

## 2. Shipped in this pass (P0 — no migration, code-only)

### 2.1 Shift-swap overtime guardrail ✅ IMPLEMENTED

Homebase/WorkJam/Deputy pattern: block a swap approval that would push the target worker over a weekly-hours threshold, with an explicit "approve anyway" override rather than a silent bypass.

- **Lib:** `WEEKLY_OVERTIME_THRESHOLD_HOURS` (40), `weekBoundsUtc()`, `shiftHours()` — pure helpers in `src/lib/workforce.ts` (unit-tested in `src/lib/workforce.test.ts`).
- **DB orchestration:** `computeSwapOvertimeRisk(orgId, shiftId, targetUserId)` in `src/lib/db/shift-swaps.ts` — sums the target's scheduled hours (via `workforce_members`/`shifts`) for the ISO week containing the swap's shift; returns `null` when there's no named target (open-pool swaps aren't evaluable yet), the target has no `workforce_members` row, or the projected total is at/under threshold.
- **Studio surface** (`/studio/workforce/shift-swaps`): risk is computed server-side per pending row at render time; rows with risk render an "Approve Anyway (OT)" danger-styled button (carrying `force=1`) plus a `⚠ OT risk: Xh` badge instead of the plain Approve button. `decideSwap` (`actions.ts`) independently re-checks and fails closed (throws) if a request without `force=1` somehow reaches it while risk exists — defense in depth against a bypass, not just a UI nicety.
- **Mobile surface** (`/m/requests`): `decideSwap` returns `{ otRisk }` in its `State` instead of applying the decision; `RequestsView.tsx` shows an inline warning with "Approve Anyway" / "Cancel" before resubmitting with `force=1`.
- **Audit:** both actions `log.warn("shift_swap.overtime_override", …)` when a manager overrides.
- **No migration** — computed entirely from existing `shifts`/`workforce_members`/`shift_swaps` columns. Threshold is a code constant for now (see §4 for a future org-configurable version).

### 2.2 Credential expiry proactive nudge — scoped, not yet built

Absorb/Vector-Solutions pattern: turn `credential_assignment_details.expires_on` from a passive column into a proactive push, using the **existing** `automation_schedules`/`job_queue` infra (§0) rather than new cron plumbing.

**Why this one is deferred to a follow-up pass, not shipped today:** unlike §2.1, it requires a migration (new `PushKind` + a `notification_kind_catalog` view row) and a decision on dedupe strategy (how do we avoid re-nudging every run once a credential enters the expiry window?) — both worth a quick human sign-off before landing on production schema, per this repo's "migrations via Supabase MCP, plan first" convention.

**Ready-to-build spec:**
- **Migration** `…_credential_expiry_nudge.sql`: extend the `notification_kind_catalog` view's `VALUES` list with `('credential_expiring', 'Credential Expiry', 'Your credential or certification is expiring soon')`; extend `src/lib/push/send.ts`'s `PushKind` union to match.
- **Dedupe:** reuse the `assignment_events` journal (already the append-only log for `assignments`, and `credential_assignment_details` is 1:1 keyed to an assignment) — write an `assignment_events` row with `event_kind='comment'` (or a new lightweight kind, e.g. `expiry_nudge`, if we don't want to overload `comment`) each time a nudge fires for a given window (30/14/3 day tiers), and skip a tier if a row for it already exists. Avoids a new table.
- **Scan + dispatch:** a new `src/lib/db/credential-expiry.ts` `scanExpiringCredentials(orgId)` querying `credential_assignment_details.expires_on` joined to `assignments` for `expires_on` within the next 30 days and not yet nudged for the current tier; register a recurring `automation_schedules` row (daily RRULE) whose action fans out `sendPushTo(..., { kind: "credential_expiring" })` per affected party.
- **Settings UI:** add the new kind to whatever renders the other 11 toggles on `/m/settings/notifications` (mirrors the existing enumeration pattern — no new component).
- **Effort:** 1–2 days. **Risk:** low (additive migration, no data loss, reuses existing job infra).

---

## 3. Phased roadmap — deferred, ready for a follow-up pass

Sequenced cheapest/most-isolated first. None of this was implemented in this pass; each item below is scoped enough to pick up directly.

| Phase | Item | Theme # | Effort | Risk |
|---|---|---|---|---|
| **P1** | §2.2 Credential expiry nudge (spec above) | 2 | 1–2 days | low |
| **P1** | §3.1 Training-gated assignment eligibility | 4 | 3–5 days | med (schema: new FK from catalog/credential types to `courses`) |
| **P1** | §3.2 Incident → retraining recommendation | 7 | 2–3 days | low–med (reuses `incidents` + `course_assignments`) |
| **P2** | §3.3 AI-assisted bulk import + doc→course generation | 5 | 1–1.5 wks | med (Anthropic API integration, content-quality review loop) |
| **P2** | §3.4 Explainable AI matching + multimodal RFQ/casting intake | 6 | 1.5–2 wks | med (matching algorithm + photo/voice intake pipeline) |
| **P2** | §3.5 Cross-profile crediting (PartySlate pattern) | 9 | 3–5 days | low (join table: `event_credits` linking a project to every vendor/talent/crew profile that worked it) |
| **P3** | §3.6 Native e-signature + payment/tax on Documents | 10 | 1.5–2 wks | med (Stripe Tax or AvaTax integration, e-sign vendor or native canvas) |
| **P3** | §3.7 Copilot action-taking agent (theme #1) | 1 | 3–4+ wks | high (biggest lift — needs its own design phase, mirrors the "autonomous agents" item already deferred in the 2026-06-13 plan) |

### 3.1 Training-gated assignment eligibility (detail)
- **Schema decision needed:** either (a) add `required_course_id uuid references courses(id)` to `master_catalog_items` (LDP-compliant: no `status`/bare enum issues, straightforward FK), or (b) generalize via a join table `catalog_item_prerequisites (catalog_item_id, course_id)` if a catalog item should ever require more than one course. Recommend (a) for v1 — the existing `prerequisites` free-text column stays as human-readable notes; the new FK is what's actually enforced.
- **Enforcement point:** `src/lib/db/assignments.ts` — before inserting an `assignments` row (or transitioning to `issued`), check the party's `course_completions` for the catalog item's `required_course_id`; block with a clear error if missing, matching the existing `NEXT_FULFILLMENT_STATES` validation style.
- **UI:** surface "Requires: <course name>" on the catalog item detail + assignment-creation form; if the party hasn't completed it, show a direct link to enroll rather than just blocking silently.

### 3.2 Incident → retraining recommendation (detail)
- On `incidents` insert/close (COMPVSS field incident reporting, per Workforce Parity §), look up any LEG3ND course tagged for that incident's category (needs a small `courses.incident_category` text/enum tag or a mapping table) and auto-create a `course_assignments` row for the involved party, with a push (`kind: "course"`, already exists).
- Effort is low because both halves (`incidents` and `course_assignments`) already exist — this is a join, not new domains.

### 3.3–3.6 — see §1 themes 5, 6, 9, 10 above for the value proposition; each needs its own short design note before a migration is written, per this repo's practice of proposing schema before applying it via the Supabase MCP.

---

## 4. Conventions every future item here must follow

(Mirrors `docs/COMPETITIVE_PARITY_IMPLEMENTATION_PLAN.md` §0 — repeated here so this doc stands alone.)

- **LDP naming:** new lifecycle columns are `*_phase` or `*_state`; `status` is banned (`src/lib/ldp-naming-canon.test.ts`).
- **Migrations:** `supabase/migrations/YYYYMMDDHHMMSS_<slug>.sql`, applied via Supabase MCP `apply_migration` only — never hand-edit the remote DB. Regenerate `database.types.ts` after.
- **RLS:** `is_org_member`/`has_org_role` pair on every new table.
- **PushKind additions:** update **both** the `send.ts` TS union and the `notification_kind_catalog` view in the same migration — they're guarded to stay in sync per the settings UI enumeration.
- **Automation/scheduling:** use the existing `automation_schedules`/`job_queue` + `/api/v1/internal/automations/*` infra for anything recurring — do not add Vercel-native crons or a second scheduler.
- **Gate of done:** `/validate` green (typecheck, lint, test, build, brand/URL/LDP/unsafe-cast sweeps) before merge.

---

## 5. Sources

Full per-competitor findings (Momentus, LASSO, Rentman, Current RMS, Flex, Cvent, Bizzabo, Salesforce, monday.com, ServiceTitan · Connecteam, When I Work, Deputy, Homebase, Rippling, 7shifts, Sling, UKG, WorkJam, Legion · Eventbrite, PartySlate, Upwork, Thumbtack, Backstage, GigSalad, The Bash, Wonolo, HoneyBook, Dubsado · Trainual, Seismic/Lessonly, Guru, Confluence, Notion, TalentLMS, Docebo, Absorb, SafetyCulture, Vector Solutions) were gathered via live web search on 2026-07-05; source URLs are preserved in the research session and available on request rather than duplicated in full here to keep this doc focused on the actionable plan.

*End of plan.*
