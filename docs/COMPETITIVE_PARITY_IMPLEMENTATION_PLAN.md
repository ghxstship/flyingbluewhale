# Competitive Parity — Implementation Plan

**Date:** 2026-06-13
**Scope:** Close every gap from the SmartSuite / ClickUp feature-parity audit **except** autonomous AI agents and AI notetaker/summaries, which are **deferred to backlog** (see end).
**Sources:** [SmartSuite What's New](https://www.smartsuite.com/whats-new) · [ClickUp Changelog](https://feedback.clickup.com/changelog)
**Constraint:** plan only — no code changed in producing this document.

---

## 0. Recalibration — what already exists

The audit assumed several features were missing. Code exploration shows otherwise. This materially shrinks scope:

| Gap (audit #) | Audit assumption | Reality in repo | Revised work |
|---|---|---|---|
| #3 Kanban | net-new | `src/components/views/KanbanBoard.tsx` (dnd-kit) live at `/console/tasks` | **Extend** to assignments + portal/mobile |
| #4 Calendar | net-new | `src/components/views/CalendarView.tsx` (month/week/day/agenda + drag-reschedule) live at `/console/schedule` | **Extend** to events/availability + portal/mobile |
| #11 Recycle bin | net-new | `restoreOrgScoped()` in `src/app/(platform)/console/actions/restore.ts`; `SOFT_DELETABLE_TABLES` (69 tables) | **Surface** a browse-and-restore UI |
| #12 AI usage dash | net-new | `usage_events` + `usage_rollups`, `record()` in `src/lib/usage.ts`; AI route already logs `ai.tokens.*` | **Surface** a dashboard; backend done |
| #8 Forms | net-new | `FormShell` (`useActionState`, dirty-guard, value-echo, field errors) | **Extend** to multi-page/progress/review |
| #13 Button fields | net-new | Server-action + `RowActions` primitive exist | **Compose** record-action buttons |
| #18 Pre-accept team | net-new | Invite/`accept_invite` RPC; role set at acceptance | Small invite-flow tweak |

Net-new builds that remain genuinely from-scratch: **Gantt (#1), Workload (#5), Configurable dashboards (#6), Automations engine (#7), Actionable notifications (#10), MCP server (#15), Enterprise SSO (#14)**.

### Conventions every item must follow
- **LDP naming:** new schema-bearing lifecycle columns are `*_phase` (sequential) or `*_state` (cyclical). **`status` is banned.** Guarded by `src/lib/ldp-naming-canon.test.ts`.
- **Migrations:** `supabase/migrations/YYYYMMDDHHMMSS_<slug>.sql`, applied via Supabase MCP `apply_migration` (latest is `20260613170000_*`). Never hand-edit remote DB.
- **RLS:** every table — `private.is_org_member(org_id)` for read, `private.has_org_role(org_id, ARRAY[...])` for write. Separate SELECT vs INSERT/UPDATE policies.
- **Data access:** server components use `listOrgScoped`/`getOrgScoped`/`countOrgScoped` from `src/lib/db/resource.ts` (soft-delete-aware; add new soft-deletable tables to `SOFT_DELETABLE_TABLES`).
- **Server actions:** `"use server"` in `actions.ts`, `export type State = { error?: string } | null`, Zod-validated, org-scoped via `session.orgId`, `revalidatePath()`.
- **Nav:** register new console modules in **both** `platformNavDomain` and `platformNavXpms` in `src/lib/nav.ts`; icons in `src/components/nav-icons.ts`.
- **Cross-shell URLs:** `urlFor(shell, path)` — never hardcode.
- **Gate of done:** `/validate` (typecheck, lint, test, build, brand/URL/LDP/unsafe-cast sweeps) green + extend the COMPVSS smoke harnesses (`scripts/compvss-smoke.mjs`, `scripts/compvss-actions-smoke.mjs`) for new routes/mutations.

---

## 1. Phased roadmap

Sequenced by dependency and value-per-effort: cheap wins that ride existing infra first, then the domain view-layer that differentiates ATLVS, then platform plumbing, then the large engine/integration builds.

| Phase | Theme | Items | Rough effort |
|---|---|---|---|
| **P0** | Surface what's half-built | #11 Recycle bin · #12 AI usage dash · #3 Kanban→assignments · #13 Record actions · #18 Pre-accept team | ~1–1.5 wks |
| **P1** | Core view layer (domain differentiators) | #1 Gantt · #4 Calendar unification · #5 Workload · #8 Multi-page forms | ~4–6 wks |
| **P2** | Platform polish | #6 Configurable dashboards · #10 Actionable notifications · #17 Inline edit + linked-record UX | ~3–4 wks |
| **P3** | Engines & integrations | #7 Automation engine · #15 MCP server · #14 Enterprise SSO · #16 Vendor onboarding hardening | ~6–9 wks |

---

## 2. Phase P0 — Surface what's half-built

### P0.1 — Recycle bin / restore UI (audit #11)
- **Current:** `restoreOrgScoped(table, id, revalidate)` exists (manager+, idempotent, clears `deleted_at`). No browse surface — restore is undo-toast-only.
- **Target:** `/console/trash` listing soft-deleted rows across `SOFT_DELETABLE_TABLES`, with per-row Restore and an org/type filter; SmartSuite bar = "restore with child objects + cross relationships intact."
- **Build:**
  - New read helper `listTrashed(orgId, table, opts)` in `src/lib/db/resource.ts` — same as `listOrgScoped` but `.not("deleted_at","is",null)`, ordered by `deleted_at DESC`.
  - Route `src/app/(platform)/console/trash/page.tsx` — type selector (subset of `SOFT_DELETABLE_TABLES` that's user-meaningful: projects, assignments, deliverables, invoices, catalog items, clients, leads, vendors, events), `DataTable` of trashed rows, `RowActions` → restore.
  - Reuse existing `restoreOrgScoped`; add cascade-restore note for FK children where a parent restore should re-surface children (assignments↔details siblings) — handle by restoring the parent only and letting detail siblings (1:1 PK = parent id) follow via a small `restoreWithChildren()` wrapper for the known parent→child sets.
  - Nav: add "Trash" under a Governance/Settings section in `nav.ts`.
- **Risk:** low. No migration. **Effort:** 1–2 days.

### P0.2 — AI usage dashboard (audit #12)
- **Current:** `usage_events`/`usage_rollups` populated; metrics `ai.tokens.input/output`, `ai.request`, plus `api.request`, `storage.bytes.*`, `email.sent`, `webhook.delivered`. No read surface.
- **Target:** `/console/settings/usage` — per-org usage with time-bucketed charts (tokens/requests over time, by model), current-period totals, and a Stripe-tie-in hook for usage-based billing later.
- **Build:**
  - Read helpers in `src/lib/usage.ts`: `seriesForMetric(orgId, metric, range)` (from `usage_rollups`), `totalsForPeriod(orgId)`.
  - Route + a lightweight chart island (the repo has no chart lib noted — use a small SVG sparkline/bar component under `src/components/charts/` rather than adding a dep; keep it server-rendered where possible).
  - Surface AI request rate-limit budget (`RATE_BUDGETS.ai = 30/min`) and the 40-turn history window as context.
  - Nav: "Usage" under Settings.
- **Risk:** low. No migration. **Effort:** 2–3 days.

### P0.3 — Kanban for assignments + portal/mobile (audit #3 extension)
- **Current:** `KanbanBoard.tsx` (dnd-kit, optimistic `onMove`) used only by `/console/tasks` over task states.
- **Target:** board view of advancing assignments grouped by `fulfillment_state`, reusing the existing component; touch board on COMPVSS; read-only board on GVTEWAY.
- **Build:**
  - New `AssignmentsKanban.tsx` wrapper mapping `NEXT_FULFILLMENT_STATES` (`src/lib/db/assignments.ts`) to lanes; drag calls a `transitionAssignmentState` action that **must** validate against `NEXT_FULFILLMENT_STATES` server-side (illegal jump → reject) and write an `assignment_events` `state_change` row.
  - Mount on `/console/projects/[projectId]/advancing/assignments` as a view toggle (List ⇄ Board) alongside the existing `DataTable`.
  - COMPVSS `/m/advances`: read board grouped by state (drag limited to roles with write capability). GVTEWAY `/p/[slug]/crew/advances`: read-only lanes.
- **Risk:** low–med (state-machine correctness). No migration — `assignment_events` already exists. **Effort:** 2–3 days.

### P0.4 — Record-action buttons (audit #13)
- **Current:** `RowActions` + server actions exist; no inline "create related record / open prefilled form" affordance on detail pages.
- **Target:** declarative action buttons on detail pages (e.g. on an assignment: "Issue credential", "Add travel leg"; on a project: "New assignment").
- **Build:** small `<RecordActionButton action={...} prefill={...}>` that posts a server action or links to a `/new?prefill=` form; thread `prefill` through the existing FormShell new-record pages. No schema. **Effort:** 1–2 days. **Risk:** low.

### P0.5 — Pre-acceptance team/role assignment (audit #18)
- **Current:** role/persona resolved at invite acceptance (`accept_invite` RPC); manual pre-set only via direct DB writes.
- **Target:** when an owner/admin creates an invite, set intended `role` + `persona` (+ optional project membership) on the invite row so it's applied automatically on acceptance.
- **Build:** extend the invite-creation form/action + `invites` row columns if missing (likely already carry `role`/`persona`); ensure `accept_invite` copies them through. Possibly a tiny migration to add `persona`/`project_id` to `invites` if absent. **Effort:** 1 day. **Risk:** low.

---

## 3. Phase P1 — Core view layer

### P1.1 — Gantt / timeline with baselines (audit #1) ⭐ headline
- **Current:** no timeline view. `projects.start_date/end_date` (nullable dates), `projects.xpms_phase`/`project_state`; `xpms_atoms` (WBS) with `phase`, `state`, `sequence_no`, `identifier`, `project_id`, `quantity`. Assignments carry `atom_id` + `deadline`.
- **Target:** project timeline showing WBS atoms as bars across a date axis, dependency-aware, with **baselines** ("save original plan, watch reality drift") and PDF/PNG export with a chosen date range (ClickUp parity).
- **Schema (migration `…_xpms_atom_scheduling.sql`):**
  - Add to `xpms_atoms`: `planned_start date`, `planned_end date`, `actual_start date`, `actual_end date` (nullable). (Atoms today have phase/state but no dates — required for a Gantt axis.)
  - New `xpms_atom_dependencies` (`id, org_id, project_id, predecessor_atom_id, successor_atom_id, dep_kind` enum `finish_to_start|start_to_start|finish_to_finish|start_to_finish`, RLS org-scoped) — for dependency lines.
  - New `project_baselines` (`id, org_id, project_id, name, captured_at, captured_by`) + `project_baseline_atoms` (snapshot of each atom's planned_start/end at capture). Baseline capture = SECURITY DEFINER RPC `capture_project_baseline(p_project_id, p_name)` that copies current atom dates.
  - All new tables in `SOFT_DELETABLE_TABLES` if they get `deleted_at`; RLS per canon.
- **Lib:** `src/lib/db/gantt.ts` — `listProjectTimeline(orgId, projectId)` (atoms + dates + deps), `listBaselines`, `diffAgainstBaseline(baselineId)` (variance per atom).
- **Component:** `src/components/views/GanttChart.tsx` — SVG/CSS-grid timeline (avoid heavy deps; mirror the in-house approach used by CalendarView). Bars by atom, ghost bars for selected baseline, dependency arrows, drag-to-reschedule writing `planned_start/end` via an action validated against deps. Export via server-side render to PNG/PDF over a date range (reuse any existing export util; otherwise canvas/Satori).
- **Routes:** `/console/projects/[projectId]/timeline/page.tsx` (+ baseline capture/select control). View toggle alongside existing schedule.
- **Nav:** add "Timeline" tab to the project detail tabs.
- **Effort:** 1.5–2.5 wks. **Risk:** med (export + dependency math). Largest single P1 item.

### P1.2 — Calendar unification + portal/mobile (audit #4 extension)
- **Current:** `CalendarView.tsx` powers `/console/schedule` with drag-to-reschedule; not wired to `events`/`availability_slots` broadly, no portal/mobile surface.
- **Target:** one calendar consuming `events` (`starts_at/ends_at/event_state`), `availability_slots` (`starts_at/ends_at/kind/tier`), assignment `deadline`s, and event-guide set times — with read-scoped portal (`/p/[slug]/schedule`) and mobile (`/m/schedule`) variants auto-filtered to persona.
- **Build:**
  - `src/lib/db/calendar.ts` — `listCalendarItems(orgId, {projectId?, range, sources[]})` normalizing events/availability/deadlines into one `{id, title, start, end, kind, href}` shape.
  - Reuse `CalendarView.tsx`; add source-filter chips. Drag-reschedule writes back to the source table (events → `events.starts_at/ends_at`; availability → slot). Mount `RealtimeRefresh` on `events`/`availability_slots`.
  - Portal/mobile: read-only (no drag), filtered by persona scope.
- **Effort:** 1–1.5 wks. **Risk:** low–med. No migration (columns exist).

### P1.3 — Workload / capacity view (audit #5)
- **Current:** no view. Substrate: `crew_members` (id, user_id, day_rate), `assignments` (party_crew_id/party_user_id, deadline, `catalog_kind='labor'`), `time_entries` (user_id, started_at/ended_at, duration_minutes, atom_id), `availability_slots`.
- **Target:** per-person committed-vs-capacity over a date range, with **layered grouping** (by project / role / department) — ClickUp "Workload View Layers" parity. Surfaces over-/under-allocation for crew planning.
- **Schema:** likely none for v1 (derive from existing). Optional `crew_members.weekly_capacity_hours` (default 40) to define the denominator — small migration `…_crew_capacity_hours.sql`.
- **Lib:** `src/lib/db/workload.ts` — `computeWorkload(orgId, {range, groupBy})`: join crew→assignments (labor) + time_entries, bucket hours per person per day/week, overlay availability holds, return rows with capacity %.
- **Component:** `src/components/views/WorkloadGrid.tsx` — people × time-bucket heat grid; group-by switch (project/role/dept); click-through to person assignments (`/console/people/[personId]/assignments`).
- **Route:** `/console/people/workload/page.tsx`. Nav under Workforce.
- **Effort:** 1–1.5 wks. **Risk:** med (allocation math, timezone bucketing).

### P1.4 — Multi-page public forms (audit #8)
- **Current:** `FormShell` single-page; public intake (`open_call_submissions`, `job_applications`) are one-page `<textarea>`/`<input>` + Zod.
- **Target:** multi-page forms (up to ~10 pages) with progress bar (dots/numbers), optional review-before-submit page, configurable thank-you/redirect on submission, and linked-record-as-table display — SmartSuite Forms parity. Targets: open-call submissions, job applications, vendor onboarding/RFQ responses, guest intake.
- **Build:**
  - `src/components/forms/MultiStepForm.tsx` — client wrapper around `FormShell`'s state model: holds page array, renders one page at a time, `ProgressBar` (primitive exists), Next/Back/Review/Submit, persists field values across pages (client state) and submits the union as one `FormData`. Review page renders grouped answers with per-page edit jump.
  - Submission config: `thank_you_message` / `redirect_url` per public form — store on the owning entity (e.g. `open_calls`, `job_postings`) via small column adds, or a generic `form_configs` table if we want a reusable builder. **Recommend** per-entity columns for v1 (`…_form_config jsonb`) to avoid premature form-builder scope.
  - Apply to `/marketplace/calls/[slug]/submit` and `/gigs/[slug]/apply` first.
- **Effort:** 1–1.5 wks. **Risk:** low–med (cross-page validation). Migration: small jsonb column adds.

---

## 4. Phase P2 — Platform polish

### P2.1 — Configurable dashboards / widgets (audit #6)
- **Current:** per-module static `MetricCard` grids (e.g. `/console/marketplace`); `/console/dashboards` is a saved-view registry, not a builder. No drag-to-arrange.
- **Target:** composable role dashboards — Kanban widget, calendar widget, metric widget, list/table widget, chart widget — placeable on a grid. Plus ClickUp "My Tasks Hub" (Today/Overdue/Personal) for `/me` and `/m/feed`.
- **Phasing (avoid over-build):**
  - **v1 (fixed-layout role dashboards):** ship opinionated dashboards per role (Owner/Producer/Controller/Crew) composed of existing widgets — cheap, high value. "My Tasks Hub" is the `/me` instance.
  - **v2 (user-arrangeable):** `dashboards` + `dashboard_widgets` tables (`org_id, owner_user_id|role, widget_kind, config jsonb, grid_x/y/w/h`), drag-to-arrange grid, widget config modals. SmartSuite "scripting/filter-state subscriptions" is explicitly out of scope.
- **Build:** `src/components/dashboard/` widget registry; each widget is a server component reading via existing helpers. Migration only for v2.
- **Effort:** v1 ~1 wk; v2 ~1.5–2 wks. **Risk:** med (layout persistence, perf of many widgets).

### P2.2 — Actionable notifications (audit #10)
- **Current:** push is informational. `service-worker.js` shows notification + navigates on click; **no `actions` array**. `sendPushTo`/`sendPushBulk` honor per-kind opt-out; `notifications` row is SSOT.
- **Target:** clickable actions in the notification (Approve / Reject / Accept) that mutate a record without opening the app — SmartSuite "actionable notifications" parity. E.g. approve a deliverable, accept an assignment, approve time-off (`approve_time_off_request` RPC already exists).
- **Build:**
  - Extend `PushPayload` with `actions?: {action, title, endpoint, method, body}[]`; include in `showNotification(...{actions})` in `service-worker.js`.
  - `notificationclick` handler: branch on `event.action`; `fetch()` a signed action endpoint under `/api/v1/notifications/actions/*` (Zod-validated, `withAuth`, capability-gated, idempotent). On success, close + optional toast.
  - Action endpoints reuse existing RPCs/server logic (deliverable approve, assignment accept, time-off approve). Cap action set to a safe allowlist per `PushKind`.
- **Effort:** 1–1.5 wks. **Risk:** med (auth from SW fetch; idempotency; cross-browser action support — degrade gracefully where unsupported). Migration: none.

### P2.3 — Inline edit undo/redo + linked-record UX (audit #17)
- **Current:** `DataTableInteractive.tsx` is rich (sort/filter/pin/group/CSV) but read-oriented; no inline edit/undo.
- **Target:** inline cell editing in DataTable with undo/redo, and improved linked-record selection (modal + inline table display — SmartSuite "Linked Record Enhancements").
- **Build:** opt-in `editable` column config + an edit action per table; client-side undo/redo stack; linked-record picker reusing `Combobox`/`MultiCombobox`. Scope to a few high-value tables first (assignments, catalog items) rather than universal.
- **Effort:** 1–1.5 wks. **Risk:** med. Lower priority within P2 — sequence last.

---

## 5. Phase P3 — Engines & integrations

### P3.1 — No-code automation engine (audit #7) ⭐ largest build
- **Current:** triggers are hard-coded (push fan-out on insert/transition). No user-defined "when X → do Y".
- **Target:** rule builder — trigger (record created/updated, state entered, schedule/hourly) → conditions → actions (update field, create record, send push/email, create assignment, loop over a list field — SmartSuite "Loop Over Field Values"). Plus the email send-limit safeguard.
- **Schema (`…_automations.sql`):**
  - `automations` (`id, org_id, name, trigger_kind, trigger_config jsonb, is_active, created_by`), `automation_conditions`, `automation_actions` (ordered, `action_kind`, `config jsonb`), `automation_runs` (audit: trigger payload, per-action result, `run_state`). RLS admin+ write, org read.
  - Email-send daily cap per plan tier (counter in `usage_events` `email.sent` — already metered).
- **Execution:**
  - DB-trigger automations: Postgres triggers / Supabase Realtime → an edge function or a Next route `/api/v1/automations/dispatch` that evaluates conditions and runs actions (idempotent, logged to `automation_runs`).
  - Scheduled automations: a cron (the env exposes scheduled-task tooling) hitting the dispatch route hourly; overlap prevention via a run lock (ClickUp "hourly scheduling, overlap prevention").
- **Build:** `src/lib/automations/` (types, condition evaluator, action executors), console UI `/console/settings/automations` (list + builder + run history). Start with a **fixed action allowlist** (no arbitrary code) for safety.
- **Effort:** 3–4 wks. **Risk:** high (execution semantics, infinite-loop guards, idempotency, security of actions). Build last; scope actions conservatively.

### P3.2 — MCP server for ATLVS data (audit #15)
- **Current:** clean API (`apiOk/apiCreated/apiError/parseJson`, `withAuth`) with PAT auth (`sk_*` Bearer tokens) already supported.
- **Target:** an MCP server exposing read (and curated write) tools over the ATLVS API so power users drive ATLVS from external AI clients — SmartSuite "Local MCP Server" / ClickUp "in ChatGPT / in Cursor" parity.
- **Build:** standalone MCP server package (`@anthropic-ai/mcp`-style) that authenticates with a user's PAT and wraps existing `/api/v1/*` endpoints as tools (list/get/create for projects, assignments, deliverables, tasks; search). RLS enforced server-side via the PAT's session — no new auth surface. Ship read-first; gate writes behind capability checks already in the API. Document install in `docs/`.
- **Effort:** 1.5–2 wks. **Risk:** low–med (it's a thin wrapper; main risk is scope creep on tool coverage). No migration.

### P3.3 — Enterprise SSO (audit #14)
- **Current:** Supabase email/password + PAT only. No SAML/OIDC.
- **Target:** SAML/OIDC SSO with custom post-logout redirect (SmartSuite "SSO Logout URL"), for enterprise/agency accounts.
- **Build:** enable Supabase Auth SSO (SAML 2.0) at the project level; add org-level SSO config (`org_sso_connections` table: `org_id, provider, metadata_url/entity_id, domain, logout_redirect_url`), domain-based routing in `(auth)` shell, and post-logout redirect honoring `logout_redirect_url`. Map IdP claims → membership role/persona on first login (JIT provisioning).
- **Effort:** 1.5–2.5 wks. **Risk:** med (IdP testing matrix, JIT provisioning, session cookie domain `.atlvs.pro`). Enterprise-tier feature — schedule by sales need.

### P3.4 — Vendor onboarding / risk hardening (audit #16)
- **Current:** GVTEWAY vendor persona + `account_manager_assignments` (lazy DM rooms) + RFQ compliance gates (`requires_prequalification/insurance/w9`, `nda_required`).
- **Target:** structured onboarding/due-diligence flow with status tracking — extend, don't rebuild. (Borrow SmartSuite's *audit-trail rigor*, not the SOX/TPRM products.)
- **Build:** vendor onboarding checklist (reuse new-hire-flow pattern from Connecteam parity, repointed to vendors), document collection via the multi-page form (P1.4) + `proposals`/`branding` storage buckets, and a compliance-status rollup on the vendor record. Surface in `/console/procurement/vendors/[id]` and the vendor portal.
- **Effort:** 1–1.5 wks. **Risk:** low (composes existing primitives). Schema: small `vendor_onboarding_*` or reuse `new_hire_flows` generalized.

---

## 6. Migration sequence (proposed)

Applied via Supabase MCP `apply_migration`, timestamped after `20260613170000`:

1. `…_xpms_atom_scheduling.sql` — atom planned/actual dates, `xpms_atom_dependencies`, `project_baselines` (+ baseline-atoms), `capture_project_baseline` RPC. *(P1.1)*
2. `…_crew_capacity_hours.sql` — `crew_members.weekly_capacity_hours`. *(P1.3)*
3. `…_public_form_config.sql` — per-entity form-config jsonb columns. *(P1.4)*
4. `…_invite_pre_assignment.sql` — `invites.persona`/`project_id` if absent. *(P0.5)*
5. `…_dashboards.sql` — `dashboards` + `dashboard_widgets` (P2.1 v2 only).
6. `…_automations.sql` — automations/conditions/actions/runs. *(P3.1)*
7. `…_org_sso_connections.sql` — enterprise SSO config. *(P3.3)*
8. `…_vendor_onboarding.sql` — onboarding flow (or generalize `new_hire_flows`). *(P3.4)*

Each migration: enable RLS + the canonical `is_org_member`/`has_org_role` policy pair, add FK indexes (per the `0050`/`fk_indexes` discipline), `touch_updated_at` triggers, and respect LDP naming. Regenerate `database.types.ts` via MCP `generate_typescript_types` after each.

---

## 7. Cross-cutting deliverables (every phase)

- **Tests:** extend `src/lib/ldp-naming-canon.test.ts` coverage for new tables; unit-test state-machine/automation evaluators and workload/Gantt math.
- **Smoke:** add new routes to `scripts/compvss-smoke.mjs` (page-render × role) and new mutations to `scripts/compvss-actions-smoke.mjs` (RLS-gated).
- **Validate gate:** `/validate` green before each merge (typecheck, lint, test, build, brand SSOT, URL canon, LDP, unsafe-cast).
- **Nav parity:** every new console module added to both `platformNavDomain` and `platformNavXpms`.
- **Docs:** ADR for any architecturally significant choice (automation execution model, dashboard persistence, SSO provisioning).
- **Three-shell discipline:** view-layer features (Gantt/Calendar/Kanban/Workload) ship the ATLVS authoring surface first, then read-scoped GVTEWAY/COMPVSS variants where the audit calls for them.

---

## 8. Deferred to backlog (explicitly out of scope here)

| Audit # | Feature | Why deferred | Re-entry note |
|---|---|---|---|
| #2 | **Autonomous AI agents** (Super Agents, scheduled agents, agent access control + audit logs) | Strategic, large; needs its own design phase. AI chat substrate (`ai_conversations`/`ai_messages`, streaming, usage metering) is the foundation it will build on. | Revisit after P0–P2 land; the AI usage dashboard (P0.2) and automation engine (P3.1) are natural precursors. |
| #9 | **AI notetaker / meeting summaries** (record/transcript/summary, link-share) | Heavy media-infra integration (recording, transcription); lower domain-criticality than the view layer. | Pairs with #2; sequence after agents. Adopt the independent keep-recording/transcript/summary toggles when built. |

---

*End of plan. No code modified.*
