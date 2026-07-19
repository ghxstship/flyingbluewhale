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
| v3.4 | Full normalization sweep (24 surfaces) | 🟡 engine + standard shipped (`NormalizedList`, `ShareSheet`, layout blocks); **11 of 24 surfaces migrated** (Reports · Inspections · Permits · Travel · Shipments · Docks · Gate · Delivery · Project Tasks · Project Calendar · Milestones) — remainder tracked below |
| v3.5 | Fixed-order screen skeleton (`ScreenHeader`) | ✅ `ScreenHeader` primitive; used by hub members + standalone screens |
| v3.6 | Scope-partitioned IA + XPMS project surfaces | ✅ My Work vs Project split; XPMS-compliant `project_tasks`/`project_events`/`project_milestones` (real migration) |
| v3.7 | Deployment-ready polish (Daily Report, exports, real forms, details) | ⏳ **remaining** (Wave 5) — see below |
| v8.0 | Kit export (PWA manifest/SW/offline queue) | 🟡 repo already ships manifest.json + service-worker.js + IndexedDB outbox (kit 31/32); `manifest.ts` route + maskable-icon audit remaining (Wave 6) |

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

### Wave 4 (part 2) — the other normalized surfaces (~13 of 24)
Migrate onto `NormalizedList` (schema + drawers + DataView) to match the standard: **Advances · Expenses · Assets · Inventory · Documents · Templates · Approvals · Notifications · Activity · Roster · Vendors · Connections · Jobs · Marketplace · Calendar · Tasks · Knowledge**. Several have bespoke client views today (AdvancesView, ExpensesView, …) that predate the engine.

### Wave 4 — Logistics hub members — ✅ DONE
**Docks · Gate · Delivery** built as normalized ledgers (`DOCK_SLOTS`/`GATE_QUEUE`/`DELIVERIES` seed + tones); members un-`pending`ed. The Logistics hub is complete.

### Wave 5 — details, forms, handoff exports (v3.7)
- Record-detail views + real forms for former toast-only leaves (project task/event, timesheet, milestone, advance, expense, permit, inspection, travel, report, credential, personal doc) via `RecordDetail`/`FormScreen`.
- **Daily Report** rollup surface (Operations hub member — currently points at `/m/daily-log`).
- Explicit handoff/export surfaces: Time Sheets **Export → Payroll**, Finance **Sync → Accounting/ERP** (bounded; COMPVSS does not run payroll/AP-AR).
- Hub-member chrome: wire `HubChrome` (member viewseg) into the Workforce/Assets/Finance member pages as they normalize.

### Wave 6 — deploy polish (v8.0)
- `manifest.ts` route + maskable-icon audit (repo already ships `public/manifest.json` + `service-worker.js` + IndexedDB outbox).
- Loading skeletons + error/retry on async lists; persistent offline banner.

---

## Governance flags

- **7th "Onsite" tab:** already retired (rehomed to `/p/onsite`, 2026-07-15) — no action.
- **Aurora as a route:** the repo exposes `/m/aurora` as a deep-linkable route (kit models it as an overlay "not a route"). Pre-existing kit-33 deviation, documented; kept.
- **Seed org identity:** the kit specifies the demo org/project as **Black Pearl Co. / Port Royal Kickoff**; the repo's shared demo org is **MMW26 / demo org** with the established test users + e2e. Kit-34 seeds the Pirates *content* (tasks/events/milestones) into that org rather than renaming it — a full org→Black Pearl rename touches every shell + all e2e/screenshots and is out of scope for a mobile wave. Flagged for a cross-shell seed-canon decision.
- **MetricBar data on hub landings/members:** hub landings currently render the member launcher without live MetricBar counts; the counts get wired with the member normalization (Wave 4/5).
