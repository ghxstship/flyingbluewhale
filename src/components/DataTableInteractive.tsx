"use client";

import * as React from "react";
import Link from "next/link";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  SlidersHorizontal,
  EyeOff,
  Pin,
  PinOff,
} from "lucide-react";
import type { ReactNode } from "react";
import { useUrlState } from "@/lib/hooks/useUrlState";
import { useUserPreferences } from "@/lib/hooks/useUserPreferences";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";

/**
 * DataTableInteractive v3 — virtualized client-side table.
 *
 * Cells are pre-rendered on the server (ReactNode[] per row) so function
 * props never cross the server→client boundary.
 *
 * Features: sort (single), search, pagination, bulk selection with action
 * bar, column pin/hide menu, URL-sync of sort/search, per-user saved views
 * via user_preferences.table_views, row virtualization with @tanstack/react-virtual.
 */

export type InteractiveColumn = {
  key: string;
  header: string;
  className?: string;
  sortable?: boolean;
  /** Default to visible. */
  defaultHidden?: boolean;
};

export type InteractiveRow = {
  id: string;
  href?: string;
  cells: ReactNode[];
  values?: Array<string | number | null | undefined>;
};

export type BulkAction = {
  id: string;
  label: string;
  variant?: "default" | "danger";
  perform: (ids: string[]) => void | Promise<void>;
};

export type InteractiveTableProps = {
  rows: InteractiveRow[];
  columns: InteractiveColumn[];
  emptyLabel?: string;
  searchable?: boolean;
  pageSize?: number;
  density?: "comfortable" | "compact";
  bulkActions?: BulkAction[];
  tableId?: string;
  /** Fixed virtualization row height in px. Falls back to density-based if omitted. */
  rowHeight?: number;
};

export function DataTableInteractive({
  rows,
  columns,
  emptyLabel = "No records yet",
  searchable,
  pageSize,
  density: densityProp = "comfortable",
  bulkActions,
  tableId,
  rowHeight,
}: InteractiveTableProps) {
  const { prefs, setPrefs } = useUserPreferences();
  const savedView = tableId ? (prefs.table_views as Record<string, SavedView> | undefined)?.[tableId] : undefined;

  const [query, setQuery] = useUrlState(tableId ? `${tableId}.q` : "q", savedView?.query ?? "");
  const [sortKey, setSortKey] = useUrlState(tableId ? `${tableId}.s` : "s", savedView?.sort?.key ?? "");
  const [sortDir, setSortDir] = useUrlState<"asc" | "desc" | "">(
    tableId ? `${tableId}.d` : "d",
    savedView?.sort?.dir ?? "",
  );
  const [page, setPage] = useUrlState<number>(tableId ? `${tableId}.p` : "p", 0);

  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [density, setDensity] = React.useState<"comfortable" | "compact">(
    savedView?.density ?? densityProp,
  );
  const [hiddenCols, setHiddenCols] = React.useState<Set<string>>(
    new Set(savedView?.hidden ?? columns.filter((c) => c.defaultHidden).map((c) => c.key)),
  );
  const [pinnedCols, setPinnedCols] = React.useState<Set<string>>(new Set(savedView?.pinned ?? []));

  // Persist view changes (debounced)
  React.useEffect(() => {
    if (!tableId) return;
    const handle = setTimeout(() => {
      const view: SavedView = {
        query,
        sort: sortKey ? { key: sortKey, dir: (sortDir || "asc") as "asc" | "desc" } : undefined,
        density,
        hidden: Array.from(hiddenCols),
        pinned: Array.from(pinnedCols),
      };
      const current = (prefs.table_views ?? {}) as Record<string, unknown>;
      void setPrefs({ table_views: { ...current, [tableId]: view as unknown as never } });
    }, 600);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableId, query, sortKey, sortDir, density, hiddenCols, pinnedCols]);

  // Filter
  const filtered = React.useMemo(() => {
    if (!query) return rows;
    const q = String(query).toLowerCase();
    return rows.filter((row) =>
      (row.values ?? []).some((v) => v != null && String(v).toLowerCase().includes(q)),
    );
  }, [rows, query]);

  // Sort
  const sorted = React.useMemo(() => {
    if (!sortKey) return filtered;
    const idx = columns.findIndex((c) => c.key === sortKey);
    if (idx === -1) return filtered;
    const dir = sortDir === "desc" ? -1 : 1;
    return [...filtered].sort((a, b) => {
      const av = a.values?.[idx];
      const bv = b.values?.[idx];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [filtered, sortKey, sortDir, columns]);

  // Paginate
  const pageSizeEff = pageSize ?? 0;
  const pageCount = pageSizeEff ? Math.max(1, Math.ceil(sorted.length / pageSizeEff)) : 1;
  const visible = pageSizeEff
    ? sorted.slice(Number(page) * pageSizeEff, (Number(page) + 1) * pageSizeEff)
    : sorted;

  React.useEffect(() => {
    if (Number(page) >= pageCount) setPage(0);
  }, [page, pageCount, setPage]);

  // Visible columns (respect hidden set), with pinned columns first
  const renderedCols = React.useMemo(() => {
    const visibleCols = columns.filter((c) => !hiddenCols.has(c.key));
    return visibleCols.sort((a, b) => {
      const ap = pinnedCols.has(a.key) ? 0 : 1;
      const bp = pinnedCols.has(b.key) ? 0 : 1;
      return ap - bp;
    });
  }, [columns, hiddenCols, pinnedCols]);

  const colIndexByKey = React.useMemo(() => {
    const map = new Map<string, number>();
    columns.forEach((c, i) => map.set(c.key, i));
    return map;
  }, [columns]);

  // Virtualization
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const estimatedRowHeight = rowHeight ?? (density === "compact" ? 32 : 44);
  const virtualizer = useVirtualizer({
    count: visible.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan: 10,
  });

  function toggleSort(key: string) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortKey("");
      setSortDir("");
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      const allVisible = visible.every((r) => prev.has(r.id));
      const next = new Set(prev);
      if (allVisible) visible.forEach((r) => next.delete(r.id));
      else visible.forEach((r) => next.add(r.id));
      return next;
    });
  }

  const anySelected = selected.size > 0;
  const allVisibleSelected = visible.length > 0 && visible.every((r) => selected.has(r.id));

  if (rows.length === 0) {
    return <div className="surface px-6 py-10 text-center text-sm text-[var(--text-muted)]">{emptyLabel}</div>;
  }

  const rowPad = density === "compact" ? "py-1.5" : "py-2.5";

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="surface flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        {searchable && (
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <Search size={14} aria-hidden="true" />
            <input
              type="search"
              value={String(query)}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              placeholder="Search…"
              className="bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
              aria-label="Filter rows"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)]">{sorted.length} rows</span>
          <DensityToggle value={density} onChange={setDensity} />
          <ColumnMenu
            columns={columns}
            hidden={hiddenCols}
            pinned={pinnedCols}
            onToggleHidden={(k) => {
              setHiddenCols((prev) => {
                const next = new Set(prev);
                if (next.has(k)) next.delete(k);
                else next.add(k);
                return next;
              });
            }}
            onTogglePinned={(k) => {
              setPinnedCols((prev) => {
                const next = new Set(prev);
                if (next.has(k)) next.delete(k);
                else next.add(k);
                return next;
              });
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div
        ref={scrollRef}
        className="surface overflow-auto"
        style={{ maxHeight: pageSizeEff ? "auto" : "70vh" }}
      >
        <table className="data-table w-full" role="grid" aria-rowcount={sorted.length}>
          <thead className="sticky top-0 z-10 bg-[var(--surface)]">
            <tr>
              {bulkActions && (
                <th className="w-8 text-center">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAll}
                    aria-label="Select all on this page"
                  />
                </th>
              )}
              {renderedCols.map((c) => {
                const isSorted = sortKey === c.key;
                const pinned = pinnedCols.has(c.key);
                return (
                  <th
                    key={c.key}
                    className={`${c.className ?? ""} ${pinned ? "bg-[var(--surface-inset)]" : ""}`}
                    aria-sort={isSorted ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                  >
                    {c.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className="inline-flex items-center gap-1 hover:text-[var(--text-primary)]"
                      >
                        {c.header}
                        {isSorted ? (
                          sortDir === "asc" ? (
                            <ArrowUp size={12} aria-hidden="true" />
                          ) : (
                            <ArrowDown size={12} aria-hidden="true" />
                          )
                        ) : (
                          <ArrowUpDown size={12} className="opacity-40" aria-hidden="true" />
                        )}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageSizeEff ? (
              visible.map((row) => (
                <TableRow
                  key={row.id}
                  row={row}
                  cols={renderedCols}
                  colIndexByKey={colIndexByKey}
                  rowPad={rowPad}
                  bulk={!!bulkActions}
                  selected={selected.has(row.id)}
                  onSelect={toggleOne}
                />
              ))
            ) : (
              // Virtualized mode — only render rows in viewport
              <>
                {virtualizer.getVirtualItems().length === 0 && visible.length === 0 && (
                  <tr>
                    <td
                      colSpan={renderedCols.length + (bulkActions ? 1 : 0)}
                      className="px-6 py-8 text-center text-sm text-[var(--text-muted)]"
                    >
                      No rows match &quot;{String(query)}&quot;
                    </td>
                  </tr>
                )}
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const row = visible[virtualRow.index];
                  return (
                    <TableRow
                      key={row.id}
                      row={row}
                      cols={renderedCols}
                      colIndexByKey={colIndexByKey}
                      rowPad={rowPad}
                      bulk={!!bulkActions}
                      selected={selected.has(row.id)}
                      onSelect={toggleOne}
                      style={{ height: `${virtualRow.size}px` }}
                    />
                  );
                })}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pageSizeEff && pageCount > 1 && (
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>
            Page {Number(page) + 1} of {pageCount} · {sorted.length} total
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, Number(p) - 1))}
              disabled={Number(page) === 0}
              aria-label="Previous page"
              className="rounded p-1 hover:bg-[var(--surface-inset)] disabled:opacity-30"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pageCount - 1, Number(p) + 1))}
              disabled={Number(page) >= pageCount - 1}
              aria-label="Next page"
              className="rounded p-1 hover:bg-[var(--surface-inset)] disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Bulk action bar */}
      {bulkActions && anySelected && (
        <div
          role="toolbar"
          aria-label="Bulk actions"
          className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--surface-raised)] px-4 py-2 shadow-lg"
        >
          <span className="text-xs text-[var(--text-muted)]">{selected.size} selected</span>
          {bulkActions.map((a) => (
            <button
              key={a.id}
              onClick={async () => {
                await a.perform(Array.from(selected));
                setSelected(new Set());
              }}
              className={`rounded px-2 py-1 text-xs ${
                a.variant === "danger"
                  ? "text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
                  : "hover:bg-[var(--surface-inset)]"
              }`}
            >
              {a.label}
            </button>
          ))}
          <button
            onClick={() => setSelected(new Set())}
            aria-label="Clear selection"
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function TableRow({
  row,
  cols,
  colIndexByKey,
  rowPad,
  bulk,
  selected,
  onSelect,
  style,
}: {
  row: InteractiveRow;
  cols: InteractiveColumn[];
  colIndexByKey: Map<string, number>;
  rowPad: string;
  bulk: boolean;
  selected: boolean;
  onSelect: (id: string) => void;
  style?: React.CSSProperties;
}) {
  return (
    <tr className={`${rowPad} ${selected ? "bg-[var(--surface-inset)]" : ""}`} aria-selected={selected || undefined} style={style}>
      {bulk && (
        <td className="w-8 text-center">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(row.id)}
            aria-label={`Select row ${row.id}`}
          />
        </td>
      )}
      {cols.map((c, i) => {
        const originalIdx = colIndexByKey.get(c.key) ?? i;
        const cell = row.cells[originalIdx];
        return (
          <td key={c.key} className={c.className}>
            {row.href && i === 0 ? (
              <Link href={row.href} className="text-[var(--foreground)] hover:underline">
                {cell}
              </Link>
            ) : (
              cell
            )}
          </td>
        );
      })}
    </tr>
  );
}

function DensityToggle({
  value,
  onChange,
}: {
  value: "comfortable" | "compact";
  onChange: (v: "comfortable" | "compact") => void;
}) {
  return (
    <div className="inline-flex rounded border border-[var(--border-color)]">
      <button
        type="button"
        aria-label="Comfortable density"
        aria-pressed={value === "comfortable"}
        onClick={() => onChange("comfortable")}
        className={`px-2 py-1 text-xs ${value === "comfortable" ? "bg-[var(--surface-inset)]" : ""}`}
      >
        ☰
      </button>
      <button
        type="button"
        aria-label="Compact density"
        aria-pressed={value === "compact"}
        onClick={() => onChange("compact")}
        className={`px-2 py-1 text-xs ${value === "compact" ? "bg-[var(--surface-inset)]" : ""}`}
      >
        ≡
      </button>
    </div>
  );
}

function ColumnMenu({
  columns,
  hidden,
  pinned,
  onToggleHidden,
  onTogglePinned,
}: {
  columns: InteractiveColumn[];
  hidden: Set<string>;
  pinned: Set<string>;
  onToggleHidden: (key: string) => void;
  onTogglePinned: (key: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Column settings"
          className="rounded border border-[var(--border-color)] p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <SlidersHorizontal size={12} aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {columns.map((c) => {
          const isHidden = hidden.has(c.key);
          const isPinned = pinned.has(c.key);
          return (
            <DropdownMenuItem
              key={c.key}
              onSelect={(e: Event) => {
                e.preventDefault();
              }}
              className="flex items-center justify-between gap-2"
            >
              <button
                type="button"
                onClick={() => onToggleHidden(c.key)}
                className="flex flex-1 items-center gap-2"
              >
                {isHidden ? <EyeOff size={12} className="opacity-50" /> : <EyeOff size={12} className="opacity-0" />}
                <span className={isHidden ? "line-through" : ""}>{c.header}</span>
              </button>
              <button
                type="button"
                onClick={() => onTogglePinned(c.key)}
                aria-label={isPinned ? `Unpin ${c.header}` : `Pin ${c.header}`}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                {isPinned ? <Pin size={10} /> : <PinOff size={10} />}
              </button>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => columns.forEach((c) => hidden.has(c.key) && onToggleHidden(c.key))}>
          Show all columns
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type SavedView = {
  query?: string;
  sort?: { key: string; dir: "asc" | "desc" };
  density?: "comfortable" | "compact";
  hidden?: string[];
  pinned?: string[];
};
