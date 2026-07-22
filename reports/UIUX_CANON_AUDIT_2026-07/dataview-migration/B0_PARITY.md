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
| `column.total` / `totalFormat` (footer aggregates) | ~50 / 3 | ✗ (manual) | ✓ mapped; B1 added the serializable `TotalFormatSpec` form (`{ style: "money", currency?, dashWhenNotPositive? }`) so server pages never pass a closure — see Hazards + §B1 harvest |
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
  **B1 resolution:** the engine now accepts a serializable `TotalFormatSpec`
  (`InteractiveColumn.totalFormat: ((n) => string) | { style: "money"; currency?; dashWhenNotPositive? }`,
  resolved client-side via `formatMoney`; aggregate treated as minor units/cents). The
  `procurement/scorecards` site migrated onto `{ style: "money" }` in the B1 pilot; the two
  remaining closure sites (`kits/[kitId]` → `{ style: "money" }` for its `formatCents` sum,
  `rfqs/[rfqId]/responses` → `{ style: "money", dashWhenNotPositive: true }` for its
  `n > 0 ? formatMoney(n) : "—"` min) map 1:1 and are B2 work. Guarded by a new case in
  `DataTable.totals.test.tsx`.
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

## §B1 harvest (pilot findings, 2026-07-22)

13-site pilot migrated (finance ×4, projects ×4, people/workforce ×3, saved-views ×1,
totalFormat-hazard ×1 — full list in the B1 report). The recipe held mechanically on all 13:
**zero sites had to be replaced**, no `InteractiveColumn.headerClassName` engine support was
needed (the one `headerClassName: "text-right"` encountered was a money column that upgraded
to `numeric: true`, which right-aligns the header via the composed `num` class). Findings for
B2:

1. **`TotalFormatSpec` added (engine, additive).** See §Hazards — server pages express footer
   formatting as data (`totalFormat: { style: "money" }`), never a closure. B2 must migrate
   the two remaining closure sites (`kits/[kitId]`, `procurement/rfqs/[rfqId]/responses`) onto
   the spec — the mapping is listed in §Hazards. When B2 hits a non-money formatter, extend the
   spec union (additive) rather than passing a function from a server page.
2. **Zero client-component importers exist.** Every one of the 268 `@/components/DataTable`
   importers is a server component (verified by grep over `"use client"`), so the recipe's
   client-entry branch (§Recipe step 1, parenthetical) has an empty population in `src/app`.
   The client entry's rich-column path is already exercised by
   `legend/community/members/MembersDirectory.tsx` (migrated in B0) and by
   `DataView.smoke.test.tsx`. B2 fan-out can treat every site as the server-entry case.
3. **Hand-rolled board/view toggles are an OPTIONAL consolidation, not part of the mechanical
   pass.** `projects/[projectId]/advancing/assignments` carries its own List⇄Board toggle +
   `AssignmentsKanban` (client) whose `onMove` wraps a server action client-side and preserves
   the action's returned error message for the board's rollback announcement. Folding it into
   `DataView board={{ … }}` requires `onMove` to be a bare server-action ref that must THROW to
   trigger rollback — and thrown server-action messages are masked in production, so the
   operator would lose the "illegal transition" detail. Consolidating these pages needs a
   result-based (serializable) `onMove` error contract on the board adapter first — engine
   change, decide in B2. The pilot migrated the table branch only (recipe-pure) and left the
   board untouched.
4. **Face-cleanup rule applied, one judgment call documented.** `className: "font-mono text-xs"`
   → `mono: true` was applied mechanically, including on email/phone columns
   (`people/crew`) even though the `DataViewColumn.mono` doc says mono is not for
   emails/phones — the pilot preserves the page's existing visual intent (face corrected to
   IBM Plex, no layout change). Whether those columns should drop mono entirely is a design
   ruling for the B2 sweep, not a per-site improvisation.
5. **Multi-table pages are safe.** Pages with 2-3 tables (`projects/[projectId]/finance` ×3,
   `people/invites` ×2) migrate cleanly: explicit `tableId`s carry over, and the auto-derived
   id remains distinct per table because it fingerprints column keys alongside the pathname.
6. **`?view=` co-existence.** A migrated table on a page that ALSO hand-rolls a `?view=` param
   (assignments List⇄Board) does not conflict: when the foreign value (`board`) is active the
   page doesn't render DataView, and DataView ignores `?view=` values outside its allowed set.
   B2 sites that keep hand-rolled toggles must preserve that same either/or structure.

## Deliberately deferred to B1+

- ~~Migrating ANY of the 268 DataTable call sites~~ — B1 pilot migrated 13 (finance + projects
  + people + saved-views + the scorecards totalFormat site); 255 remain for B2.
- The DataTable.tsx:305 mono fix itself (W2 owns DataTable).
- `InteractiveColumn.headerClassName` engine support (add on first real need).
- Import-guard forbidding new `@/components/DataTable` imports (B-final ratchet).
- Catalog keys for the new `dataView.*` strings (3-arg fallbacks render correctly today; the
  i18n sweep pipeline can catalog them with the next batch).
