# Surface Spec #1 — Projects

**Shell:** ATLVS · **Route:** /console/projects (list) + /console/projects/[projectId]/\* (detail)
**Status:** **Approved — 2026-05-24** · accent direction locked to ATLVS pink (C1) · theme locked to Bermuda Triangle only (C3)
**Implementation note:** This spec references accent by token (`--org-primary`) and shadow / surface conventions by Bermuda canon (cream surfaces, 3px ink border, 8px shadow reserved for Dialog). No surface-spec rewrites needed when the accent hex moves from red-600 to a true pink in the token-swap PR.

## 1. Data class & lifecycle

| Item                       | Value                                                                                                                                                                                                 |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Conceptual XPMS class      | **0 EXECUTIVE — Strategy** (per `docs/decisions/ADR-0004-xpms-native-nav.md` Axis A)                                                                                                                  |
| Primary lifecycle owner    | **`project_phase`** (canonical LDP name) — implemented today as `projects.xpms_phase` (`discovery → concept → development → advance → build → show → strike → wrap`)                                  |
| Secondary lifecycle column | `projects.project_state` (`draft / active / paused / archived / complete`) — operational gate, distinct axis from phase per LDP audit §1                                                              |
| Tier relevance             | Not tier-scoped at the row level. `projects.geographic_scope`, `projects.tour_structure`, `projects.production_style` are project metadata, surfaced in detail but not the primary axis.              |
| Authority docs             | `docs/decisions/ADR-0001-three-shell-topology.md`, `docs/decisions/ADR-0004-xpms-native-nav.md`, `reports/LDP_LIFECYCLE_AUDIT.md` §1, `src/lib/xpms/index.ts` (XPMS_PHASES), `src/lib/db/projects.ts` |

**Two-axis truth.** Phase = "where in the event arc are we" (time-bounded macro arc, sequential, gated). State = "is this project active / paused / archived" (operational, cyclical). The current detail layout already mounts `PhaseStepper`; the list page currently exposes only state. **The list must surface both, on independent visual axes.**

## 2. SaaS parity targets

Specific patterns to match or exceed. Generic praise omitted.

| Product          | Specific pattern to match                                                                                                   | Why it applies                                                                                                                                                                                                |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Linear           | Cycle view: kanban-like board grouped by cycle (phase), per-row health chip, ⌘K jump to any project from any context        | Phase is our cycle. Linear's cycle view is the cleanest "time-bounded macro arc" UI in shipping SaaS. ⌘K already exists via `CommandPalette.tsx` — needs project-aware search.                                |
| Asana            | Portfolio timeline: horizontal rollup of projects across a date window, one bar per project tinted by status                | Operators with 30+ projects need a portfolio-rollup view. Today there is none — the heatmap on the list is fine for portfolio _health_, not portfolio _timeline_.                                             |
| Monday           | Group-by header strip with collapse + per-group rollup row (count, sum of budget, avg %) at the top of each lane            | Group-by exists in `DataTableInteractive`; collapsed group headers with rollups are missing.                                                                                                                  |
| Stripe Dashboard | The "object detail" pattern: 2-col layout with primary record left, audit trail + activity right, status pill in top chrome | The detail page (`/console/projects/[id]/page.tsx`) is close but does not pin status to the top chrome — phase steppe runs across full width above the tab strip, while `project_state` lives in a hero card. |

**Rejected references:** Notion (database-of-databases is wrong abstraction; project is a typed concept not a Notion DB). Trello (too flat). Smartsheet (too gantt-anchored — over-rotates toward dates).

## 3. Primary view

**Phase Board (Kanban grouped by `project_phase`).** Default for ATLVS users with ≥2 active projects.

Why this is the 80% view:

- The single business decision a producer makes on this page daily is **"which projects am I gating into the next phase this week?"** — a sequential-state board answers that directly. A table sorted by `updated_at` (today's default) answers a different, weaker question ("what changed?").
- Phase is the discoverable lifecycle for non-engineers (8 columns named in plain English). State is a 5-value pill that supports operational filters but doesn't carry decision weight in the daily standup.
- KanbanBoard primitive is already shipped and used in tasks/incidents/punch — the proven pattern.
- The current ProjectPortfolioGrid (health heatmap) collapses to a single hero metric strip above the board — kept for portfolio-health-at-a-glance, not as the default.

Lane layout:

- 8 lanes left-to-right: `1 Discovery · 2 Concept · 3 Development · 4 Advance · 5 Build · 6 Show · 7 Strike · 8 Wrap`.
- Lane header carries: phase number dot (mirroring `PhaseStepper` visual language), phase name, count of cards, sum of `budget_cents` in that lane formatted compact (`$1.2M`).
- Each card shows: project name, slug (mono, secondary), 1-line description (truncated to 2 lines), state pill (right-justified, small), end_date relative ("12d left" / "3d over"), budget compact.
- Card tinting: lane interior unchanged; per-card border-left 2px in the computed-health color from `ProjectPortfolioGrid.computeHealth()` (green/amber/red). Health drives card decoration, **not** lane decoration — phase is the column, health is the per-row signal.
- Drag-drop: only adjacent-phase moves allowed (forward to next, back to previous). Cross-lane drops outside that pair revert with a toast "Skip phases via the detail page — log the reason in the transition note." Mirrors `production_phase` graph guard pattern in `src/lib/production-phase.ts`.

## 4. Secondary views

Every secondary view must answer a real workflow. Reject views the library supports but the workflow does not need.

| View       | When operator uses it                                                                                                                                                                                                            | Source data signal                                         | Verdict    |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------- |
| `table`    | Bulk admin (archive, re-assign client, reseat venue). Group-by `project_state`, then `project_phase`. Column-pin first column (Name).                                                                                            | Current default — kept as the second view for power users. | **Accept** |
| `timeline` | Portfolio-window view: "what's running across May, June, July?" Each project is a bar from `start_date` to `end_date`, tinted by health. Click-through to detail.                                                                | `projects.start_date`, `end_date`                          | **Accept** |
| `map`      | Multi-venue projects: pin each project at its `primary_venue_id` location. Operators with simultaneous-multi-city tours need this — `projects.tour_structure='simultaneous_multi_city'` exists in the schema and has no surface. | `projects.primary_venue_id` → `venues.lat/lng`             | **Accept** |
| `calendar` | Reject. Date model is start/end span, not single-date events. Calendar grid degrades to "project X spans May" cells — a worse Timeline.                                                                                          | n/a                                                        | **Reject** |
| `gallery`  | Reject. No primary thumbnail. Branding is per-project but is a logo, not a hero image.                                                                                                                                           | n/a                                                        | **Reject** |
| `tree`     | Reject. Projects do not nest. Programs (separate table, separate route) handle the rollup.                                                                                                                                       | n/a                                                        | **Reject** |
| `list`     | Reject. Mobile-primary view for crew/PA, but ATLVS console is not mobile-primary. Personal `/me/projects` (out of scope this surface) is where the list view lands.                                                              | n/a                                                        | **Reject** |

Allowed set: `["board", "table", "timeline", "map"]`. Default: `board`. Use `<DataViewSwitcher allowed={…} defaultView="board">` in the `ModuleHeader.action` slot. Persisted in URL via `?view=`.

## 5. Lifecycle visualization

Two visualizations, two purposes. **Same pattern as every other surface that shares this lifecycle, locked here.**

| Surface element                | Pattern                                                                                                                                                                                                                        | Visual                                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| List page chrome (board mode)  | The 8 lanes ARE the phase stepper. No separate stepper above.                                                                                                                                                                  | KanbanBoard lanes ordered left-to-right `1 → 8`, numbered dot reused from `PhaseStepper` styling. |
| List page chrome (other views) | Compact horizontal `<PhaseStepper compact />` in `ModuleHeader.subtitle` slot, no `currentPhase` (all dots muted; surface is portfolio-wide, not project-scoped). Doubles as a legend for the colors used in the timeline/map. | `<PhaseStepper compact />` (already supports the `compact` prop, no API change)                   |
| Per-row state pill             | `<StatusBadge status={p.project_state} />` (existing primitive). Right-justified.                                                                                                                                              | Pill — distinct shape from the phase numbered-dot to keep axes separate.                          |
| Per-row health dot             | 8px filled circle, left of project name. Tints: green = on_track, amber = watch, red = at_risk. Color from `computeHealth()` rule in `ProjectPortfolioGrid.tsx` extracted to `src/lib/projects/health.ts`.                     | Borrowed dot pattern from Linear's project health.                                                |
| Detail page chrome             | **Unchanged** — `<PhaseStepper currentPhase={…} projectId={…} />` already mounted in `[projectId]/layout.tsx`. Surface ensures the project list and project detail use the same phase-color vocabulary.                        | Existing.                                                                                         |

Phase advancement from the board is **forward-one-lane only**. Forward-multi or backward requires the detail page so the operator authors a transition reason (`production_phase_transitions` log pattern from `src/lib/production-phase.ts` is the parallel; a `project_phase_transitions` table is recommended in the LDP audit and assumed pending — spec does not require it to ship before the list-board, but does require the detail page to expose the reason field in the forward-advance dialog).

## 6. RBAC affordances

Pulled from `requireSession()` + `hasOrgRole()` helpers (`src/lib/auth.ts`). Rule per action: pick exactly one of **shown** / **hidden** / **disabled-with-tooltip**.

| Action                               | Owner | Admin | Manager | Member                                             | Treatment                                                                                                                                                                                                                                                     |
| ------------------------------------ | ----- | ----- | ------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| View list                            | ✓     | ✓     | ✓       | ✓ (scoped to their projects via `project_members`) | **Shown.** Member sees fewer cards, same layout. Empty state copy differs for member ("No projects assigned. Ask an admin to add you to a project.").                                                                                                         |
| Open detail                          | ✓     | ✓     | ✓       | ✓ (member only if `project_members` row exists)    | **Shown.** RLS-gated, returns 404 if not a member.                                                                                                                                                                                                            |
| Create project                       | ✓     | ✓     | ✓       | —                                                  | **Hidden** for member. (`+ New Project` button not rendered.) Empty state CTA also hidden for member.                                                                                                                                                         |
| Drag-drop forward phase advance      | ✓     | ✓     | ✓       | —                                                  | **Disabled-with-tooltip** for member: "Phase advances are a manager action." Drag is intercepted, toast confirms hold. (Hidden affordance on a board card feels broken — the card looks identical regardless of role; disabled-with-tooltip preserves shape.) |
| Drag-drop backward phase regression  | ✓     | ✓     | —       | —                                                  | **Disabled-with-tooltip** for manager + member: "Backward phase transitions require admin sign-off in the detail page."                                                                                                                                       |
| Archive project                      | ✓     | ✓     | —       | —                                                  | **Hidden** for manager + member. (Archive is destructive enough that the affordance shouldn't leak.)                                                                                                                                                          |
| Bulk re-state (e.g. activate paused) | ✓     | ✓     | —       | —                                                  | **Hidden** for manager + member. Bulk actions menu does not render the action.                                                                                                                                                                                |
| Edit budget on card                  | —     | —     | —       | —                                                  | **Not on this surface.** Budget editing is detail-page-only.                                                                                                                                                                                                  |

`hide` vs `disable` rule: if the affordance is **inline within a uniform row layout** (drag handle, action menu), prefer `disable-with-tooltip` so the row geometry stays predictable. If the affordance is **standalone chrome** (`+ New Project` button, bulk-action dropdown), prefer `hide` so role unscrambling doesn't leak intent.

## 7. Empty / loading / error states

Concrete copy. No lorem.

| State                                 | Copy                                                                                                                                                                                                                                     | Visual                                                                                                   |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Empty — no projects (owner/admin)     | Title: "No Projects Yet" · Body: "A project is the top-level container for events, deliverables, invoices, and crew. Start one to get the rest of the platform on the rails." · CTA: "Create Your First Project" → /console/projects/new | `<EmptyState>` primitive. Center-aligned in `page-content`. No board lanes rendered while empty.         |
| Empty — no projects (manager)         | Same as above, identical CTA.                                                                                                                                                                                                            | Same.                                                                                                    |
| Empty — no projects (member)          | Title: "Nothing Assigned Yet" · Body: "You'll see projects here once an admin invites you to one. In the meantime, your tasks live in /me." · CTA: "Open My Workspace" → /me                                                             | `<EmptyState>`. No "create" CTA — member can't.                                                          |
| Empty lane (board mode, has projects) | Lane shows a single muted line: "No projects in this phase." No drop-target placeholder graphic — the empty lane IS the drop target.                                                                                                     | Inline text inside `KanbanLane`. Lane stays full height so the column count is constant.                 |
| Loading                               | Server-rendered with `force-dynamic`, so the page itself does not stream. Suspense boundary around the view switcher delivers `<PageSkeleton variant="table" rows={6}>` while a router-replace `?view=` swap is in flight.               | Existing primitive; one boundary at the data-fetch root of each view.                                    |
| Error (data fetch fails)              | `<Alert variant="error">` above the chrome: "Couldn't load projects. The data layer returned an error. Refresh in a moment, or open ⌘K → 'system status' to check." Console: full error to Sentry.                                       | `<Alert>` primitive. Below-fold board renders the empty-state copy so the page is never a wall of error. |
| Drag-drop optimistic failure          | Toast (sonner): "Couldn't advance {project_name} to {phase_name}. The change was rolled back." Card visually snaps back to original lane.                                                                                                | `KanbanBoard` already supports the snap-back pattern via the rejected-promise contract in `onMove`.      |
| Phase-skip drop rejection             | Toast: "Skip phases via the detail page — log a reason in the transition note." Card snaps back.                                                                                                                                         | Same.                                                                                                    |

## 8. Bulk actions, filters, saved views, keyboard nav

| Capability      | Spec                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bulk actions    | Table view only (multi-select doesn't translate cleanly to a board with adjacent-only drag). Actions: Set state (active/paused/archived/complete), Set primary venue, Set client, Export selected to CSV. Owner+admin only.                                                                                                                                                                                                       |
| Filters         | Filter chips strip below `ModuleHeader`, above the view. Chips: phase (multi), state (multi), client (typeahead), primary venue (typeahead), health (green/amber/red), date range (`start_date`/`end_date` overlap), tour_structure (single). State syncs to URL (`?phase=…&state=…&client=…&health=…`). Chips persist across view switch.                                                                                        |
| Saved views     | `<SavedViewSelector>` left of `<DataViewSwitcher>` in the action slot. Persisted to `view_configs` (table already exists per `src/lib/db/view-configs.ts`). Each saved view captures: view kind, filter chip values, group-by, sort. Per-user with optional "Share with org" toggle (owner/admin only). Default views: "Active Productions" (phase ≥ 4 AND state = active), "At Risk" (health = red), "All".                      |
| Keyboard nav    | ⌘K opens command palette (already shipped — `CommandPalette.tsx`). Add project-aware action: typing a project name shows top 5 matches with phase chip; Enter opens detail. `[` and `]` switch view. `g` then `p` from anywhere returns to /console/projects. Arrow keys in board mode move between cards; Enter opens detail; ⌘+→ / ⌘+← move card forward / back one phase (within RBAC rules — disabled keystroke shows toast). |
| Hover           | Card hover: 2px lift via `--hover-lift-y` token (already wired). Lane hover when a card is being dragged: highlight only adjacent-allowed lanes; gray out illegal lanes.                                                                                                                                                                                                                                                          |
| Drag affordance | Whole card is the drag handle. Drag-cursor is the platform default. No persistent drag handle icon — Linear pattern.                                                                                                                                                                                                                                                                                                              |

## 9. Mobile / narrow viewport behavior

ATLVS console is desktop-primary. At ≤ `--breakpoint-md` (768px):

- View switcher collapses to a single chip (current view) + popover with the other options.
- Board mode degrades to a horizontal-scroll lane strip with snap-to-column; each lane is min-width 280px. Cards keep full content.
- Table mode hides the slug, end_date, and budget columns (already supported by `DataTable` `defaultHidden` flag); name + state + phase pill stay.
- Timeline mode collapses to a vertical stacked list grouped by week, since the horizontal axis is the value and a horizontal scroll on a phone defeats it.
- Map mode is hidden (replaced with a "Use a larger screen for the map view" affordance) — pinning 30 markers on a 375px viewport produces a useless cluster.
- Filter chip strip wraps; saved-view selector moves to a sheet (`<Sheet>` primitive).
- ⌘K becomes a tap-to-open search button in the header.

`/me/projects` (out of scope this spec) is the mobile-primary surface for non-operators. Operators on the road use COMPVSS, which has its own per-project surfaces (`/m/ros`, `/m/advances`, `/m/punch`).

## 10. Surface composition

What ships at the file level when Phase 2 lands. Detail-level call-site code is out of scope here; spec calls out which existing files change vs which new ones land.

| Path                                                           | Change                                                                                                                                                                               |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/app/(platform)/console/projects/page.tsx`                 | Add view resolver, mount `<DataViewSwitcher>`, branch render between Board / Table / Timeline / Map.                                                                                 |
| `src/app/(platform)/console/projects/ProjectPortfolioGrid.tsx` | Repositioned to a top hero strip in board view only. Other views drop the strip.                                                                                                     |
| `src/app/(platform)/console/projects/PhaseBoard.tsx`           | **New.** Wraps `KanbanBoard` with the 8 phase lanes, the adjacent-only drop rule, and the per-card chrome.                                                                           |
| `src/app/(platform)/console/projects/PortfolioTimeline.tsx`    | **New.** `TimelineView` driven by `start_date` / `end_date` per project.                                                                                                             |
| `src/app/(platform)/console/projects/PortfolioMap.tsx`         | **New.** `MapView` driven by joined `primary_venue_id` → `venues`.                                                                                                                   |
| `src/app/(platform)/console/projects/FilterChips.tsx`          | **New.** Chip strip + URL state.                                                                                                                                                     |
| `src/lib/projects/health.ts`                                   | **New.** Extracts `computeHealth()` from the existing client component so it can be shared by table cells, board cards, timeline tints, and map markers. Pure function, no React.    |
| `src/lib/db/projects.ts`                                       | Add `advanceProjectPhase(orgId, projectId, toPhase, reason)` that mirrors `transitionProductionPhase()` pattern from `production-phase.ts`. Server-action wrapper at the page level. |
| `src/components/views/KanbanBoard.tsx`                         | **No change.** Phase board uses it as-is.                                                                                                                                            |
| `src/components/xpms/PhaseStepper.tsx`                         | **No change.** Reused in table-view subtitle via existing `compact` prop.                                                                                                            |

## 11. Acceptance — the business decision the surface exists for

Phase 2 lands a test asserting **the primary business decision works in ≤3 keystrokes from any console route**:

- ⌘K → "advance MMW26 to advance" → Enter ⇒ project advances one phase (or shows the disallow toast with reason).

Plus per the brief's pattern ("operator can advance a deliverable from `in_review` to `approved` in ≤2 clicks"):

- From /console/projects (board view), drag-drop card from Development → Advance ⇒ confirm dialog appears with reason field, save ⇒ card lives in Advance lane, `project_phase_transitions` row written (or, while that table is pending, `audit_log` row written).

## 12. Resolutions — 2026-05-24

Future-proof resolutions to every §12 question. Spec is implementation-ready.

1. **Phase=wrap auto-sets state=complete?** **NO.** Phase and state are independent axes by design (LDP §1 → §1 phase-vs-state separation). Auto-coupling would collapse the two-machine separation that LDP P1 explicitly preserves. Instead: server action surfaces a confirm dialog when advancing to `wrap` ("Mark project as `complete` too?" — checkbox, default-checked) but stores them as **two distinct `audit_log` rows** if the operator opts in. The detail page also exposes `project_state` as an independent control. A `project_phase_transitions` row records the phase move; a separate `audit_log` row records the state move when it happens. Future flexibility: a wrap-phase project can remain `paused` indefinitely (financials open).
2. **Backward phase regression on the board?** **Never on the board.** Detail page only, owner/admin only, requires a `reason` textarea. Reasoning: backward regression is an exception event with a story attached. Board affordances reflect the common case. Consistency with Surface #2 (same rule for `production_phase`). Future flexibility: the policy is enforced in `advanceProjectPhase()` server action via the same `production_phase_advance_policy` table introduced by Surface #2 (see resolution #7 there) — schema-driven, so the rule can shift without code edits.
3. **Member visibility floor?** **RLS scopes /console/projects strictly via `project_members`.** Engagement-table-based visibility (talent_offers, etc.) belongs in `/me`, not `/console`. Reasoning: the shell boundary IS the visibility boundary in a slug-scoped-portal architecture — leaking engagement data into the console blurs which shell owns which view. Future flexibility: when the unified `engagement_state` column lands (per LDP §5 remediation), `/me/projects` becomes the consolidator surface; `/console/projects` stays operator-scope.
4. **Health computation extension?** **YES, but pluggable.** Extract `computeHealth()` into a function that reads from the existing `v_xpms_atom_rollup_recursive` view (already aggregates `tasks_done_rollup`, `deliverables_open_rollup`, `variance_cost_cents_rollup`, `descendant_count`). The health rule reads ONE view, not N tables. Tomorrow when more rollups land (open incidents, blocked POs), they go into the view first; `computeHealth()` opts in via a single line. File: `src/lib/projects/health.ts`. Pure function, no React, no Supabase imports — takes the rollup row as input.
5. **Saved views default set?** **Ship the three defaults as-spec'd.** Add a "Restore Defaults" affordance in the saved-view menu. Defaults are versioned via a string token in `view_configs.metadata.preset_version` (`"v1.projects.2026-05"`) so a future migration can refresh the defaults without nuking custom saved views. Iteration happens by bumping the version + writing a one-shot SQL migration.

---

**Phase 2 ready.** Phase 2 implementation may begin after Pass-1 spec review completes; this spec does not block on further input.
