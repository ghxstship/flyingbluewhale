"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  SlidersHorizontal,
  Save,
} from "lucide-react";
import type { ReactNode } from "react";

type ViewState = {
  query?: string;
  sort?: { key: string; dir: "asc" | "desc" } | null;
  density?: "comfortable" | "compact";
};

async function loadView(tableId: string): Promise<ViewState | null> {
  try {
    const res = await fetch("/api/v1/me/preferences");
    if (!res.ok) return null;
    const json = (await res.json()) as { ok: boolean; data?: { table_views?: Record<string, ViewState> } };
    return json.data?.table_views?.[tableId] ?? null;
  } catch {
    return null;
  }
}

async function saveView(tableId: string, view: ViewState) {
  try {
    const cur = await fetch("/api/v1/me/preferences");
    const curJson = (await cur.json()) as { ok: boolean; data?: { table_views?: Record<string, ViewState> } };
    const all = curJson.data?.table_views ?? {};
    await fetch("/api/v1/me/preferences", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ table_views: { ...all, [tableId]: view } }),
    });
  } catch {
    /* ignore */
  }
}

/**
 * DataTable — backwards-compatible with the v1 API.
 *
 * v1 (still works):  <DataTable rows columns rowHref emptyLabel />
 *
 * v2 additions (opt-in):
 *   - `sortable: true` per column → click header to sort
 *   - `searchable: true` table-level → toolbar input filters
 *   - `pageSize` → client-side pagination
 *   - `bulkActions` → multi-select with sticky action bar
 *   - `loading` → skeleton rows
 *   - `density="compact"` → tighter rows
 *
 * Keyboard:
 *   - `j`/`k` move row focus
 *   - `Space` toggle selection (bulk mode)
 *   - `Enter` opens row link
 */

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  sortable?: boolean;
  /** Pluck the value to compare for sorting/filtering. Defaults to render output as string. */
  accessor?: (row: T) => string | number | null | undefined;
};

export type BulkAction<T> = {
  id: string;
  label: string;
  variant?: "default" | "danger";
  perform: (rows: T[]) => void | Promise<void>;
};

export type DataTableProps<T extends { id: string }> = {
  rows: T[];
  columns: Column<T>[];
  rowHref?: (row: T) => string;
  emptyLabel?: string;
  searchable?: boolean;
  pageSize?: number;
  bulkActions?: BulkAction<T>[];
  loading?: boolean;
  density?: "comfortable" | "compact";
  /** Optional table id for persisting sort + view state. */
  tableId?: string;
};

type SortState = { key: string; dir: "asc" | "desc" } | null;

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  rowHref,
  emptyLabel = "No records yet",
  searchable,
  pageSize,
  bulkActions,
  loading,
  density: densityProp = "comfortable",
  tableId,
}: DataTableProps<T>) {
  const [sort, setSort] = React.useState<SortState>(null);
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(0);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [density, setDensity] = React.useState<"comfortable" | "compact">(densityProp);
  const [viewLoaded, setViewLoaded] = React.useState(!tableId);

  // Load saved view once
  React.useEffect(() => {
    if (!tableId) return;
    let cancelled = false;
    void loadView(tableId).then((v) => {
      if (cancelled || !v) {
        setViewLoaded(true);
        return;
      }
      if (typeof v.query === "string") setQuery(v.query);
      if (v.sort !== undefined) setSort(v.sort);
      if (v.density) setDensity(v.density);
      setViewLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [tableId]);

  // Persist view changes (debounced)
  React.useEffect(() => {
    if (!tableId || !viewLoaded) return;
    const t = setTimeout(() => {
      void saveView(tableId, { query, sort, density });
    }, 600);
    return () => clearTimeout(t);
  }, [tableId, viewLoaded, query, sort, density]);

  // Filter
  const filtered = React.useMemo(() => {
    if (!query) return rows;
    const q = query.toLowerCase();
    return rows.filter((row) =>
      columns.some((c) => {
        const v =
          c.accessor?.(row) ??
          (typeof c.render(row) === "string" ? (c.render(row) as string) : "");
        return String(v).toLowerCase().includes(q);
      }),
    );
  }, [rows, query, columns]);

  // Sort
  const sorted = React.useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return filtered;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = col.accessor?.(a) ?? "";
      const bv = col.accessor?.(b) ?? "";
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [filtered, sort, columns]);

  // Paginate
  const pageCount = pageSize ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  const visible = pageSize ? sorted.slice(page * pageSize, (page + 1) * pageSize) : sorted;

  // Reset page if filters shrink result set
  React.useEffect(() => {
    if (page >= pageCount) setPage(0);
  }, [page, pageCount]);

  const showToolbar = searchable || (bulkActions && selected.size > 0);
  const allSelected = visible.length > 0 && visible.every((r) => selected.has(r.id));

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) visible.forEach((r) => next.delete(r.id));
      else visible.forEach((r) => next.add(r.id));
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSort(key: string) {
    setSort((s) => {
      if (!s || s.key !== key) return { key, dir: "asc" };
      if (s.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  }

  if (loading) {
    return <DataTableSkeleton columns={columns.length} rows={pageSize ?? 6} />;
  }

  if (rows.length === 0) {
    return (
      <div className="surface px-6 py-10 text-center text-sm text-[var(--text-muted)]">{emptyLabel}</div>
    );
  }

  const rowPad = density === "compact" ? "py-1.5" : "py-2.5";

  return (
    <div className="space-y-3">
      {showToolbar && (
        <div className="surface flex items-center justify-between gap-2 px-3 py-2">
          {searchable && (
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <Search size={14} aria-hidden="true" />
              <input
                type="search"
                value={query}
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
          {bulkActions && selected.size > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[var(--text-muted)]">{selected.size} selected</span>
              {bulkActions.map((a) => (
                <button
                  key={a.id}
                  onClick={async () => {
                    const rows = visible.filter((r) => selected.has(r.id));
                    await a.perform(rows);
                    setSelected(new Set());
                  }}
                  className={`rounded px-2 py-1 ${a.variant === "danger" ? "text-[var(--color-error)] hover:bg-[var(--color-error)]/10" : "hover:bg-[var(--surface-inset)]"}`}
                >
                  {a.label}
                </button>
              ))}
              <button
                onClick={() => setSelected(new Set())}
                aria-label="Clear selection"
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={12} />
              </button>
            </div>
          )}
          {!searchable && !(bulkActions && selected.size > 0) && (
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <SlidersHorizontal size={12} aria-hidden="true" />
              <span>{filtered.length} rows</span>
            </div>
          )}
        </div>
      )}

      <div className="surface overflow-x-auto">
        <table className="data-table" role="grid" aria-rowcount={sorted.length}>
          <thead>
            <tr>
              {bulkActions && (
                <th className="w-8 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all on this page"
                  />
                </th>
              )}
              {columns.map((c) => {
                const sortDir = sort?.key === c.key ? sort.dir : null;
                const sortIcon = c.sortable ? (
                  sortDir === "asc" ? (
                    <ArrowUp size={12} aria-hidden="true" />
                  ) : sortDir === "desc" ? (
                    <ArrowDown size={12} aria-hidden="true" />
                  ) : (
                    <ArrowUpDown size={12} className="opacity-40" aria-hidden="true" />
                  )
                ) : null;
                return (
                  <th
                    key={c.key}
                    className={c.className}
                    aria-sort={
                      sortDir === "asc" ? "ascending" : sortDir === "desc" ? "descending" : "none"
                    }
                  >
                    {c.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className="inline-flex items-center gap-1 hover:text-[var(--text-primary)]"
                      >
                        {c.header}
                        {sortIcon}
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
            {visible.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (bulkActions ? 1 : 0)}
                  className="px-6 py-8 text-center text-sm text-[var(--text-muted)]"
                >
                  No rows match "{query}"
                </td>
              </tr>
            ) : (
              visible.map((row) => {
                const href = rowHref?.(row);
                const isSelected = selected.has(row.id);
                return (
                  <tr
                    key={row.id}
                    className={`${rowPad} ${isSelected ? "bg-[var(--surface-inset)]" : ""}`}
                    aria-selected={isSelected || undefined}
                  >
                    {bulkActions && (
                      <td className="w-8 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOne(row.id)}
                          aria-label={`Select row ${row.id}`}
                        />
                      </td>
                    )}
                    {columns.map((c, i) => {
                      const cell = c.render(row);
                      return (
                        <td key={c.key} className={c.className}>
                          {href && i === 0 ? (
                            <Link href={href} className="text-[var(--foreground)] hover:underline">
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
              })
            )}
          </tbody>
        </table>
      </div>

      {pageSize && pageCount > 1 && (
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>
            Page {page + 1} of {pageCount} · {sorted.length} total
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              aria-label="Previous page"
              className="rounded p-1 hover:bg-[var(--surface-inset)] disabled:opacity-30"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={page >= pageCount - 1}
              aria-label="Next page"
              className="rounded p-1 hover:bg-[var(--surface-inset)] disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DataTableSkeleton({ columns, rows }: { columns: number; rows: number }) {
  return (
    <div className="surface overflow-x-auto" aria-busy="true" aria-label="Loading table">
      <table className="data-table">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i}>
                <div className="skeleton h-4 w-20 rounded" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: columns }).map((_, c) => (
                <td key={c}>
                  <div className="skeleton h-4 w-full max-w-[160px] rounded" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
