# B0 · views/DataView hardening — DataTable API parity

**Date:** 2026-07-22 · **Status:** B0 COMPLETE (in-tree, uncommitted per B0 instructions).
**Ruling:** Option B (INVENTORY_AND_PLAN.md §Owner rulings #2) — `views/DataView` is the ONE
canonical collection surface; all 268 `@/components/DataTable` importers migrate to it in B1..n.

## Architecture (decided in B0)

`DataTable` was always a two-piece machine: a **server wrapper** (pre-renders cells, derives
sort/filter scalars, auto-derives `tableId` from the pathname) over the **client engine**
`DataTableInteractive`. The canonical DataView now mirrors that exactly, so migration is an
import + name swap:

| Piece | File | Role |
|---|---|---|
| Server entry | `src/components/views/DataViewServer.tsx` (exports `DataView`) | Drop-in for `DataTable` at server call sites (the ~268). Superset of `DataTableProps` + view-switching + board/gallery/peek adapters whose render fns run server-side and cross the RSC boundary pre-rendered (keyed by row id). NOT barreled — it imports `next/headers`. |
| Client core | `src/components/views/DataView.tsx` (exports `DataView`) | The canonical surface. Accepts **rich** (DataTable-shaped) columns directly from client components, or the legacy low-level `InteractiveColumn[] + toRow` API, or the serialized rows/adapters the server entry sends. Owns `?view=` toggle, board/gallery/cards, peek drawer. |
| Shared model | `src/components/views/data-view-model.ts` | `DataViewColumn<T>` (structural superset of DataTable's `Column<T>`), `SpotlightRule<T>`, cell-class composition (the corrected faces), `toInteractiveColumns` / `toInteractiveRow`, `coerceScalar` / `extractText`. No directive: runs on both sides. |
| Table engine | `src/components/DataTableInteractive.tsx` | Unchanged except one additive prop: `tableClassName` (kit table variants, e.g. `ps-table--zebra`). Already carries `.ps-table`, `th scope="col"`, `aria-sort`, sortable `<button>` headers, focus-visible chrome, and 3-arg `t()` defaults. |

The mapping logic is a **deliberate copy** of DataTable's, not shared with it: DataTable is
frozen (W2 fixes its live mono bug separately) and is deleted at B-final, so coupling the two
would create a collision surface with the concurrent P0 agents for zero long-term value.

## Parity gap table (DataTable → views/DataView)

Usage counts = files among the 268 importers that reference the prop (grep, 2026-07-22).

| DataTable prop / behavior | Used by | views/DataView before B0 | After B0 |
|---|---|---|---|
| `columns: Column<T>[]` (render fns) | all | ✗ (only low-level `InteractiveColumn[] + toRow`) | ✓ `DataViewColumn<T>` accepted directly (client) / via server entry; structural superset |
| `column.accessor` (sort/filter/CSV scalar) | 248 | ✗ caller hand-derived `values[]` | ✓ derived in model (accessor → `coerceScalar`, fallback stripped cell text) |
| `column.mono` | 232 | ✗ | ✓ and **corrected**: `--p-mono-data` (IBM Plex) instead of `font-mono` (Space Mono) — the W2 root cause (DataTable.tsx:305) built right here |
| `column.tabular` | 38 | ✗ | ✓ data face + `tabular-nums` (canon: table figures ride IBM Plex) |
| `column.numeric` (NEW) | n/a | ✗ | ✓ `.ps-table .num` kit variant: right-aligned tabular figures in the data face, header right-aligns too |
| `column.sortable` (default true) / sort UX | 33 explicit | ✓ (engine) but caller had to map | ✓ same default-on semantics as DataTable |
| `column.filterable` / `groupable` / `defaultHidden` | 199 / 170 / 1 | ✗ (manual mapping) | ✓ mapped |
| `column.total` / `totalFormat` (footer aggregates) | ~50 / 3 | ✗ (manual) | ✓ mapped (same serialization caveat as DataTable — see Hazards) |
| `column.editable` + `onCellEdit` | 2 | ✗ | ✓ threaded |
| `column.headerClassName` | 10 | ✗ | ✓ carried on the type; honored by the empty state (same partial support DataTable had — see Hazards) |
| `rowHref` | 190 | ✗ (folded into `toRow`) | ✓ first-class prop (rich mode) |
| `rowActions` (kebab menu) | 0 direct | ✗ | ✓ first-class prop |
| `rowClassName` / `spotlight` rules | 0 | ✗ | ✓ first-class props (row + per-cell tone collapse, later-rule-wins) |
| `emptyLabel` | 245 | ✓ (plain text center) | ✓ i18n-routed default (`dataTable.emptyLabel`, already in all 7 catalogs) |
| `emptyDescription` / `emptyAction` + structure-preserving empty (ghost table + `EmptyState`, AX-9 status region) | 236 / 127 | ✗ | ✓ ported (`DataViewEmpty`; works for low-level columns too) |
| `loading` skeleton (`aria-busy`, `.ps-skel`) | 0 today | ✗ | ✓ ported (`DataViewSkeleton`, i18n label) |
| `density` | 0 | ✗ | ✓ threaded |
| `stickyHeader` / `maxHeight` (absorbed legacy) | 0 | n/a | ✓ accepted + absorbed on the server entry (compile-compat), header always sticky in the engine |
| zebra variant | 0 today | ✗ | ✓ `zebra` prop → `ps-table--zebra` via the engine's new `tableClassName` |
| auto `tableId` from pathname | 250 (implicit) | ✗ (`tableId` required) | ✓ server entry derives `t:<path>:<colkeys>` exactly like DataTable; client core still requires explicit `tableId` |
| `searchable` (default true) / `pageSize` / `totalCount` | 6 / 39 / 64 | ✓ | ✓ unchanged |
| `bulkActions` (ids-based `perform`, toast on `BulkActionResult`) | 14 | ✓ | ✓ unchanged (note: DataTable's exported `BulkAction<T>` rows-based type was dead — the props always took ids) |
| `onImport` / `onRefresh` | 0 | ✗ | ✓ threaded |
| Saved views (`viewType`, `viewConfigsForTable`, `allowedSaveScopes`, `onSaveView`/`onDeleteView`/`onSetDefaultView`) | 1 site | ✗ | ✓ threaded |
| a11y: `th scope`, `aria-sort`, sortable button, focus-visible | all | ✓ via engine | ✓ (verified in engine; empty/skeleton ports keep `scope="col"`, `role="status"`, `aria-busy`) |
| i18n: no hardcoded-English defaults (lane-f F-20) | n/a | ✗ ("Peek", "Details", "Open Full" hardcoded) | ✓ all defaults routed through 3-arg `t()` (`dataView.*`, reusing `dataTable.emptyLabel`) |
| Board / gallery view-switching + peek drawer (`?view=`, `?peek=`, ⌘↵ promote) | DataView-only | ✓ | ✓ preserved; adapters now also accept serialized by-row forms so they survive the RSC boundary; gallery gained a free-form `renderCard`/`cardByRow` card grid (absorbs `ui/DataView`'s grid mode) |

## API decisions

1. **Server entry exports the name `DataView`** from `views/DataViewServer.tsx` so migrated
   pages read canonically. It is intentionally NOT in the `@/components/views` barrel:
   `next/headers` must never ride a client bundle. Client pages import from
   `@/components/views/DataView` (or the barrel).
2. **Rich vs low-level columns are runtime-discriminated** by the presence of `render` on the
   first column. `toRow` became optional: rich mode ignores it; low-level mode without it
   assumes rows are already `InteractiveRow`s (the serialized server path).
3. **`numeric` added** beyond DataTable parity: money columns should ride the `.ps-table .num`
   kit vocabulary (right-align + tabular + data face) instead of hand-rolled
   `className: "text-right tabular-nums"`. B1 migrations should upgrade money columns
   `tabular` → `numeric` where right alignment is wanted.
4. **Mono face corrected at the model layer** (`MONO_CELL_CLASS` / `TABULAR_CELL_CLASS` in
   `data-view-model.ts`, literal Tailwind-visible strings using
   `font-[family-name:var(--p-mono-data,var(--p-mono))]`, same pattern as `ui/ListRow`).
   DataTable itself was NOT touched here — its :305 fix belongs to W2 (avoids a concurrent-
   agent collision).
5. **Serialized adapter forms** (`board.laneIdByRow`/`cardByRow`, `gallery.items`/`cardByRow`,
   `peek.byRow`) are part of the public client API, not a private channel — any server page can
   also hand-precompute them.
6. **`ui/DataView` deleted** (the same-name trap, lane-f F-01). Its one importer
   (`legend/community/members/MembersDirectory.tsx`) migrated to the canonical surface
   (rich columns + `gallery.renderCard` + `views={["table","gallery"]}`). Barrel entry removed
   from `ui/index.ts`; `DataView` entry removed from `component-maturity.json` (registry is
   scoped to `ui/*`).

## Hazards discovered (carried forward, not B0 regressions)

- **`totalFormat` / bulk `perform` / `onMove` etc. across the RSC boundary**: DataTable already
  passed these from server pages into a client component; only server-action refs (or
  client-safe callables) are legal. 3 sites use `totalFormat` with plain closures
  (`kits/[kitId]`, `rfqs/[rfqId]/responses`, `procurement/scorecards`) — B1 must verify these
  at migration time (they are equally suspect under DataTable today).
- **`headerClassName` is only honored by the empty state** — same partial support DataTable
  had (its live mapping dropped it). If B1 hits a site that needs a real header-only class,
  add `headerClassName` to `InteractiveColumn` then (additive engine change).
- **`InteractiveColumn.className` styles both `<th>` and `<td>`** — `mono`-flagged columns get
  a mono header too. Identical under DataTable; noting for visual-diff review in B1.

## §Recipe — mechanical migration of one DataTable call site (B1..n)

Per call site (server component page, the normal case):

1. **Import swap:**
   `import { DataTable } from "@/components/DataTable";`
   → `import { DataView } from "@/components/views/DataViewServer";`
   (Client components instead use `import { DataView } from "@/components/views/DataView";`.)
2. **Type imports:** `Column<T>` → `DataViewColumn<T>` and `SpotlightRule<T>` from
   `@/components/views/DataViewServer` (re-exported) or `@/components/views`.
   The shapes are supersets — column defs need no edits.
3. **JSX rename:** `<DataTable …>` → `<DataView …>`. Every existing prop keeps its name and
   meaning (`stickyHeader`/`maxHeight` remain accepted+absorbed).
4. **Face cleanup (W2, do it in the same pass):**
   - delete `className: "font-mono text-xs"` on columns / `<span className="font-mono text-xs">`
     in cell renderers → set `mono: true` on the column instead;
   - money/count columns with hand-rolled `tabular-nums` (+ right alignment) → `numeric: true`
     (or `tabular: true` when left-aligned);
   - never introduce `font-mono` in cells.
5. **Optional upgrades** (only when the page wants them): `views`/`defaultView`,
   `board={{ lanes, laneOf, renderCard, onMove }}` (`onMove` MUST be a server action),
   `gallery={{ toItem | renderCard }}`, `peek={{ render, title?, hrefOf? }}`, `zebra`.
6. **Verify:** `tsc` the file's tree; render the page; confirm (a) sort/filter/search behave,
   (b) empty state still shows ghost headers, (c) mono/numeric cells paint IBM Plex
   (inspect: `font-family` resolves `--p-mono-data`), (d) row links + kebab actions intact.
7. **Do not** re-export DataView from any new barrel, add it to `ui/`, or import
   `DataViewServer` from a client component (build error via `next/headers` — by design).

## Verification run (B0)

- `npx tsc --noEmit` — exit 0 (full repo).
- `npx eslint` on all 7 changed files — exit 0.
- `vitest`: `DataView.smoke.test.tsx` (7 tests — 4 new: rich columns + data-face assertion,
  structure-preserving empty, skeleton, serialized adapters), `DataTable.totals`,
  `DataTable.inline-edit`, `component-maturity`, `design-system`, `ia-lint`,
  `list-honesty-canon` — all green.

## Deliberately deferred to B1+

- Migrating ANY of the 268 DataTable call sites (B1 pilot slice: finance + projects + people).
- The DataTable.tsx:305 mono fix itself (W2 owns DataTable).
- `InteractiveColumn.headerClassName` engine support (add on first real need).
- Import-guard forbidding new `@/components/DataTable` imports (B-final ratchet).
- Catalog keys for the new `dataView.*` strings (3-arg fallbacks render correctly today; the
  i18n sweep pipeline can catalog them with the next batch).
