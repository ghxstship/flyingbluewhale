"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DataTableInteractive,
  type InteractiveColumn,
  type InteractiveRow,
  type BulkAction,
} from "@/components/DataTableInteractive";
import type { RowActionItem } from "@/components/ui/RowActions";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/Sheet";
import type { ViewConfigRow, ViewScope, ViewType } from "@/lib/views/types";
import type { SaveViewSubmit } from "./SaveViewDialog";
import { KanbanBoard, type KanbanLane } from "./KanbanBoard";
import { GalleryView, type GalleryItem } from "./GalleryView";
import { DataViewSwitcher } from "./DataViewSwitcher";
import type { DataViewKind } from "./DataViewKind";
import {
  isRichColumns,
  toInteractiveColumns,
  toInteractiveRow,
  type DataViewColumn,
  type SpotlightRule,
} from "./data-view-model";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * DataView — the ONE canonical collection surface (ATLVS kit / ADR-0006 /
 * Option B ratified 2026-07-22). Composes the mature pieces the repo already
 * ships instead of every list page re-wiring them:
 *   • view toggle (`DataViewSwitcher`, owns `?view=`)
 *   • table path → `DataTableInteractive` (search · per-column filter · group ·
 *     sort · bulk-select floating bar · row-action menu · saved views)
 *   • board path → `KanbanBoard`, gallery/cards path → `GalleryView` or a
 *     free-form card grid
 *   • a right-`Sheet` row-peek drawer, available across views, added fork-free
 *     by injecting a "Peek" row action + tapping card clicks.
 *
 * Two column APIs (B0 · DataTable-parity hardening):
 *   1. RICH (preferred; DataTable-shaped): pass `columns: DataViewColumn<Row>[]`
 *      (each with a `render` fn) — cells/values/spotlight/rowHref/rowActions
 *      are derived here, exactly like `DataTable` did, but with the corrected
 *      DATA mono face (IBM Plex, `--p-mono-data`) on `mono`/`tabular`/`numeric`
 *      columns. Client components only — render fns can't cross the RSC
 *      boundary; server pages use `views/DataViewServer` instead.
 *   2. LOW-LEVEL (legacy): pass `columns: InteractiveColumn[]` + `toRow`.
 *      When `toRow` is omitted the rows must already be `InteractiveRow`s
 *      (that's the serialized path `DataViewServer` uses).
 *
 * Board/gallery/peek adapters each accept a functional form (client callers)
 * or a serialized-by-row form (what `DataViewServer` precomputes), so the
 * view-switching survives the server boundary.
 */
export type DataViewPeek<Row> =
  | {
      title?: (row: Row) => React.ReactNode;
      render: (row: Row) => React.ReactNode;
      /** Full record page for a row. Lights up the kit W0 peek contract: ⌘↵
       *  promotes the open peek to the record page, and an "Open Full" link
       *  renders in the peek header. */
      hrefOf?: (row: Row) => string | undefined;
    }
  | {
      /** Serialized form — pre-rendered peek content keyed by row id
       *  (what `DataViewServer` sends across the RSC boundary). */
      byRow: Record<string, { title?: React.ReactNode; body: React.ReactNode; href?: string }>;
    };

export type DataViewBoard<Row extends { id: string }> =
  | {
      lanes: KanbanLane<Row>[];
      laneOf: (row: Row) => string | null | undefined;
      renderCard: (row: Row) => React.ReactNode;
      onMove: (rowId: string, toLaneId: string) => Promise<void> | void;
      hrefOf?: (row: Row) => string | undefined;
    }
  | {
      /** Serialized form — lane membership + pre-rendered cards keyed by
       *  row id. `onMove` must be a server-action ref. */
      lanes: KanbanLane<Row>[];
      laneIdByRow: Record<string, string | null>;
      cardByRow: Record<string, React.ReactNode>;
      hrefByRow?: Record<string, string | undefined>;
      onMove: (rowId: string, toLaneId: string) => Promise<void> | void;
    };

export type DataViewGallery<Row> = { columns?: 2 | 3 | 4 | 5 } & (
  | { toItem: (row: Row) => GalleryItem }
  | { items: GalleryItem[] }
  /** Free-form card grid (absorbs the retired `ui/DataView` grid mode). */
  | { renderCard: (row: Row) => React.ReactNode }
  | { cardByRow: Record<string, React.ReactNode> }
);

export type DataViewProps<Row extends { id: string }> = {
  /** Stable id — drives the table's URL keys + saved-view persistence. */
  tableId: string;
  rows: Row[];
  /** Rich (DataTable-shaped, with `render`) or low-level interactive columns. */
  columns: readonly DataViewColumn<Row>[] | readonly InteractiveColumn[];
  /** Low-level API only: map a domain row → the table's InteractiveRow.
   *  Ignored when rich columns are passed; when omitted with low-level
   *  columns the rows must already be `InteractiveRow`-shaped. */
  toRow?: (row: Row) => InteractiveRow;
  /** Rich API: detail href per row (row click-through). */
  rowHref?: (row: Row) => string | undefined;
  /** Rich API: per-row kebab-menu actions. */
  rowActions?: (row: Row) => RowActionItem[] | null | undefined;
  /** Rich API: ad-hoc per-row className. Prefer `spotlight`. */
  rowClassName?: (row: Row) => string | undefined;
  /** Rich API: structured conditional row/cell formatting rules. */
  spotlight?: SpotlightRule<Row>[];
  /** Allowed view kinds; defaults to `table` + whatever adapters are present. */
  views?: readonly DataViewKind[];
  defaultView?: DataViewKind;
  searchable?: boolean;
  bulkActions?: BulkAction[];
  pageSize?: number;
  /** Render the table skeleton (loading state). */
  loading?: boolean;
  emptyLabel?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  totalCount?: number;
  density?: "comfortable" | "compact";
  /** Alternating row tint (`.ps-table--zebra`) for dense grids. */
  zebra?: boolean;
  onImport?: (file: File) => void | Promise<void>;
  onRefresh?: () => void | Promise<void>;
  onCellEdit?: (rowId: string, columnKey: string, value: string) => void | Promise<void>;
  viewType?: ViewType;
  viewConfigsForTable?: ViewConfigRow[];
  allowedSaveScopes?: ViewScope[];
  onSaveView?: (input: SaveViewSubmit) => Promise<void>;
  onDeleteView?: (id: string) => Promise<void>;
  onSetDefaultView?: (id: string) => Promise<void>;
  board?: DataViewBoard<Row>;
  gallery?: DataViewGallery<Row>;
  /** Right-drawer record peek. When set, every view exposes a way to open it. */
  peek?: DataViewPeek<Row>;
};

export function DataView<Row extends { id: string }>({
  tableId,
  rows,
  columns,
  toRow,
  rowHref,
  rowActions,
  rowClassName,
  spotlight,
  views,
  defaultView,
  searchable = true,
  bulkActions,
  pageSize,
  loading,
  emptyLabel,
  emptyDescription,
  emptyAction,
  totalCount,
  density,
  zebra,
  onImport,
  onRefresh,
  onCellEdit,
  viewType,
  viewConfigsForTable,
  allowedSaveScopes,
  onSaveView,
  onDeleteView,
  onSetDefaultView,
  board,
  gallery,
  peek,
}: DataViewProps<Row>) {
  const t = useT();

  // ── Adapter normalization — collapse the serialized (by-row) forms onto
  //    the functional shape so the render paths below stay single-track.
  const peekN = React.useMemo(() => {
    if (!peek) return undefined;
    if ("render" in peek) return peek;
    return {
      title: (r: Row) => peek.byRow[r.id]?.title,
      render: (r: Row) => peek.byRow[r.id]?.body,
      hrefOf: (r: Row) => peek.byRow[r.id]?.href,
    };
  }, [peek]);
  const boardN = React.useMemo(() => {
    if (!board) return undefined;
    if ("laneOf" in board) return board;
    return {
      lanes: board.lanes,
      laneOf: (r: Row) => board.laneIdByRow[r.id],
      renderCard: (r: Row) => board.cardByRow[r.id],
      onMove: board.onMove,
      hrefOf: board.hrefByRow ? (r: Row) => board.hrefByRow?.[r.id] : undefined,
    };
  }, [board]);

  const allowed = React.useMemo<readonly DataViewKind[]>(() => {
    if (views && views.length) return views;
    const ks: DataViewKind[] = ["table"];
    if (board) ks.push("board");
    if (gallery) ks.push("gallery");
    return ks;
  }, [views, board, gallery]);

  const fallback = defaultView && allowed.includes(defaultView) ? defaultView : allowed[0]!;
  const params = useSearchParams();
  const router = useRouter();
  const raw = params?.get("view") ?? undefined;
  const view: DataViewKind = raw && allowed.includes(raw as DataViewKind) ? (raw as DataViewKind) : fallback;

  const [peekRow, setPeekRow] = React.useState<Row | null>(null);
  const byId = React.useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);

  // Kit W0 — peek deep links: `?peek=<id>` mirrors the open peek so the URL
  // is shareable and survives reload; restored once on mount, and kept in
  // sync (replace, no history spam) as the peek opens/closes.
  const setPeekParam = React.useCallback(
    (id: string | null) => {
      const sp = new URLSearchParams(window.location.search);
      if (id) sp.set("peek", id);
      else sp.delete("peek");
      const qs = sp.toString();
      window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
    },
    [],
  );
  const openPeek = React.useCallback(
    (row: Row) => {
      setPeekRow(row);
      setPeekParam(row.id);
    },
    [setPeekParam],
  );
  const closePeek = React.useCallback(() => {
    setPeekRow(null);
    setPeekParam(null);
  }, [setPeekParam]);
  const restoredRef = React.useRef(false);
  React.useEffect(() => {
    if (restoredRef.current || !peekN) return;
    restoredRef.current = true;
    const id = params?.get("peek");
    if (!id) return;
    const row = byId.get(id);
    if (row) setPeekRow(row);
  }, [params, peekN, byId]);

  // Kit W0 — ⌘↵ / Ctrl+↵ promotes the open peek to its full record page.
  React.useEffect(() => {
    if (!peekRow || !peekN?.hrefOf) return;
    const href = peekN.hrefOf(peekRow);
    if (!href) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        router.push(href);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [peekRow, peekN, router]);

  // ── Column/row mapping — rich (DataTable-shaped) columns are mapped here
  //    with the corrected data face; low-level columns pass straight through.
  const rich = isRichColumns<Row>(columns);
  const interactiveCols = React.useMemo<InteractiveColumn[]>(
    () => (rich ? toInteractiveColumns(columns as readonly DataViewColumn<Row>[]) : (columns as InteractiveColumn[])),
    [rich, columns],
  );
  const mapRow = React.useCallback(
    (r: Row): InteractiveRow => {
      if (rich) {
        return toInteractiveRow(r, columns as readonly DataViewColumn<Row>[], {
          rowHref,
          rowActions,
          rowClassName,
          spotlight,
        });
      }
      if (toRow) return toRow(r);
      // Serialized path (DataViewServer): rows already carry cells/values.
      return r as unknown as InteractiveRow;
    },
    [rich, columns, toRow, rowHref, rowActions, rowClassName, spotlight],
  );

  // Table path — inject a "Peek" row action when a peek drawer is configured.
  const peekLabel = t("dataView.peek", undefined, "Peek");
  const tableRows = React.useMemo<InteractiveRow[]>(
    () =>
      rows.map((r) => {
        const ir = mapRow(r);
        if (!peekN) return ir;
        const peekAction = { label: peekLabel, onSelect: () => openPeek(r) } as const;
        return { ...ir, actions: [...(ir.actions ?? []), peekAction] };
      }),
    [rows, mapRow, peekN, openPeek, peekLabel],
  );

  if (loading) {
    return <DataViewSkeleton columns={interactiveCols.length || 4} rows={6} />;
  }

  const galleryColumns = gallery?.columns;

  return (
    <>
      {allowed.length > 1 && (
        <div className="mb-3 flex items-center justify-end">
          <DataViewSwitcher current={view} allowed={allowed} defaultView={fallback} />
        </div>
      )}

      {view === "table" &&
        (rows.length === 0 ? (
          <DataViewEmpty
            columns={interactiveCols}
            title={emptyLabel ?? t("dataTable.emptyLabel", undefined, "No records yet")}
            description={emptyDescription}
            action={emptyAction}
          />
        ) : (
          <DataTableInteractive
            tableId={tableId}
            rows={tableRows}
            columns={interactiveCols}
            searchable={searchable}
            bulkActions={bulkActions}
            pageSize={pageSize}
            emptyLabel={emptyLabel}
            totalCount={totalCount}
            density={density}
            tableClassName={zebra ? "ps-table--zebra" : undefined}
            onImport={onImport}
            onRefresh={onRefresh}
            onCellEdit={onCellEdit}
            viewType={viewType}
            viewConfigsForTable={viewConfigsForTable}
            allowedSaveScopes={allowedSaveScopes}
            onSaveView={onSaveView}
            onDeleteView={onDeleteView}
            onSetDefaultView={onSetDefaultView}
          />
        ))}

      {view === "board" && boardN && (
        <KanbanBoard
          rows={rows}
          lanes={boardN.lanes}
          laneOf={boardN.laneOf}
          onMove={boardN.onMove}
          hrefOf={peekN ? undefined : boardN.hrefOf}
          renderCard={(r) =>
            peekN ? (
              <button type="button" className="block w-full text-start" onClick={() => openPeek(r)}>
                {boardN.renderCard(r)}
              </button>
            ) : (
              boardN.renderCard(r)
            )
          }
        />
      )}

      {view === "gallery" &&
        gallery &&
        ("toItem" in gallery || "items" in gallery ? (
          <GalleryView
            columns={galleryColumns}
            items={("items" in gallery ? gallery.items : rows.map((r) => gallery.toItem(r))).map((item) => {
              if (!peekN) return item;
              const row = byId.get(item.id);
              return row ? { ...item, href: undefined, onClick: () => openPeek(row) } : item;
            })}
          />
        ) : (
          <CardGrid
            rows={rows}
            columns={galleryColumns}
            renderCard={(r) => ("renderCard" in gallery ? gallery.renderCard(r) : gallery.cardByRow[r.id])}
            onOpen={peekN ? openPeek : undefined}
            emptyLabel={emptyLabel ?? t("dataTable.emptyLabel", undefined, "No records yet")}
          />
        ))}

      {peekN && (
        <Sheet open={peekRow !== null} onOpenChange={(o) => !o && closePeek()}>
          <SheetContent>
            {peekRow && (
              <>
                <SheetHeader>
                  <SheetTitle>
                    {peekN.title ? peekN.title(peekRow) : t("dataView.detailsTitle", undefined, "Details")}
                  </SheetTitle>
                  {peekN.hrefOf?.(peekRow) ? (
                    <a
                      href={peekN.hrefOf(peekRow)}
                      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[var(--p-accent-text)] hover:underline"
                    >
                      {t("dataView.openFull", undefined, "Open Full")}
                      <kbd className="rounded bg-[var(--p-surface-2,var(--p-bg))] px-1 py-0.5 font-[family-name:var(--p-mono-data,var(--p-mono))] text-[11px] text-[var(--p-text-3)]">
                        ⌘↵
                      </kbd>
                    </a>
                  ) : null}
                </SheetHeader>
                <div className="px-1 py-2">{peekN.render(byId.get(peekRow.id) ?? peekRow)}</div>
              </>
            )}
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}

/**
 * CardGrid — free-form card grid for the gallery view when the caller wants
 * to own the whole card body (absorbs the retired `ui/DataView` grid mode).
 * Cards become buttons when a peek drawer is configured.
 */
function CardGrid<Row extends { id: string }>({
  rows,
  columns = 3,
  renderCard,
  onOpen,
  emptyLabel,
}: {
  rows: Row[];
  columns?: 2 | 3 | 4 | 5;
  renderCard: (row: Row) => React.ReactNode;
  onOpen?: (row: Row) => void;
  emptyLabel: string;
}) {
  const COLS: Record<2 | 3 | 4 | 5, string> = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    5: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
  };
  if (rows.length === 0) {
    return <EmptyState title={emptyLabel} />;
  }
  return (
    <div role="list" className={`grid grid-cols-1 gap-3 ${COLS[columns]}`}>
      {rows.map((row) =>
        onOpen ? (
          <button
            key={row.id}
            type="button"
            role="listitem"
            onClick={() => onOpen(row)}
            className="surface hover-lift p-4 text-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--p-focus)]"
          >
            {renderCard(row)}
          </button>
        ) : (
          <div key={row.id} role="listitem" className="surface p-4">
            {renderCard(row)}
          </div>
        ),
      )}
    </div>
  );
}

/**
 * DataViewEmpty — structure-preserving empty state (ported from DataTable so
 * migrated surfaces keep the identical blank-slate: headers stay live, ghost
 * rows show field shape, the message centers over them via the canonical
 * `<EmptyState>` primitive).
 */
function DataViewEmpty({
  columns,
  title,
  description,
  action,
  ghostRows = 4,
}: {
  columns: readonly InteractiveColumn[];
  title: string;
  description?: string;
  action?: React.ReactNode;
  ghostRows?: number;
}) {
  return (
    <div className="relative overflow-x-auto">
      {/* Screen-reader announcement lives in its own status region so the
          interactive empty-state action below is NOT nested inside a live
          region (AX-9). The ghost table is purely decorative. */}
      <p role="status" className="sr-only">
        {title}
        {description ? `. ${description}` : null}
      </p>
      <table className="ps-table" aria-hidden="true">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className={c.className}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: ghostRows }).map((_, r) => (
            <tr key={r} className="opacity-30" style={{ borderBottomStyle: "dashed" }}>
              {columns.map((c) => (
                <td key={c.key} className={c.className}>
                  <span className="text-[var(--p-text-2)]">—</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 px-4">
        <div className="pointer-events-auto mx-auto max-w-sm rounded-md border border-[var(--p-border)] bg-[var(--p-bg)]/95 backdrop-blur-md">
          <EmptyState size="compact" title={title} description={description} action={action} />
        </div>
      </div>
    </div>
  );
}

function DataViewSkeleton({ columns, rows }: { columns: number; rows: number }) {
  const t = useT();
  return (
    <div className="overflow-x-auto" aria-busy="true" aria-label={t("dataView.loading", undefined, "Loading table")}>
      <table className="ps-table">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} scope="col">
                <Skeleton width={80} height={16} radius="var(--p-r-sm)" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: columns }).map((_, c) => (
                <td key={c}>
                  <Skeleton className="max-w-[160px]" width="100%" height={16} radius="var(--p-r-sm)" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export type { DataViewColumn, SpotlightRule } from "./data-view-model";
