"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DataTableInteractive, type InteractiveColumn, type InteractiveRow, type BulkAction } from "@/components/DataTableInteractive";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/Sheet";
import { KanbanBoard, type KanbanLane } from "./KanbanBoard";
import { GalleryView, type GalleryItem } from "./GalleryView";
import { DataViewSwitcher } from "./DataViewSwitcher";
import type { DataViewKind } from "./DataViewKind";

/**
 * DataView — the ONE canonical collection surface (ATLVS kit / ADR-0006 /
 * IMPLEMENT_FOUR_APPS §1). Composes the mature pieces the repo already ships
 * instead of every list page re-wiring them:
 *   • view toggle (`DataViewSwitcher`, owns `?view=`)
 *   • table path → `DataTableInteractive` (search · per-column filter · group ·
 *     sort · bulk-select floating bar · row-action menu · saved views)
 *   • board path → `KanbanBoard`, gallery path → `GalleryView`
 *   • a right-`Sheet` row-peek drawer, available across views, added fork-free
 *     by injecting a "Peek" row action + tapping card clicks.
 *
 * Generic over the caller's domain `Row` (must have a string `id`); `toRow`
 * maps it to the table's `InteractiveRow`. Provide a `board` / `gallery`
 * adapter to light up those view kinds; `views` defaults to whatever adapters
 * are present (+ `table`).
 */
export type DataViewPeek<Row> = {
  title?: (row: Row) => React.ReactNode;
  render: (row: Row) => React.ReactNode;
  /** Full record page for a row. Lights up the kit W0 peek contract: ⌘↵
   *  promotes the open peek to the record page, and an "Open Full" link
   *  renders in the peek header. */
  hrefOf?: (row: Row) => string | undefined;
};

export type DataViewBoard<Row extends { id: string }> = {
  lanes: KanbanLane<Row>[];
  laneOf: (row: Row) => string | null | undefined;
  renderCard: (row: Row) => React.ReactNode;
  onMove: (rowId: string, toLaneId: string) => Promise<void> | void;
  hrefOf?: (row: Row) => string | undefined;
};

export type DataViewGallery<Row> = {
  toItem: (row: Row) => GalleryItem;
  columns?: 2 | 3 | 4 | 5;
};

export type DataViewProps<Row extends { id: string }> = {
  /** Stable id — drives the table's URL keys + saved-view persistence. */
  tableId: string;
  rows: Row[];
  columns: InteractiveColumn[];
  /** Map a domain row → the table's InteractiveRow (cells/values/href/actions). */
  toRow: (row: Row) => InteractiveRow;
  /** Allowed view kinds; defaults to `table` + whatever adapters are present. */
  views?: readonly DataViewKind[];
  defaultView?: DataViewKind;
  searchable?: boolean;
  bulkActions?: BulkAction[];
  pageSize?: number;
  emptyLabel?: string;
  totalCount?: number;
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
  views,
  defaultView,
  searchable = true,
  bulkActions,
  pageSize,
  emptyLabel,
  totalCount,
  board,
  gallery,
  peek,
}: DataViewProps<Row>) {
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
    if (restoredRef.current || !peek) return;
    restoredRef.current = true;
    const id = params?.get("peek");
    if (!id) return;
    const row = byId.get(id);
    if (row) setPeekRow(row);
  }, [params, peek, byId]);

  // Kit W0 — ⌘↵ / Ctrl+↵ promotes the open peek to its full record page.
  React.useEffect(() => {
    if (!peekRow || !peek?.hrefOf) return;
    const href = peek.hrefOf(peekRow);
    if (!href) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        router.push(href);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [peekRow, peek, router]);

  // Table path — inject a "Peek" row action when a peek drawer is configured.
  const tableRows = React.useMemo<InteractiveRow[]>(
    () =>
      rows.map((r) => {
        const ir = toRow(r);
        if (!peek) return ir;
        const peekAction = { label: "Peek", onSelect: () => openPeek(r) } as const;
        return { ...ir, actions: [...(ir.actions ?? []), peekAction] };
      }),
    [rows, toRow, peek, openPeek],
  );

  return (
    <>
      {allowed.length > 1 && (
        <div className="mb-3 flex items-center justify-end">
          <DataViewSwitcher current={view} allowed={allowed} defaultView={fallback} />
        </div>
      )}

      {view === "table" && (
        <DataTableInteractive
          tableId={tableId}
          rows={tableRows}
          columns={columns}
          searchable={searchable}
          bulkActions={bulkActions}
          pageSize={pageSize}
          emptyLabel={emptyLabel}
          totalCount={totalCount}
        />
      )}

      {view === "board" && board && (
        <KanbanBoard
          rows={rows}
          lanes={board.lanes}
          laneOf={board.laneOf}
          onMove={board.onMove}
          hrefOf={peek ? undefined : board.hrefOf}
          renderCard={(r) =>
            peek ? (
              <button type="button" className="block w-full text-start" onClick={() => openPeek(r)}>
                {board.renderCard(r)}
              </button>
            ) : (
              board.renderCard(r)
            )
          }
        />
      )}

      {view === "gallery" && gallery && (
        <GalleryView
          columns={gallery.columns}
          items={rows.map((r) => {
            const item = gallery.toItem(r);
            return peek ? { ...item, href: undefined, onClick: () => openPeek(r) } : item;
          })}
        />
      )}

      {peek && (
        <Sheet open={peekRow !== null} onOpenChange={(o) => !o && closePeek()}>
          <SheetContent>
            {peekRow && (
              <>
                <SheetHeader>
                  <SheetTitle>{peek.title ? peek.title(peekRow) : "Details"}</SheetTitle>
                  {peek.hrefOf?.(peekRow) ? (
                    <a
                      href={peek.hrefOf(peekRow)}
                      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[var(--p-accent-text)] hover:underline"
                    >
                      Open Full
                      <kbd className="rounded bg-[var(--p-surface-2,var(--p-bg))] px-1 py-0.5 font-mono text-[10px] text-[var(--p-text-3)]">
                        ⌘↵
                      </kbd>
                    </a>
                  ) : null}
                </SheetHeader>
                <div className="px-1 py-2">{peek.render(byId.get(peekRow.id) ?? peekRow)}</div>
              </>
            )}
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
