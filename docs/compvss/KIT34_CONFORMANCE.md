# Kit 34 (v8.0) — COMPVSS Field Conformance

**Source:** `ATLVS Ecosystem (34).zip` → `design_handoff_compvss_field` (Kit v8.0 · 2026-07-19).
**Target:** the `(mobile)` shell — `src/app/(mobile)/m/**`, kit primitives `src/components/mobile/kit/**`, nav SSOT `src/lib/nav.ts`.
**Started from:** kit 33 v3.0 (Aurora tab · nav drawer · Operations ledgers · scheduler). Kit 34 layers **v3.1 → v3.7 + v8.0** on top.

This is a governed reconciliation (kit leads, repo follows; MORE and LESS are both violations). Work is landing in waves; this doc tracks what is reconciled vs. what remains.

---

## Reconciliation status by kit version

| Kit ver | Theme | Status |
|---|---|---|
| v3.1 | Operations hubs (MetricBar + viewseg) | ✅ hub model + `MetricBar`/`ViewSeg`/`HubChrome`; Operations·Logistics landings |
| v3.2 | Hubs as top-level IA · Projects hub · pill filters | ✅ 6 hubs SSOT (`mobileHubs`); Projects hub (Timeline·Milestones·Calendar·Tasks); pills on every normalized surface |
| v3.3 | Airtable-plus view engine (bottom-sheet filter/sort/group) | ✅ `viewengine.tsx` — nested AND/OR `FilterGroups` (typed incl. `date`), multi-key `SortReorder`, multi-level `GroupBuilder`, `ViewSheet` drawer |
| v3.4 | Full normalization sweep (24 surfaces) | 🟡 engine + standard shipped (`NormalizedList`, `ShareSheet`, layout blocks); **26 surfaces migrated** — every record-list surface (incl. the core Tasks tab, Approvals, and Calendar/Schedule which keeps its bespoke real-today weekstrip calendar) (Reports · Inspections · Permits · Travel · Shipments · Docks · Gate · Delivery · Project Tasks · Project Calendar · Milestones · Documents · Knowledge · Vendors · My Gear · Catalog · Notifications · Roster · Advances · Expenses · Activity · Jobs · Templates · Inventory) — Marketplace + Connections are documented gallery/feed exceptions — remainder tracked below |
| v3.5 | Fixed-order screen skeleton (`ScreenHeader`) | ✅ `ScreenHeader` primitive; used by hub members + standalone screens |
| v3.6 | Scope-partitioned IA + XPMS project surfaces | ✅ My Work vs Project split; XPMS-compliant `project_tasks`/`project_events`/`project_milestones` (real migration) |
| v3.7 | Deployment-ready polish (Daily Report, exports, real forms, details) | ✅ Daily Report rollup surface; Time Sheets → Payroll + Finance → ERP handoffs; record-detail sheets across the ops-ledger + Projects surfaces; hub-member chrome on all six hubs |
| v8.0 | Kit export (PWA manifest/SW/offline queue) | ✅ repo ships manifest.json + service-worker.js + IndexedDB outbox (kit 31/32) + kit-34 first-load skeletons on the async surfaces; a `manifest.ts` route is intentionally NOT adopted (multi-shell app — the conditionally-linked static manifest is correct) |

---

## Shipped (Waves 1–4)

### Wave 1 — normalization backbone (`src/components/mobile/kit/`)
- **`viewengine.tsx`** — the Airtable-plus model engine: `FilterModel`/`FilterGroups` (nested AND/OR, typed incl. a real `date` type), `SortReorder` (multi-key), `GroupBuilder` (multi-level), `applyModel`/`groupTree`, `DataView` (list/table/board/calendar/gallery), `GroupedTree`, `ViewSheet` + `ShareSheet` bottom-sheet drawers, `advBar`/`dataPills`/`ViewCtl`.
- **`ActionBar`** gained the kit-34 drawer mode: search + quick-filter pill row + exactly two icon buttons (View Options · Share & Export). Legacy popover/basic modes kept for the documented non-grid exceptions.
- **`MetricBar`/`ViewSeg`**, **`ScreenHeader`**, layout blocks **`Block`/`ListRow`/`MetricGrid`/`MeterRow`** (+ `pressable` a11y helper). `FieldDef` gained `iso()`/`group()`.

### Wave 2 — hubs + IA reconciliation (`src/lib/nav.ts`)
- `moreNavGroups` reconciled to the kit's six groups: **My Work** (My Tasks · My Calendar · My Time · My Gear · My Documents · My Activity) · **Field Operations** (hub rows) · **Workplace** · **Network** · **Opportunities** · **Manage**. Flat Operations rows collapsed into hubs; Time Off + Roster moved to their Workforce hub.
- **`mobileHubs`** SSOT (kit `HUBS`) with per-member RBAC (`managerOnly`) + `pending` for not-yet-built members. `HubChrome` (home launcher / member viewseg). New landings `/m/operations`, `/m/workforce`, `/m/equipment`.

### Wave 3 — XPMS Projects hub (real migration)
- Migration `20260719224440_kit34_xpms_project_surfaces`: `dim_phase` (9 gates) + `dim_department` (0000–9000) + **`project_tasks` · `project_events` · `project_milestones`** — every row carries the XPMS spine (`xpms_atom_id` · `urid` regex-CHECK → department/discipline/category · 9-gate `phase` FK · `coordinate`), closed enums as CHECK constraints, org-scoped RLS mirroring `tasks`. LDP-named (`task_state`/`event_state`/`milestone_state`). Seeded with the Pirates / Port Royal canon.
- Surfaces (`/m/projects` hub + members, live org-scoped reads): **Timeline** (phases + milestone rollup via layout blocks), **Milestones** (grouped by phase), **Project Calendar** (agenda), **Project Tasks** (all-crew SSOT; board columns = phase = the Coordinate Matrix axis). `resolveProjectContext` follows the active project with live XPMS work.
- **`NormalizedList`** kit primitive — the standard record-list surface (reused by Wave 4).

### Wave 4 (part 1) — Operations/Logistics ledgers normalized
- `OpsLedgerView` rewritten onto `NormalizedList` + `HubChrome`: **Reports · Inspections · Permits · Travel** (Operations hub) and **Shipments** (Logistics hub) now render the drawer ActionBar + schema DataView (list/table/board) + GroupedTree + pills, replacing inline popovers.

**Runtime smoke:** all new/changed routes serve clean (200, 0 server errors) in a real Next dev build.

---

## Remaining (tracked for follow-up waves)

### Wave 4 (part 2) — ✅ COMPLETE
**Every record-list surface is normalized** onto `NormalizedList`/the view engine — 26 surfaces, including the hardest:
- **Tasks** (core bottom tab): list/board/table + priority pills, preserving the optimistic state/flag/archive overrides, show-completed/show-archived toggles, undo bar, New-Task FAB.
- **Approvals**: drawer toolbar + kind pills over the offline-replay decision queue (5s-undo → IndexedDB commit, escalate, flush-on-unmount) — and the pre-existing `commitRef`-in-render lint error was fixed to a `useEffect` in passing.
- **Calendar/Schedule**: drawer toolbar + type pills + DataView list/table + GroupedTree grouping, while **keeping its bespoke real-today weekstrip calendar** (the generic DataView calendar uses the demo clock, so the bespoke one is retained deliberately) + the swap/remind quick-look.

**Documented exceptions** (the kit's §7 non-grid category — deliberately NOT forced through the list engine):
- **Marketplace** — a browse-and-buy photo-card grid (`.mkt`/`.mcard` + per-listing photos + mark-sold/withdraw); gallery-first, like Community (feed) and Groups/Spaces (join cards).
- **Connections** — a 3-section social surface (Network / Pending / Suggestions); flattening it into one list would degrade it.

### Wave 4 — Logistics hub members — ✅ DONE
**Docks · Gate · Delivery** built as normalized ledgers (`DOCK_SLOTS`/`GATE_QUEUE`/`DELIVERIES` seed + tones); members un-`pending`ed. The Logistics hub is complete.

### Wave 5 — details, forms, handoff exports (v3.7) — ✅ COMPLETE
- **Daily Report** — new Operations hub rollup surface (`/m/daily-report`): shift notes + open-incident/delivery/flag summary, File (→ daily-log) + Export PDF. Repointed the hub member (distinct from the `/m/daily-log` weather log).
- **Handoff exports** (§5): the new manager-gated **Workforce Time Sheets** surface (`/m/time-sheets`) with approve/flag + **Export → Payroll** (approved hours, CSV/API); **Finance → Accounting/ERP** sync on `/m/finance`. Both carry the explicit "COMPVSS does not run payroll / AP-AR / GL" boundary note.
- **Record-detail sheets** — no toast-only / dead-end leaves: `OpsLedgerView` rows (Reports · Inspections · Permits · Travel · Docks · Gate · Delivery) + the Projects surfaces (Project Tasks · Calendar · Milestones) open a `RecordDetail`. The DB-backed leaves (advances, notifications, tasks, templates) already had detail routes/sheets.
- **Hub-member chrome** — `HubChrome` (member viewseg) wired into every hub's members: Operations/Logistics (via `OpsLedgerView`), Assets & Equipment (Inventory/Catalog/Requests), Finance (Budget/Expenses, RBAC-threaded), Workforce (Schedule/Time Sheets/Roster/Time Off, RBAC-threaded). All six hubs are navigable member-to-member.

### Wave 6 — deploy polish (v8.0) — ✅ (repo baseline + kit-34 additions)
- First-load shimmer skeletons on the async Projects surfaces; the repo already ships the Web App Manifest (`public/manifest.json`), the service worker, and the IndexedDB offline outbox (kit 31/32).
- A Next `manifest.ts` route is intentionally NOT adopted: this is a multi-shell app and the COMPVSS manifest (scope `/m`) is conditionally linked only on the mobile host, which a root `manifest.ts` would incorrectly make app-wide.

---

## Governance flags

- **7th "Onsite" tab:** already retired (rehomed to `/p/onsite`, 2026-07-15) — no action.
- **Aurora as a route:** the repo exposes `/m/aurora` as a deep-linkable route (kit models it as an overlay "not a route"). Pre-existing kit-33 deviation, documented; kept.
- **Seed org identity:** the kit specifies the demo org/project as **Black Pearl Co. / Port Royal Kickoff**; the repo's shared demo org is **MMW26 / demo org** with the established test users + e2e. Kit-34 seeds the Pirates *content* (tasks/events/milestones) into that org rather than renaming it — a full org→Black Pearl rename touches every shell + all e2e/screenshots and is out of scope for a mobile wave. Flagged for a cross-shell seed-canon decision.
- **MetricBar data on hub landings/members:** hub landings currently render the member launcher without live MetricBar counts; the counts get wired with the member normalization (Wave 4/5).
