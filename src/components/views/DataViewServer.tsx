import type { ReactNode } from "react";
import { headers } from "next/headers";
import type {
  InteractiveColumn,
  InteractiveRow,
  BulkAction as InteractiveBulkAction,
  BulkActionResult,
} from "@/components/DataTableInteractive";
import type { RowActionItem } from "@/components/ui/RowActions";
import type { ViewConfigRow, ViewScope, ViewType } from "@/lib/views/types";
import type { SaveViewSubmit } from "./SaveViewDialog";
import type { DataViewKind } from "./DataViewKind";
import type { KanbanLane } from "./KanbanBoard";
import type { GalleryItem } from "./GalleryView";
import { DataView as DataViewClient } from "./DataView";
import { toInteractiveColumns, toInteractiveRow, type DataViewColumn, type SpotlightRule } from "./data-view-model";

/**
 * DataView (server entry) — the drop-in replacement for the legacy
 * `@/components/DataTable` server wrapper, targeting the canonical
 * `views/DataView` collection surface (Option B, ratified 2026-07-22).
 *
 * A DataTable call site migrates mechanically (B0_PARITY.md §Recipe):
 *
 *     - import { DataTable } from "@/components/DataTable";
 *     + import { DataView } from "@/components/views/DataViewServer";
 *       …
 *     - <DataTable rows={rows} columns={columns} … />
 *     + <DataView rows={rows} columns={columns} … />
 *
 * Props are a strict superset of `DataTableProps`: the same column defs
 * (`Column<T>` is structurally a `DataViewColumn<T>`), the same chrome
 * (rowHref, rowActions, spotlight, bulk, saved views, empty/skeleton), plus
 * the DataView extras — `views`/`defaultView` view-switching and the
 * `board`/`gallery`/`peek` adapters, whose render functions run HERE on the
 * server and cross to the client pre-rendered (keyed by row id).
 *
 * Like DataTable, this pre-renders cells with the caller's per-row `render`
 * fns, derives scalar `values[]` from `accessor` (falling back to stripped
 * cell text), and auto-derives a stable `tableId` from the pathname. Unlike
 * DataTable, `mono`/`tabular`/`numeric` columns compose the sanctioned DATA
 * face (IBM Plex Mono via `--p-mono-data` + `tabular-nums`; `.ps-table .num`
 * for `numeric`) — never Tailwind's `font-mono` (Space Mono).
 *
 * Serialization contract (RSC boundary): every function that survives to the
 * client — bulk `perform`, `onMove`, `onImport`/`onRefresh`/`onCellEdit`,
 * `onSaveView`/`onDeleteView`/`onSetDefaultView`, `totalFormat` — must be a
 * server-action ref or otherwise client-safe callable.
 */

export type DataViewServerBoard<T extends { id: string }> = {
  lanes: KanbanLane<T>[];
  laneOf: (row: T) => string | null | undefined;
  renderCard: (row: T) => ReactNode;
  /** Server-action ref — persists the lane move. */
  onMove: (rowId: string, toLaneId: string) => Promise<void>;
  hrefOf?: (row: T) => string | undefined;
};

export type DataViewServerGallery<T extends { id: string }> = { columns?: 2 | 3 | 4 | 5 } & (
  | { toItem: (row: T) => GalleryItem }
  | { renderCard: (row: T) => ReactNode }
);

export type DataViewServerPeek<T extends { id: string }> = {
  title?: (row: T) => ReactNode;
  render: (row: T) => ReactNode;
  hrefOf?: (row: T) => string | undefined;
};

export type DataViewServerProps<T extends { id: string }> = {
  rows: T[];
  columns: DataViewColumn<T>[];
  rowHref?: (row: T) => string | undefined;
  emptyLabel?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  loading?: boolean;
  density?: "comfortable" | "compact";
  /** Absorbed (parity with DataTable): the interactive table always pins the
   *  header and bounds body height. Kept so call sites compile unchanged. */
  stickyHeader?: boolean;
  /** Absorbed — see `stickyHeader`. */
  maxHeight?: string;
  /** Stable identifier — overrides the auto-derived tableId. */
  tableId?: string;
  searchable?: boolean;
  pageSize?: number;
  rowActions?: (row: T) => RowActionItem[] | null | undefined;
  bulkActions?: Array<{
    id: string;
    label: string;
    variant?: "default" | "danger";
    perform: (ids: string[]) => BulkActionResult | Promise<BulkActionResult>;
  }>;
  totalCount?: number;
  onImport?: (file: File) => void | Promise<void>;
  onRefresh?: () => void | Promise<void>;
  onCellEdit?: (rowId: string, columnKey: string, value: string) => void | Promise<void>;
  rowClassName?: (row: T) => string | undefined;
  spotlight?: SpotlightRule<T>[];
  viewType?: ViewType;
  viewConfigsForTable?: ViewConfigRow[];
  allowedSaveScopes?: ViewScope[];
  onSaveView?: (input: SaveViewSubmit) => Promise<void>;
  onDeleteView?: (id: string) => Promise<void>;
  onSetDefaultView?: (id: string) => Promise<void>;
  /** DataView extras — allowed view kinds (defaults to table + present adapters). */
  views?: readonly DataViewKind[];
  defaultView?: DataViewKind;
  /** Alternating row tint (`.ps-table--zebra`). */
  zebra?: boolean;
  board?: DataViewServerBoard<T>;
  gallery?: DataViewServerGallery<T>;
  peek?: DataViewServerPeek<T>;
};

function normalizePath(p: string): string {
  try {
    const u = p.startsWith("http") ? new URL(p) : { pathname: p };
    return (u.pathname || "/").replace(/\/+$/, "") || "/";
  } catch {
    return p;
  }
}

async function deriveTableId<T>(columns: readonly DataViewColumn<T>[]): Promise<string> {
  try {
    const h = await headers();
    const path = h.get("x-pathname") ?? h.get("x-invoke-path") ?? h.get("referer") ?? "";
    if (path) return `t:${normalizePath(path)}:${columns.map((c) => c.key).join(",")}`;
  } catch {
    /* not in a request scope — fall through to fingerprint */
  }
  return `t:${columns.map((c) => c.key).join(",")}`;
}

export async function DataView<T extends { id: string }>({
  rows,
  columns,
  rowHref,
  emptyLabel,
  emptyDescription,
  emptyAction,
  loading,
  density,
  stickyHeader: _stickyHeader,
  maxHeight: _maxHeight,
  tableId,
  searchable,
  pageSize,
  rowActions,
  bulkActions,
  totalCount,
  onImport,
  onRefresh,
  onCellEdit,
  rowClassName,
  spotlight,
  viewType,
  viewConfigsForTable,
  allowedSaveScopes,
  onSaveView,
  onDeleteView,
  onSetDefaultView,
  views,
  defaultView,
  zebra,
  board,
  gallery,
  peek,
}: DataViewServerProps<T>) {
  const resolvedTableId = tableId ?? (await deriveTableId(columns));

  const interactiveCols: InteractiveColumn[] = toInteractiveColumns(columns);
  const interactiveRows: InteractiveRow[] = rows.map((row) =>
    toInteractiveRow(row, columns, { rowHref, rowActions, rowClassName, spotlight }),
  );

  const interactiveBulk: InteractiveBulkAction[] | undefined = bulkActions?.map((a) => ({
    id: a.id,
    label: a.label,
    variant: a.variant,
    perform: a.perform,
  }));

  // ── Pre-render the view adapters into their serialized (by-row) forms so
  //    no caller function crosses the RSC boundary.
  const boardStatic = board
    ? {
        // Strip the phantom `_row` so the lane defs retype cleanly against
        // the client core's InteractiveRow generic (no unsafe cast).
        lanes: board.lanes.map(
          ({ id, title, tone, locked }): KanbanLane<InteractiveRow> => ({ id, title, tone, locked }),
        ),
        laneIdByRow: Object.fromEntries(rows.map((r) => [r.id, board.laneOf(r) ?? null])),
        cardByRow: Object.fromEntries(rows.map((r) => [r.id, board.renderCard(r)])),
        hrefByRow: board.hrefOf ? Object.fromEntries(rows.map((r) => [r.id, board.hrefOf?.(r)])) : undefined,
        onMove: board.onMove,
      }
    : undefined;

  const galleryStatic = gallery
    ? "toItem" in gallery
      ? { items: rows.map((r) => gallery.toItem(r)), columns: gallery.columns }
      : {
          cardByRow: Object.fromEntries(rows.map((r) => [r.id, gallery.renderCard(r)])),
          columns: gallery.columns,
        }
    : undefined;

  const peekStatic = peek
    ? {
        byRow: Object.fromEntries(
          rows.map((r) => [
            r.id,
            { title: peek.title?.(r), body: peek.render(r), href: peek.hrefOf?.(r) },
          ]),
        ),
      }
    : undefined;

  // Default view kinds mirror the client core: table + present adapters.
  let allowed: readonly DataViewKind[] | undefined = views;
  if (!allowed && (board || gallery)) {
    const ks: DataViewKind[] = ["table"];
    if (board) ks.push("board");
    if (gallery) ks.push("gallery");
    allowed = ks;
  }

  return (
    <DataViewClient<InteractiveRow>
      tableId={resolvedTableId}
      rows={interactiveRows}
      columns={interactiveCols}
      views={allowed}
      defaultView={defaultView}
      searchable={searchable ?? true}
      bulkActions={interactiveBulk}
      pageSize={pageSize}
      loading={loading}
      emptyLabel={emptyLabel}
      emptyDescription={emptyDescription}
      emptyAction={emptyAction}
      totalCount={totalCount}
      density={density}
      zebra={zebra}
      onImport={onImport}
      onRefresh={onRefresh}
      onCellEdit={onCellEdit}
      viewType={viewType}
      viewConfigsForTable={viewConfigsForTable}
      allowedSaveScopes={allowedSaveScopes}
      onSaveView={onSaveView}
      onDeleteView={onDeleteView}
      onSetDefaultView={onSetDefaultView}
      board={boardStatic}
      gallery={galleryStatic}
      peek={peekStatic}
    />
  );
}

export type { DataViewColumn, SpotlightRule } from "./data-view-model";
