# UX Discovery Report — Phase 0

**Status:** read-only inventory · no code edits this pass
**Date:** 2026-05-24
**Sources:** `src/`, `supabase/migrations/`, `docs/decisions/ADR-000{1,4}`, `docs/XPMS_TO_ATLVS_MAPPING.md`, `reports/LDP_LIFECYCLE_AUDIT.md`, `reports/LDP_NAMING_AUDIT.md`

## 1. Repo topology

Single Next.js 16 + React 19 app, no monorepo packages — all UI under `src/`.

| Shell                | Route group      | Subdomain           | Layout primitive                   | Sidebar / chrome                         |
| -------------------- | ---------------- | ------------------- | ---------------------------------- | ---------------------------------------- |
| Marketing            | `(marketing)`    | `atlvs.pro`         | `MarketingHeader`                  | Public nav, locale switcher              |
| Auth                 | `(auth)`         | apex                | `AuthCard`                         | Pre-session, posts to `/auth/resolve`    |
| Personal             | `(personal)` /me | apex                | shared `ModuleHeader`              | Tabs only                                |
| **ATLVS** (platform) | `(platform)`     | `app.atlvs.pro`     | `PlatformSidebar` + `PhaseStepper` | XPMS-class sidebar (ADR-0004); 10 groups |
| **GVTEWAY** (portal) | `(portal)`       | `gvteway.atlvs.pro` | `PortalRail`                       | Slug-scoped persona rail                 |
| **COMPVSS** (mobile) | `(mobile)`       | `compvss.atlvs.pro` | `MobileTabBar`                     | Bottom tab bar PWA                       |
| Parent-co marketing  | `(ghxstship)`    | apex                | dedicated                          | Out of ATLVS scope                       |

Host-rewrite middleware: `src/proxy.ts`. URL helper SSOT: `src/lib/urls.ts` (`urlFor()` switches between subdomain and path-prefix preview mode).

No shared `packages/ui` — primitives live in `src/components/ui/*` and shell helpers in `src/components/Shell.tsx`. **Implication for Phase 2:** "shared primitives in `packages/ui` first" from the brief resolves to **shared primitives in `src/components/ui/` and `src/components/views/`** here. No package boundary to break.

## 2. Design system state

### 2.1 Tokens (CHROMA BEACON)

- Primitives: `src/app/theme/primitives.css` (raw scale, motion, z-index, status colors)
- Themes: `src/app/theme/themes/{glass,brutal,bento,kinetic,copilot,cyber,soft,earthy,bermuda-triangle}.css`
- Brand overlays: `src/app/theme/index.css` (load AFTER themes so `[data-platform]` wins)
- Per-shell vars: `--org-primary` / `--org-secondary` / `--org-accent`
- Default theme: bermuda-triangle (HVRBOR) — applied via `:root:not([data-theme])`
- Tailwind v4 `@theme inline` binds tokens to `bg-*` / `text-*` / `rounded-*` utilities

**Verdict:** tokens are codified. No package boundary, but the SSOT is unambiguous.

### 2.2 Shell accent assignment — RESOLVED 2026-05-24

| Shell   | Token role      | Locked direction | Current value in code (pre-move) | File to update               |
| ------- | --------------- | ---------------- | -------------------------------- | ---------------------------- |
| ATLVS   | `--org-primary` | **PINK**         | `#dc2626` (red-600)              | `src/app/theme/index.css:64` |
| COMPVSS | `--org-primary` | **YELLOW**       | `#b45309` (amber-700)            | `src/app/theme/index.css:71` |
| GVTEWAY | `--org-primary` | **CYAN**         | `#2563eb` (blue-600)             | `src/app/theme/index.css:78` |

CLAUDE.md `Brand` section still says red/yellow/blue and is now stale; needs updating in the same PR that swaps the tokens. Phase 1 surface specs continue to reference accents by token name (`--org-primary`) so the surface specs do not need a rewrite when the hex values move. Concrete hex values for pink / cyan (each must clear WCAG AA on `--surface` in every theme variant they appear in) are owed as a token-swap spec, not surface-spec scope.

### 2.3 Theme lockdown — RESOLVED 2026-05-24

**Bermuda Triangle is the only theme that ships.** All other CHROMA themes (glass, brutal, bento, kinetic, copilot, cyber, soft, earthy) are removed from the runtime theme switcher and from `src/app/theme/index.css` imports. Bermuda Triangle's canon is the design system:

- Display fonts: Anton (display), Bebas Neue (subdisplay), DM Sans (body), Share Tech Mono (mono) — already wired
- Surfaces: cream (`#f5f2ec` family) with 3px ink border for lift
- Shadow: 8px brutal shadow reserved for `Dialog` only (per `feedback_bermuda_triangle_canon.md`)
- Headings: CAPITAL CASE h1/h2/h3 (Anton is designed for caps)
- Shell accent overlays (`[data-platform=…]`) move to pink / yellow / cyan per §2.2

Phase 1 surface specs reference Bermuda Triangle conventions only. No theme branching to consider. Theme-switcher UI (`AppearanceGallery.tsx`, `ThemeProvider.tsx`) is in scope for the cleanup PR; surface specs do not depend on its removal but will not author against any alternative theme.

### 2.4 Density rules

Density is per-component, not global.

| Component          | Density mechanism                                                      |
| ------------------ | ---------------------------------------------------------------------- |
| `DataTable`        | Per-table user pref via `DataTableInteractive` (`Rows3`/`Rows4` icons) |
| `KanbanBoard`      | `density: "comfortable" \| "compact"` prop                             |
| `ui/DensityToggle` | Global toggle component — present, but not mounted anywhere ATLVS-wide |

No platform-level density setting. Mobile is its own shell (always compact). **Gap:** there is no canonical density default per surface type — every author picks.

### 2.5 Primitive coverage

| Category         | Available                                                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inputs           | `Button`, `Input`, `Select`, `Combobox`, `DatePicker`, `MoneyInput`, `PhoneField`, `AddressField`, `Checkbox`, `RadioGroup`, `Switch`, `SignatureField` |
| Display          | `Badge`, `StatusBadge`, `StatusChip`, `Avatar`, `Card`, `MetricCard`, `ProgressBar`, `Spinner`, `DueDateBadge`                                          |
| Layout           | `Sheet`, `Dialog`, `Popover`, `Tooltip`, `Tabs`, `Accordion`, `RouteTabs`, `Breadcrumbs`, `EmptyState`, `Alert`                                         |
| Tables / views   | `DataTable` (+ `DataTableInteractive`), `KanbanBoard`, `CalendarView`, `TimelineView`, `MapView`, `ChartView`, `HeatmapGrid`, `DashboardCanvas`         |
| Shell helpers    | `ModuleHeader`, `PlatformSidebar`, `PortalRail`, `MobileTabBar`, `AuthCard`, `PageStub`, `PageSkeleton`                                                 |
| Lifecycle chrome | `xpms/PhaseStepper`, `xpms/TrackerView`, `xpms/AtomDrillIn`, `xpms/AtomPicker`                                                                          |
| Coverage gap     | No swimlane view (group rows by lane on a horizontal grid); no command bar; no inline approval drawer; no "review queue" primitive (Frame.io-style)     |

### 2.6 Canonical multi-view abstraction

`src/components/views/DataViewSwitcher.tsx` owns the `?view=` URL param. Registry: `table | list | board | timeline | calendar | map | gallery | tree`. **Adoption: 1 surface only** — `console/projects/[projectId]/schedule`. Every other collection page is hardcoded to `DataTable`. **This is the single largest lever for Phase 2.**

`KanbanBoard` is built and shipped to **3 surfaces** (`tasks`, `operations/incidents`, `punch`) — never deployed alongside DataViewSwitcher. Board view is broadly under-deployed.

`PhaseStepper` is mounted in **1 layout** — `projects/[projectId]/layout.tsx`. Never appears on a list page (no portfolio-by-phase view).

## 3. Primary data surfaces inventory

XPMS class mapping per `docs/decisions/ADR-0004-xpms-native-nav.md`. State column read from the live `select()`. Maturity rubric: **STUB** = autoscaffold placeholder · **SHELL** = header + empty state · **TABLE-ONLY** = single `DataTable` view · **MULTIVIEW** = `DataViewSwitcher` or equivalent multi-view · **DEEP** = lifecycle chrome + multi-view + bespoke composition.

### 3.1 Pass-1 candidate surfaces

| #   | Surface                             | Route                                | XPMS class     | DB table(s)                                                | Lifecycle column                                                 | Views today                                    | Chrome              | Maturity                    |
| --- | ----------------------------------- | ------------------------------------ | -------------- | ---------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------- | ------------------- | --------------------------- |
| 1   | Projects                            | /console/projects                    | 0 EXECUTIVE    | projects                                                   | `project_state` (status-shaped) + `xpms_phase`                   | Heatmap hero + DataTable                       | none on list        | DEEP (list) / DEEP (detail) |
| 2   | Productions (fabrication)           | /console/production/fabrication      | 4 BUILD        | fabrication_orders                                         | `status` (open/in_progress/blocked/complete)                     | DataTable                                      | none                | TABLE-ONLY                  |
| 3   | Assets — equipment                  | /console/production/equipment        | 5 PRODUCTION   | equipment                                                  | `status` (`equipment_status` enum)                               | DataTable                                      | none                | TABLE-ONLY                  |
| 3b  | Assets — rentals                    | /console/production/rentals          | 5 PRODUCTION   | rentals                                                    | (no state column surfaced)                                       | DataTable                                      | none                | TABLE-ONLY                  |
| 4   | Deliverables (advancing)            | /console/projects/[id]/advancing     | 6 OPERATIONS   | deliverables                                               | `status` (`deliverable_status` enum) + `deliverable_history` log | bespoke grouped table                          | StatusBadge per row | TABLE-ONLY                  |
| 4b  | Advancing — portal                  | /p/[slug]/crew/advances              | 6 OPERATIONS   | deliverables filtered by `assignee_id`                     | same                                                             | bespoke list                                   | none                | TABLE-ONLY                  |
| 4c  | Advancing — mobile                  | /m/advances                          | 6 OPERATIONS   | same, cross-project                                        | same                                                             | bespoke list                                   | none                | TABLE-ONLY                  |
| 5   | Run of Show                         | /console/production/ros              | 5 PRODUCTION   | cues                                                       | `status` (pending/standby/live/done/skipped)                     | bespoke day-grouped table + `CueForm`          | day headers only    | TABLE-ONLY                  |
| 6   | Engagement — offer letters          | /console/people/offer-letters        | 6 OPERATIONS   | offer_letters (+ activity log)                             | `status` (`offer_letter_status` enum)                            | DataTable with status counts in subtitle       | StatusBadge         | TABLE-ONLY                  |
| 6b  | Engagement — MSAs                   | /console/people/msas                 | 6 OPERATIONS   | independent_contractor_msas                                | `msa_status` (text + CHECK)                                      | DataTable                                      | StatusBadge         | TABLE-ONLY                  |
| 7   | Vendor CRM                          | /console/procurement/vendors         | 0 EXECUTIVE    | vendors                                                    | (none — compliance flags only)                                   | DataTable (W-9, COI expiry chips)              | none                | TABLE-ONLY                  |
| 7b  | Clients                             | /console/clients                     | 3 MARKETING    | clients                                                    | (none — 3 columns visible)                                       | DataTable                                      | none                | TABLE-ONLY                  |
| 7c  | Leads / pipeline                    | /console/leads, /console/pipeline    | 3 MARKETING    | leads (`lead_stage` enum)                                  | `lead_stage`                                                     | bespoke (separate from /console/clients)       | n/a                 | (not probed)                |
| 8   | Venues                              | /console/venues                      | 0 EXECUTIVE    | venues                                                     | `handover_state` (good name)                                     | DataTable                                      | none                | TABLE-ONLY                  |
| 9   | Catalog — XPMS atoms                | /console/xpms                        | 9 TECHNOLOGY   | xpms_atoms, xpms_variance_ledger, xpms_project_composition | `state` (uac/tpc) + `phase`                                      | bespoke landing — MetricCards + 10-class grid  | dedicated layout    | DEEP                        |
| 9b  | Catalog — master catalog            | /console/settings/catalog            | 9 TECHNOLOGY   | master_catalog_items                                       | `catalog_kind` enum                                              | (not probed)                                   | n/a                 | (not probed)                |
| 9c  | Catalog — procurement catalog       | /console/procurement/catalog         | 0 EXECUTIVE    | (separate vendor product catalog)                          | (not probed)                                                     | (not probed)                                   | n/a                 | (not probed)                |
| 10  | Subscription                        | /console/subscriptions               | 0 EXECUTIVE    | subscriptions (per lib `subscriptions.ts`)                 | `state` (PROSPECT/TRIAL/ACTIVE/RENEWED/...)                      | DataTable with state filter counts in subtitle | StatusBadge         | TABLE-ONLY                  |
| 10b | Booking (operator)                  | /console/bookings                    | 2 TALENT       | talent_offers, availability_slots, settlements             | `status` per table                                               | bespoke landing — MetricCards + 3 sections     | n/a                 | SHELL                       |
| 10c | Booking (portal — client)           | /p/[slug]/client                     | 3 MARKETING    | per persona                                                | n/a                                                              | (not probed)                                   | n/a                 | (not probed)                |
| 10d | Booking (portal — artist/vip/guest) | /p/[slug]/{artist,vip,guest,sponsor} | 2/7 TALENT/EXP | per persona                                                | n/a                                                              | (not probed)                                   | n/a                 | (not probed)                |

**Detail-page maturity** is uniformly higher than list maturity. The project detail tab strip (overview / tracker / tasks / schedule / files / photos / budget / p&l / crew / advancing / guides / sustainability) is the single mature multi-tab pattern in the platform shell; it pairs `PhaseStepper` above tabs with `RecordTabsContext` for tab routing. No other detail page applies the same pattern at the same depth.

## 4. Lifecycle naming hygiene — flag-only

LDP audits already exist. Citing for completeness; nothing new found.

| #   | LDP lifecycle       | Canonical column     | Implemented as                                                                              | Verdict                                                                                                                                                  | Source                                                                          |
| --- | ------------------- | -------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1   | Project             | `project_phase`      | `xpms_phase` enum + `project_state` enum                                                    | PARTIAL (name + ARCHIVED missing + no transition log)                                                                                                    | `reports/LDP_LIFECYCLE_AUDIT.md` §1                                             |
| 2   | Production          | `production_phase`   | — _(does not exist)_                                                                        | NOT IMPLEMENTED — `fabrication_orders.status` is 4-state proxy                                                                                           | `reports/LDP_LIFECYCLE_AUDIT.md` §2                                             |
| 3   | Asset (UAL)         | `asset_state`        | `equipment.status` (5/9 states)                                                             | PARTIAL — no movement ledger                                                                                                                             | `reports/LDP_LIFECYCLE_AUDIT.md` §3                                             |
| 4   | Deliverable         | `deliverable_state`  | `deliverables.status` + `deliverable_history`                                               | STRONG (name only)                                                                                                                                       | `reports/LDP_LIFECYCLE_AUDIT.md` §4                                             |
| 5   | Engagement          | `engagement_state`   | distributed across 4 tables                                                                 | DISTRIBUTED (P2 risk)                                                                                                                                    | `reports/LDP_LIFECYCLE_AUDIT.md` §5                                             |
| 6   | Engagement-Document | `document_state`     | `offer_letters.status` + `proposals.status`                                                 | STRONG (offer_letters) / PARTIAL (proposals)                                                                                                             | `reports/LDP_LIFECYCLE_AUDIT.md` §6                                             |
| 7   | Financial Period    | `period_state`       | —                                                                                           | NOT IMPLEMENTED                                                                                                                                          | `reports/LDP_LIFECYCLE_AUDIT.md` §7                                             |
| 8   | Subscription        | `subscription_state` | `subscriptions.state` (per `src/lib/subscriptions.ts`) — VERIFY whether the table now ships | INCONSISTENT WITH AUDIT — audit says "not implemented"; surface uses `listSubscriptions()` that types `state` as enum. Likely added after the audit ran. | `src/lib/subscriptions.ts`, `src/app/(platform)/console/subscriptions/page.tsx` |

**45+ `status` columns** still in the schema per `reports/LDP_NAMING_AUDIT.md`. Banned in new tables per `LIFECYCLE_DECOMPOSITION_PROTOCOL.md` §NAMING DISCIPLINE. **Phase 1 specs must use `phase` / `state` in copy, even where the DB column is still `status`** — the spec describes the conceptual lifecycle, not the column name.

**UI-side hygiene flags** (cite in surface specs, do not fix in Phase 0):

| Surface                       | UI string                                                                            | Source                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| Fabrication empty state       | "runs status from open through complete"                                             | `console/production/fabrication/page.tsx` `emptyDescription` |
| ROS                           | "Status flows Pending → Standby → Live → Done"                                       | `console/production/ros/page.tsx` description                |
| Projects list (column header) | "State" — correctly named                                                            | `console/projects/page.tsx`                                  |
| `StatusBadge`                 | component name and prop are `status` — canonical primitive name uses the banned word | `src/components/ui/StatusBadge.tsx`                          |
| `StatusChip`                  | component name uses the banned word                                                  | `src/components/ui/StatusChip.tsx`                           |

## 5. Cross-cutting gaps to address in Phase 1 specs

1. **`<DataViewSwitcher>` adoption.** Every collection page should be re-evaluated against the registry. Today 1/40+ pages uses it.
2. **`PhaseStepper` on list pages.** Today only mounted on project detail. Portfolio-by-phase board view is missing.
3. **`KanbanBoard` adoption.** 3/40+ surfaces. Productions, ROS, Deliverables, Engagements, Subscriptions all have clean lifecycle enums and zero board views.
4. **Lifecycle visualization consistency.** `PhaseStepper` (sequential) vs `StatusBadge` (pill) vs `StatusChip` (capsule) vs bespoke "n active / n trial / n lapsed" subtitle — pick one pattern per lifecycle shape (sequential macro arc vs cyclical operational state) and use it everywhere.
5. **Saved views.** `view_configs` table + `lib/db/view-configs.ts` exist. Not surfaced on collection pages. Per-user `DataTable` state (`useUserPreferences`) is per-pathname only, not portable.
6. **Bulk actions / row actions.** `RowActions` and `DataTableInteractive` `BulkAction` plumbing exist. Almost no list page declares them.
7. **Filter chips above the table.** `DataTableInteractive` supports per-column filters but no list page surfaces a discoverable chip strip; users have to open the column menu.
8. **Empty / loading states.** `<EmptyState>` is present and used. Loading states largely defer to `PageSkeleton` only on the project shell. Most list pages have no explicit loading state because they are server-rendered with `force-dynamic`.
9. **Detail-page tab parity.** Only Projects has the `RecordTabsContext` + `ModuleHeader.tabs` strip. Vendors, venues, fabrication orders, deliverables would each benefit from a parallel tab grammar.
10. **Mobile-first surfaces** (ROS strip board for stage manager, deliverable approve-in-line for production assistants) are absent — COMPVSS today is read-heavy.

## 6. Confirmations

| #   | Question                                                                                                                                | Resolution                                                                                                                                                                                                                                                                                                                                         |
| --- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | ATLVS accent direction                                                                                                                  | **PINK** — 2026-05-24                                                                                                                                                                                                                                                                                                                              |
| C2  | GVTEWAY accent direction                                                                                                                | **CYAN** — 2026-05-24                                                                                                                                                                                                                                                                                                                              |
| C2b | COMPVSS accent direction                                                                                                                | **YELLOW** — 2026-05-24 (formally adopted; current amber-700 becomes a true yellow per the AA contrast it can clear)                                                                                                                                                                                                                               |
| C3  | Theme set                                                                                                                               | **BERMUDA TRIANGLE only** — 2026-05-24. All other CHROMA themes deprecated.                                                                                                                                                                                                                                                                        |
| C4  | "Best-in-class SaaS bar per data class" — accept the products in the brief, or weight differently?                                      | **RESOLVED — 2026-05-24.** Brief's list is the parity FLOOR (must reference each). Spec author may add 1–2 extra references per surface when a non-listed product nails a specific pattern; cannot substitute one out. Reasoning: brief products are calibration, not menu.                                                                        |
| C5  | Surface order — confirm or adjust                                                                                                       | **RESOLVED — 2026-05-24.** Keep brief order. Dependency graph runs Projects (umbrella) → Productions (work within project) → Assets (movements driven by productions) → Deliverables (catalog assignments riding on UAL) → ROS → Engagements → CRM → Venues → Catalog → Subscription. Order reflects upstream→downstream architectural dependence. |
| C6  | Subscription lifecycle: `subscriptions` table appears to exist post-audit; confirm `subscription_state` ships before spec depends on it | **RESOLVED — 2026-05-24.** Audit (`reports/LDP_LIFECYCLE_AUDIT.md` §8) is stale — `subscriptions` table ships per `src/lib/subscriptions.ts` and is consumed at `/console/subscriptions`. Surface #10 spec writes against the live schema. A delta-bullet in the LDP audit will be filed when Surface #10 lands; not blocking Pass 1.              |
