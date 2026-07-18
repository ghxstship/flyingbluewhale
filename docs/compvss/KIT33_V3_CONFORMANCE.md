# COMPVSS Field · Kit 33 v3.0 Conformance (shipped 2026-07-18)

Reconciles the `(mobile) /m` field PWA against **ATLVS Ecosystem kit 33**
(`design_handoff_compvss_field`, v3.0). Kit is the SSOT; the repo renders it.
Zero-violation governance.

## Shipped

### Tab bar (`mobileTabs`)
- 5th slot **Assets → Aurora** (`/m/aurora`). Order is Home · Calendar · Tasks ·
  Inbox · Aurora · More. The **More** tab opens the left nav drawer (not a
  route); every other tab, including Aurora, is a normal `<Link>`.
  (`MobileTabBarClient`.)

### Aurora AI (`/m/aurora`)
- Full-screen Claude-conversation surface: greeting + suggested-prompt cards,
  trailing user bubbles, left-avatar assistant prose with a
  `Consulted <source>` tool-trace + inline follow-ups, rounded pinned composer
  + New-Chat reset. `AuroraChat` (client). Responses are a **canned
  placeholder**; **heybrio.ai** (https://heybrio.ai/) is the future agent
  runtime — wire the composer / tool-trace / follow-ups to its API when it
  lands. The app-bar brand mark also routes here.
- **Repo deviation (documented):** the kit models Aurora as an overlay "not a
  route"; the repo makes it a real route so it is sitemap-clean, deep-linkable,
  and reached like every other tab. Behaviour is identical.

### More → nav drawer (`MobileNavDrawer`)
- Left slide-in (identity header → Profile · workspace switcher ·
  search-to-filter · grouped IA · perm-gated **Manage** control plane · footer:
  sync · Settings · theme · Sign Out). Opened by the More tab via the
  `compvss:nav-open` window event.
- **`moreNavGroups`** (`src/lib/nav.ts`) is the single SSOT driving BOTH the
  drawer and the `/m/more` route (its deep-linkable / no-JS fallback), so they
  can't drift. Group order: My Work · Workplace · Operations · People & Teams ·
  Opportunities · Manage.
- Renames applied: **Spaces & Clubs → Groups**, **Engagement → Insights**,
  **Reporting Structure → Org Chart**.

### Operations ledgers (new)
`/m/reports · /m/inspections · /m/logistics · /m/permits · /m/travel` — each a
first-class list surface built from one shared `OpsLedgerView` over the kit
primitives (`ActionBar` search + icon-only view/group/sort/filter · list +
`DataTable` table view · `GroupedList` · `EmptySkeleton`), **no bespoke
layouts**. Seeded verbatim from the canonical `OPS_*` consts
(`src/lib/mobile/ops-seed.ts`). (Advances / Expenses / Inventory / Catalog
already existed and stay.) Real backing tables are a follow-up; the ledgers
render the kit seed until then.

### Scheduler enrichment (`/m/scheduler`)
Over the existing real-data `shifts` engine:
- **Schedule / Coverage / On Now** segmented views.
- Schedule stat grid: Coverage · Open Slots · Est. Labor · OT Flags; per-shift
  meta (hours · $/hr · confirmed) + per-crew check-in dot.
- Coverage: hourly coverage bars (have vs needed).
- On Now: live attendance board from real check-in state.
- Smart Assign Crew sheet: availability + OT-guard tags + Post-As-Open-Shift.
- Overflow: Auto-Fill Open (real 1:1 assign) · Copy Last Week / Apply Template
  (routed to the ATLVS engine).

## Governance notes
- **7th "Onsite" tab** — already resolved before this kit: rehomed to
  `/p/onsite` on 2026-07-15 and removed from `mobileTabs`. Nothing to flag.
- Extension-product surfaces (CVRGO/OPVS/GVLLEY/Vault) remain out of the field
  shell.

## Verification
`tsc` 0 · `eslint` 0 (touched files) · guard suites green
(nav-routes / nav-labels / nav-scope / icon / sitemap / design-system /
no-competitor-names / inclusive-language / voice-and-type) · `gen:sitemap`
0 orphans · dev-server render check of every new surface (Aurora chat, nav
drawer, all 5 ledgers, scheduler views + overflow) with no console errors.
