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
} from "lucide-react";
import type { ReactNode } from "react";

/**
 * <DataTableInteractive> — client-side enhancement of <DataTable>.
 *
 * Pages that need sort / filter / pagination / saved-views must:
 * 1. Pre-render rows on the server (or pass JSON-serializable data)
 * 2. Pass a `cells` array of pre-rendered ReactNode arrays — NOT a column
 *    render function — because functions cannot cross the server→client
 *    boundary in Next 16.
 *
 * Saved views persist to user_preferences.table_views per `tableId`.
 */

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

export type InteractiveColumn = {
  key: string;
  header: string;
  className?: string;
  sortable?: boolean;
};

export type InteractiveRow = {
  id: string;
  href?: string;
  /** One ReactNode per column, in column order. */
  cells: ReactNode[];
  /** Plain values used for sort + filter (one per column, optional). */
  values?: Array<string | number | null | undefined>;
};

export type InteractiveTableProps = {
  rows: InteractiveRow[];
  columns: InteractiveColumn[];
  emptyLabel?: string;
  searchable?: boolean;
  pageSize?: number;
  density?: "comfortable" | "compact";
  tableId?: string;
};

type SortState = { key: string; dir: "asc" | "desc" } | null;

export function DataTableInteractive({
  rows,
  columns,
  emptyLabel = "No records yet",
  searchable,
  pageSize,
  density: densityProp = "comfortable",
  tableId,
}: InteractiveTableProps) {
  const [sort, setSort] = React.useState<SortState>(null);
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(0);
  const [density, setDensity] = React.useState<"comfortable" | "compact">(densityProp);
  const [viewLoaded, setViewLoaded] = React.useState(!tableId);

  React.useEffect(() => {
    if (!tableId) return;
    let cancelled = false;
    void loadView(tableId).then((v) => {
      if (cancelled) return;
      if (v) {
        if (typeof v.query === "string") setQuery(v.query);
        if (v.sort !== undefined) setSort(v.sort);
        if (v.density) setDensity(v.density);
      }
      setViewLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [tableId]);

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
      (row.values ?? []).some((v) => v != null && String(v).toLowerCase().includes(q)),
    );
  }, [rows, query]);

  // Sort
  const sorted = React.useMemo(() => {
    if (!sort) return filtered;
    const colIndex = columns.findIndex((c) => c.key === sort.key);
    if (colIndex === -1) return filtered;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = a.values?.[colIndex];
      const bv = b.values?.[colIndex];
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

  React.useEffect(() => {
    if (page >= pageCount) setPage(0);
  }, [page, pageCount]);

  function toggleSort(key: string) {
    setSort((s) => {
      if (!s || s.key !== key) return { key, dir: "asc" };
      if (s.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  }

  if (rows.length === 0) {
    return (
      <div className="surface px-6 py-10 text-center text-sm text-[var(--text-muted)]">{emptyLabel}</div>
    );
  }

  const rowPad = density === "compact" ? "py-1.5" : "py-2.5";

  return (
    <div className="space-y-3">
      {searchable && (
        <div className="surface flex items-center justify-between gap-2 px-3 py-2">
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
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <SlidersHorizontal size={12} aria-hidden="true" />
            <span>{filtered.length} rows</span>
          </div>
        </div>
      )}

      <div className="surface overflow-x-auto">
        <table className="data-table" role="grid" aria-rowcount={sorted.length}>
          <thead>
            <tr>
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
                  colSpan={columns.length}
                  className="px-6 py-8 text-center text-sm text-[var(--text-muted)]"
                >
                  No rows match &quot;{query}&quot;
                </td>
              </tr>
            ) : (
              visible.map((row) => (
                <tr key={row.id} className={rowPad}>
                  {row.cells.map((cell, i) => {
                    const c = columns[i];
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
              ))
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
