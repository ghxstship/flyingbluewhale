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
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  X,
  SlidersHorizontal,
  EyeOff,
  Eye,
  Pin,
  PinOff,
  Download,
  GripVertical,
  Filter,
  Layers,
  Rows3,
  Rows4,
  RefreshCw,
  Share2,
  Upload,
  RotateCcw,
  Plus,
  Bookmark,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import { RowActions, type RowActionItem } from "@/components/ui/RowActions";
import { Hint } from "@/components/ui/Tooltip";

/**
 * Shared toolbar trigger className — every dropdown trigger and action
 * button in the toolbar consumes this so the chrome stays consistent.
 * Borderless by default (matches the top-bar action-button language);
 * hover bg + active bg communicate state without per-button enclosure.
 *
 * Borders in the toolbar are reserved for INPUTS (search) and SEGMENTED
 * CONTROLS (density toggle) — chrome that needs to read as a contained
 * input affordance or a group of related options.
 */
const TOOLBAR_TRIGGER_BASE =
  "inline-flex h-7 items-center gap-1 rounded px-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-inset)] hover:text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--org-primary)]";
const TOOLBAR_TRIGGER_ACTIVE = "bg-[var(--surface-inset)] text-[var(--text-primary)]";

function ToolbarDivider() {
  return <span aria-hidden="true" className="h-5 w-px shrink-0 bg-[var(--border-color)] opacity-60" />;
}

/**
 * DataTableInteractive v4 — virtualised client-side table.
 *
 * Cells are pre-rendered upstream (ReactNode[] per row) so function props
 * never cross the server→client boundary.
 *
 * Capabilities:
 *   • Sort (single primary; shift-click adds secondary keys, multi-sort)
 *   • Free-text search across `row.values`
 *   • Per-column filter (multi-select on distinct values)
 *   • Active-filter chips bar
 *   • Pagination OR row virtualization
 *   • Bulk select with floating action bar
 *   • Show / hide / pin / drag-reorder columns (saved per user)
 *   • Density toggle, sticky header
 *   • Row-level actions slot (kebab via <RowActions>)
 *   • Row grouping (groupBy column key, collapsible)
 *   • CSV export of currently-visible rows
 *   • URL-sync of search/sort/page; full view persisted in
 *     user_preferences.table_views[tableId]
 */

export type InteractiveColumn = {
  key: string;
  header: string;
  className?: string;
  sortable?: boolean;
  /** When true, callers can filter on this column. Distinct values are
   *  sourced from `row.values[i]`. Don't enable for very high-cardinality
   *  columns (timestamps, IDs). */
  filterable?: boolean;
  /** Default to visible. */
  defaultHidden?: boolean;
  /** Default fold a group when this column is the active groupBy. */
  groupable?: boolean;
};

export type InteractiveRow = {
  id: string;
  href?: string;
  cells: ReactNode[];
  values?: Array<string | number | null | undefined>;
  /** Optional per-row action menu items. Renders a kebab in a trailing
   *  actions column. */
  actions?: RowActionItem[];
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
  /** Stable identifier — drives URL keys + saved-view persistence. */
  tableId?: string;
  /** Fixed virtualization row height in px. Falls back to density-based if omitted. */
  rowHeight?: number;
  /** Optional import handler. When provided, an "Import" button surfaces in
   *  the toolbar; clicking opens a file picker that hands the chosen file
   *  back to the caller for parsing/upload. */
  onImport?: (file: File) => void | Promise<void>;
  /** Optional refresh handler. When provided, a refresh button surfaces in
   *  the toolbar. Defaults to `router.refresh()` so server-rendered tables
   *  re-query without callers wiring anything. */
  onRefresh?: () => void | Promise<void>;
};

type SavedView = {
  query?: string;
  sort?: Array<{ key: string; dir: "asc" | "desc" }>;
  density?: "comfortable" | "compact";
  hidden?: string[];
  pinned?: string[];
  /** Explicit column order (column keys). Items not present fall back to
   *  the column-array order, then pinned go to the front. */
  order?: string[];
  /** Per-column include-only filters: column key → array of allowed scalar
   *  values stringified. */
  filters?: Record<string, string[]>;
  /** When set, rows are grouped by this column key. */
  groupBy?: string;
  /** Group keys (stringified scalar values) the user has collapsed. */
  collapsed?: string[];
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
  onImport,
  onRefresh,
}: InteractiveTableProps) {
  const router = useRouter();
  const { prefs, setPrefs } = useUserPreferences();
  const savedView = tableId ? (prefs.table_views as Record<string, SavedView> | undefined)?.[tableId] : undefined;

  const [query, setQuery] = useUrlState(tableId ? `${tableId}.q` : "q", savedView?.query ?? "");
  const [sortKey, setSortKey] = useUrlState(tableId ? `${tableId}.s` : "s", savedView?.sort?.[0]?.key ?? "");
  const [sortDir, setSortDir] = useUrlState<"asc" | "desc" | "">(
    tableId ? `${tableId}.d` : "d",
    savedView?.sort?.[0]?.dir ?? "",
  );
  const [page, setPage] = useUrlState<number>(tableId ? `${tableId}.p` : "p", 0);

  // Multi-sort secondary keys (kept client-side; primary still URL-synced)
  const [sortStack, setSortStack] = React.useState<Array<{ key: string; dir: "asc" | "desc" }>>(
    () => savedView?.sort?.slice(1) ?? [],
  );

  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [density, setDensity] = React.useState<"comfortable" | "compact">(savedView?.density ?? densityProp);
  const [hiddenCols, setHiddenCols] = React.useState<Set<string>>(
    new Set(savedView?.hidden ?? columns.filter((c) => c.defaultHidden).map((c) => c.key)),
  );
  const [pinnedCols, setPinnedCols] = React.useState<Set<string>>(new Set(savedView?.pinned ?? []));
  const [colOrder, setColOrder] = React.useState<string[]>(savedView?.order ?? columns.map((c) => c.key));
  const [filters, setFilters] = React.useState<Record<string, string[]>>(savedView?.filters ?? {});
  const [groupBy, setGroupBy] = React.useState<string>(savedView?.groupBy ?? "");
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set(savedView?.collapsed ?? []));

  // Persist view changes (debounced)
  React.useEffect(() => {
    if (!tableId) return;
    const handle = setTimeout(() => {
      const stack: Array<{ key: string; dir: "asc" | "desc" }> = [];
      if (sortKey) stack.push({ key: sortKey as string, dir: (sortDir || "asc") as "asc" | "desc" });
      stack.push(...sortStack);
      const view: SavedView = {
        query: String(query),
        sort: stack.length ? stack : undefined,
        density,
        hidden: Array.from(hiddenCols),
        pinned: Array.from(pinnedCols),
        order: colOrder,
        filters: Object.keys(filters).length ? filters : undefined,
        groupBy: groupBy || undefined,
        collapsed: Array.from(collapsed),
      };
      const current = (prefs.table_views ?? {}) as Record<string, unknown>;
      void setPrefs({ table_views: { ...current, [tableId]: view as unknown as never } });
    }, 600);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tableId,
    query,
    sortKey,
    sortDir,
    sortStack,
    density,
    hiddenCols,
    pinnedCols,
    colOrder,
    filters,
    groupBy,
    collapsed,
  ]);

  const colIndexByKey = React.useMemo(() => {
    const map = new Map<string, number>();
    columns.forEach((c, i) => map.set(c.key, i));
    return map;
  }, [columns]);

  // Toolbar action handlers — wired below to Refresh / Share / Reset / Import.
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      if (onRefresh) await onRefresh();
      else router.refresh();
    } finally {
      // Small delay so the spinner is perceivable for sync refreshes.
      setTimeout(() => setRefreshing(false), 250);
    }
  }, [onRefresh, router]);
  const handleShare = React.useCallback(async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      toast.success("View Link Copied");
    } catch {
      toast.error("Could not copy link");
    }
  }, []);
  const handleResetView = React.useCallback(() => {
    setQuery("");
    setSortKey("");
    setSortDir("");
    setSortStack([]);
    setPage(0);
    setDensity(densityProp);
    setHiddenCols(new Set(columns.filter((c) => c.defaultHidden).map((c) => c.key)));
    setPinnedCols(new Set());
    setColOrder(columns.map((c) => c.key));
    setFilters({});
    setGroupBy("");
    setCollapsed(new Set());
    toast.success("View Reset");
  }, [columns, densityProp, setQuery, setSortKey, setSortDir, setPage]);
  const handleImportClick = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  const handleImportFile = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !onImport) return;
      try {
        await onImport(file);
        toast.success(`Imported ${file.name}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Import failed");
      } finally {
        e.target.value = "";
      }
    },
    [onImport],
  );

  // Filter — first by free-text query, then by per-column include-only filters
  const filtered = React.useMemo(() => {
    let out = rows;
    if (query) {
      const q = String(query).toLowerCase();
      out = out.filter((row) => (row.values ?? []).some((v) => v != null && String(v).toLowerCase().includes(q)));
    }
    const activeFilters = Object.entries(filters).filter(([, vs]) => vs.length > 0);
    if (activeFilters.length) {
      out = out.filter((row) =>
        activeFilters.every(([key, allowed]) => {
          const idx = colIndexByKey.get(key);
          if (idx == null) return true;
          const v = row.values?.[idx];
          return allowed.includes(v == null ? "" : String(v));
        }),
      );
    }
    return out;
  }, [rows, query, filters, colIndexByKey]);

  // Sort — primary first, then each secondary key
  const sorted = React.useMemo(() => {
    const stack: Array<{ key: string; dir: "asc" | "desc" }> = [];
    if (sortKey) stack.push({ key: sortKey as string, dir: (sortDir || "asc") as "asc" | "desc" });
    stack.push(...sortStack);
    if (!stack.length) return filtered;
    return [...filtered].sort((a, b) => {
      for (const { key, dir } of stack) {
        const idx = colIndexByKey.get(key);
        if (idx == null) continue;
        const av = a.values?.[idx];
        const bv = b.values?.[idx];
        const sign = dir === "desc" ? -1 : 1;
        if (av == null && bv == null) continue;
        if (av == null) return 1;
        if (bv == null) return -1;
        let cmp: number;
        if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
        else cmp = String(av).localeCompare(String(bv));
        if (cmp !== 0) return cmp * sign;
      }
      return 0;
    });
  }, [filtered, sortKey, sortDir, sortStack, colIndexByKey]);

  // Group rows when groupBy is set. Maps each group's stringified key to its rows.
  const grouped = React.useMemo(() => {
    if (!groupBy) return null as null | Array<{ key: string; label: string; rows: InteractiveRow[] }>;
    const idx = colIndexByKey.get(groupBy);
    if (idx == null) return null;
    const map = new Map<string, InteractiveRow[]>();
    sorted.forEach((row) => {
      const v = row.values?.[idx];
      const key = v == null ? "" : String(v);
      const list = map.get(key) ?? [];
      list.push(row);
      map.set(key, list);
    });
    return Array.from(map.entries()).map(([key, rs]) => ({ key, label: key || "—", rows: rs }));
  }, [sorted, groupBy, colIndexByKey]);

  // Paginate (only when not grouped — grouping turns off pagination)
  const pageSizeEff = grouped ? 0 : (pageSize ?? 0);
  const pageCount = pageSizeEff ? Math.max(1, Math.ceil(sorted.length / pageSizeEff)) : 1;
  const visible = pageSizeEff ? sorted.slice(Number(page) * pageSizeEff, (Number(page) + 1) * pageSizeEff) : sorted;

  React.useEffect(() => {
    if (Number(page) >= pageCount) setPage(0);
  }, [page, pageCount, setPage]);

  // Visible columns: respect hidden, then apply explicit order, then float pinned to the front
  const renderedCols = React.useMemo(() => {
    const known = new Set(columns.map((c) => c.key));
    const orderedKeys = [
      ...colOrder.filter((k) => known.has(k)),
      ...columns.map((c) => c.key).filter((k) => !colOrder.includes(k)),
    ];
    const ordered = orderedKeys.map((k) => columns.find((c) => c.key === k)!).filter((c) => !hiddenCols.has(c.key));
    return ordered.sort((a, b) => {
      const ap = pinnedCols.has(a.key) ? 0 : 1;
      const bp = pinnedCols.has(b.key) ? 0 : 1;
      return ap - bp;
    });
  }, [columns, hiddenCols, pinnedCols, colOrder]);

  const distinctValuesByKey = React.useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    columns.forEach((c) => {
      if (!c.filterable) return;
      const idx = colIndexByKey.get(c.key)!;
      const counts = new Map<string, number>();
      filtered.forEach((row) => {
        const v = row.values?.[idx];
        const k = v == null ? "" : String(v);
        counts.set(k, (counts.get(k) ?? 0) + 1);
      });
      map.set(c.key, counts);
    });
    return map;
  }, [columns, colIndexByKey, filtered]);

  // Virtualization (only when not paginated and not grouped)
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const estimatedRowHeight = rowHeight ?? (density === "compact" ? 32 : 44);
  const flatVisible = grouped ? grouped.flatMap((g) => (collapsed.has(g.key) ? [] : g.rows)) : visible;
  const virtualizer = useVirtualizer({
    count: !pageSizeEff && !grouped ? visible.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan: 10,
  });

  function toggleSort(key: string, e?: React.MouseEvent) {
    if (e?.shiftKey && sortKey && sortKey !== key) {
      // Add / cycle a secondary sort key
      setSortStack((prev) => {
        const ix = prev.findIndex((s) => s.key === key);
        if (ix === -1) return [...prev, { key, dir: "asc" }];
        if (prev[ix].dir === "asc") {
          const next = [...prev];
          next[ix] = { key, dir: "desc" };
          return next;
        }
        return prev.filter((s) => s.key !== key);
      });
      return;
    }
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
      setSortStack([]);
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortKey("");
      setSortDir("");
      setSortStack([]);
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
      const allVisible = flatVisible.every((r) => prev.has(r.id));
      const next = new Set(prev);
      if (allVisible) flatVisible.forEach((r) => next.delete(r.id));
      else flatVisible.forEach((r) => next.add(r.id));
      return next;
    });
  }

  const anySelected = selected.size > 0;
  const allVisibleSelected = flatVisible.length > 0 && flatVisible.every((r) => selected.has(r.id));

  if (rows.length === 0) {
    return <div className="px-6 py-10 text-center text-sm text-[var(--text-muted)]">{emptyLabel}</div>;
  }

  const rowPad = density === "compact" ? "py-1.5" : "py-2.5";
  const hasRowActions = rows.some((r) => r.actions && r.actions.length > 0);

  const customizationActive =
    Boolean(query) ||
    Boolean(sortKey) ||
    sortStack.length > 0 ||
    Object.keys(filters).length > 0 ||
    hiddenCols.size > columns.filter((c) => c.defaultHidden).length ||
    pinnedCols.size > 0 ||
    Boolean(groupBy);

  return (
    <div className="space-y-3">
      {/* Toolbar — four-section layout (Discover | Shape | Actions | Display)
          per design canon. Borderless container; bottom 1px chrome rule
          separates the strip from the table body. Per-button borders
          stripped to match top-bar visual language: borders only on
          inputs (search) and segmented controls (density toggle); single
          dropdown triggers + action buttons read as borderless icons
          with hover affordance. Thin vertical dividers structure the
          four functional sections without per-button enclosure. */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 border-b border-[var(--border-color)] px-1 py-1.5">
        {/* ── Section 1 · Discover ── */}
        <div className="flex flex-1 items-center gap-2">
          {searchable && (
            <div className="inline-flex items-center gap-1.5 rounded border border-[var(--border-color)] bg-[var(--background)] px-2 py-1 text-xs text-[var(--text-muted)] focus-within:border-[var(--org-primary)]">
              <Search size={12} aria-hidden="true" />
              <input
                type="search"
                value={String(query)}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
                placeholder="Search"
                className="w-32 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] sm:w-48"
                aria-label="Filter Rows"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}
          <span className="font-mono text-[10px] text-[var(--text-muted)] tabular-nums">
            {sorted.length} {sorted.length === 1 ? "row" : "rows"}
          </span>
        </div>

        {/* ── Section 2 · Shape + Display (filter → sort → density → columns → group) ──
            Density and column visibility sit RIGHT next to Sort because
            "how rows look" is paired thinking with "how rows are ordered". */}
        <ToolbarDivider />
        <div className="flex items-center gap-0.5">
          <FilterAddMenu
            columns={columns}
            filters={filters}
            distinctValuesByKey={distinctValuesByKey}
            onChange={setFilters}
          />
          <SortStackMenu
            columns={columns}
            sortKey={String(sortKey)}
            sortDir={(sortDir as "asc" | "desc" | "") ?? ""}
            sortStack={sortStack}
            onSetPrimary={(key, dir) => {
              setSortKey(key);
              setSortDir(dir);
            }}
            onSetStack={setSortStack}
          />
          <DensityToggle value={density} onChange={setDensity} />
          <ColumnMenu
            columns={columns}
            order={colOrder}
            hidden={hiddenCols}
            pinned={pinnedCols}
            onReorder={setColOrder}
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
          <GroupByMenu columns={columns} groupBy={groupBy} setGroupBy={setGroupBy} />
        </div>

        {/* ── Section 3 · Actions (view / share / export / import / refresh) ── */}
        <ToolbarDivider />
        <div className="flex items-center gap-0.5">
          <ViewMenu customizationActive={customizationActive} onReset={handleResetView} />
          <ToolbarIconButton icon={Share2} label="Share view link" onClick={handleShare} />
          <Hint label="Export visible rows to CSV">
            <button
              type="button"
              onClick={() => exportCsv(renderedCols, sorted, tableId)}
              aria-label="Export visible rows to CSV"
              className={TOOLBAR_TRIGGER_BASE}
            >
              <Download size={12} aria-hidden="true" />
              Export
            </button>
          </Hint>
          {onImport && (
            <>
              <Hint label="Import rows from a file (CSV / TSV / JSON / XLSX)">
                <button
                  type="button"
                  onClick={handleImportClick}
                  aria-label="Import rows from a file"
                  className={TOOLBAR_TRIGGER_BASE}
                >
                  <Upload size={12} aria-hidden="true" />
                  Import
                </button>
              </Hint>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.json,.xlsx"
                onChange={handleImportFile}
                className="sr-only"
                aria-hidden="true"
                tabIndex={-1}
              />
            </>
          )}
          <ToolbarIconButton
            icon={RefreshCw}
            label="Refresh table data"
            onClick={handleRefresh}
            spinning={refreshing}
          />
        </div>
      </div>

      {/* Active filter chips */}
      <ActiveFilterChips
        filters={filters}
        columns={columns}
        onRemove={(key, val) =>
          setFilters((prev) => {
            const next = { ...prev };
            const arr = (next[key] ?? []).filter((v) => v !== val);
            if (arr.length) next[key] = arr;
            else delete next[key];
            return next;
          })
        }
        onClearAll={() => setFilters({})}
      />

      {/* Table — borderless container; the table itself carries header
          bottom-rule + 1px row dividers so the data structure reads
          without an outer card. Scroll bounds remain (70vh fallback when
          not paginated) and the header stays sticky. */}
      <div ref={scrollRef} className="overflow-auto" style={{ maxHeight: pageSizeEff ? "auto" : "70vh" }}>
        <table className="data-table w-full" role="grid" aria-rowcount={sorted.length}>
          {/* Sticky header bg switched from --surface to --background so
              the sticky thead matches the underlying page paint now that
              there's no surface card behind the table. */}
          <thead className="sticky top-0 z-10 bg-[var(--background)]">
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
                const isPrimarySort = sortKey === c.key;
                const secondarySort = sortStack.find((s) => s.key === c.key);
                const pinned = pinnedCols.has(c.key);
                const distincts = distinctValuesByKey.get(c.key);
                const activeFilter = (filters[c.key] ?? []).length;
                return (
                  <th
                    key={c.key}
                    className={`${c.className ?? ""} ${pinned ? "bg-[var(--surface-inset)]" : ""}`}
                    aria-sort={isPrimarySort ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                  >
                    <div className="inline-flex items-center gap-1">
                      {c.sortable ? (
                        <button
                          type="button"
                          onClick={(e) => toggleSort(c.key, e)}
                          className="inline-flex items-center gap-1 hover:text-[var(--text-primary)]"
                          title="Click to sort · shift-click for multi-sort"
                        >
                          {c.header}
                          {isPrimarySort ? (
                            sortDir === "asc" ? (
                              <ArrowUp size={12} aria-hidden="true" />
                            ) : (
                              <ArrowDown size={12} aria-hidden="true" />
                            )
                          ) : secondarySort ? (
                            secondarySort.dir === "asc" ? (
                              <ArrowUp size={10} className="opacity-60" aria-hidden="true" />
                            ) : (
                              <ArrowDown size={10} className="opacity-60" aria-hidden="true" />
                            )
                          ) : (
                            <ArrowUpDown size={12} className="opacity-40" aria-hidden="true" />
                          )}
                        </button>
                      ) : (
                        c.header
                      )}
                      {c.filterable && distincts && distincts.size > 0 && (
                        <ColumnFilterMenu
                          columnKey={c.key}
                          columnHeader={c.header}
                          distincts={distincts}
                          selected={filters[c.key] ?? []}
                          onChange={(vals) =>
                            setFilters((prev) => {
                              const next = { ...prev };
                              if (vals.length) next[c.key] = vals;
                              else delete next[c.key];
                              return next;
                            })
                          }
                          activeCount={activeFilter}
                        />
                      )}
                    </div>
                  </th>
                );
              })}
              {hasRowActions && <th className="w-8" aria-label="Actions" />}
            </tr>
          </thead>
          <tbody>
            {grouped ? (
              grouped.map((g) => {
                const isCollapsed = collapsed.has(g.key);
                return (
                  <React.Fragment key={`g-${g.key}`}>
                    <tr className="bg-[var(--surface-inset)]">
                      <td
                        colSpan={renderedCols.length + (bulkActions ? 1 : 0) + (hasRowActions ? 1 : 0)}
                        className="px-3 py-1.5"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setCollapsed((prev) => {
                              const next = new Set(prev);
                              if (next.has(g.key)) next.delete(g.key);
                              else next.add(g.key);
                              return next;
                            })
                          }
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                          aria-expanded={!isCollapsed}
                        >
                          {isCollapsed ? <ChevronRightIcon size={12} /> : <ChevronDown size={12} />}
                          {g.label}
                          <span className="ml-2 font-mono text-[10px] text-[var(--text-muted)]">{g.rows.length}</span>
                        </button>
                      </td>
                    </tr>
                    {!isCollapsed &&
                      g.rows.map((row) => (
                        <TableRow
                          key={row.id}
                          row={row}
                          cols={renderedCols}
                          colIndexByKey={colIndexByKey}
                          rowPad={rowPad}
                          bulk={!!bulkActions}
                          showActions={hasRowActions}
                          selected={selected.has(row.id)}
                          onSelect={toggleOne}
                        />
                      ))}
                  </React.Fragment>
                );
              })
            ) : pageSizeEff ? (
              visible.length === 0 ? (
                <FilteredEmptyRow
                  query={String(query)}
                  filterCount={Object.keys(filters).length}
                  colSpan={renderedCols.length + (bulkActions ? 1 : 0) + (hasRowActions ? 1 : 0)}
                  onClearFilters={() => {
                    setQuery("");
                    setFilters({});
                  }}
                />
              ) : (
                visible.map((row) => (
                  <TableRow
                    key={row.id}
                    row={row}
                    cols={renderedCols}
                    colIndexByKey={colIndexByKey}
                    rowPad={rowPad}
                    bulk={!!bulkActions}
                    showActions={hasRowActions}
                    selected={selected.has(row.id)}
                    onSelect={toggleOne}
                  />
                ))
              )
            ) : (
              <>
                {virtualizer.getVirtualItems().length === 0 && visible.length === 0 && (
                  <FilteredEmptyRow
                    query={String(query)}
                    filterCount={Object.keys(filters).length}
                    colSpan={renderedCols.length + (bulkActions ? 1 : 0) + (hasRowActions ? 1 : 0)}
                    onClearFilters={() => {
                      setQuery("");
                      setFilters({});
                    }}
                  />
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
                      showActions={hasRowActions}
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
              type="button"
              onClick={() => setPage((p) => Math.max(0, Number(p) - 1))}
              disabled={Number(page) === 0}
              aria-label="Previous page"
              className="rounded p-1 hover:bg-[var(--surface-inset)] disabled:opacity-30"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
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
          className="elevation-3 fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--surface-raised)] px-4 py-2"
        >
          <span className="text-xs text-[var(--text-muted)]">{selected.size} selected</span>
          {bulkActions.map((a) => (
            <button
              key={a.id}
              type="button"
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
            type="button"
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
  showActions,
  selected,
  onSelect,
  style,
}: {
  row: InteractiveRow;
  cols: InteractiveColumn[];
  colIndexByKey: Map<string, number>;
  rowPad: string;
  bulk: boolean;
  showActions: boolean;
  selected: boolean;
  onSelect: (id: string) => void;
  style?: React.CSSProperties;
}) {
  return (
    <tr
      className={`${rowPad} ${selected ? "bg-[var(--surface-inset)]" : ""}`}
      aria-selected={selected || undefined}
      style={style}
    >
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
      {showActions && (
        <td className="w-8">
          {row.actions && row.actions.length > 0 ? (
            <RowActions label={`Actions for row ${row.id}`} items={row.actions} />
          ) : null}
        </td>
      )}
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
  // Segmented pill — visual language matches the top-bar theme toggle
  // (rounded-full container with bg-bg-secondary, segments are h-7 w-7
  // squares that fill with bg-background when active). Tooltips on each
  // segment per the toolbar canon.
  return (
    <div
      role="radiogroup"
      aria-label="Row density"
      className="inline-flex rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] p-0.5"
    >
      <Hint label="Comfortable density">
        <button
          type="button"
          role="radio"
          aria-checked={value === "comfortable"}
          aria-label="Comfortable density"
          onClick={() => onChange("comfortable")}
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition ${value === "comfortable" ? "bg-[var(--background)] text-[var(--foreground)]" : "text-[var(--text-muted)] hover:text-[var(--foreground)]"}`}
        >
          <Rows3 size={13} aria-hidden="true" strokeWidth={2.25} />
        </button>
      </Hint>
      <Hint label="Compact density">
        <button
          type="button"
          role="radio"
          aria-checked={value === "compact"}
          aria-label="Compact density"
          onClick={() => onChange("compact")}
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition ${value === "compact" ? "bg-[var(--background)] text-[var(--foreground)]" : "text-[var(--text-muted)] hover:text-[var(--foreground)]"}`}
        >
          <Rows4 size={13} aria-hidden="true" strokeWidth={2.25} />
        </button>
      </Hint>
    </div>
  );
}

function GroupByMenu({
  columns,
  groupBy,
  setGroupBy,
}: {
  columns: InteractiveColumn[];
  groupBy: string;
  setGroupBy: (v: string) => void;
}) {
  const groupable = columns.filter((c) => c.groupable);
  if (groupable.length === 0) return null;
  const active = columns.find((c) => c.key === groupBy);
  return (
    <DropdownMenu>
      <Hint label={active ? `Grouped by ${active.header}` : "Group rows by a column"}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={active ? `Grouped by ${active.header}` : "Group by column"}
            className={`${TOOLBAR_TRIGGER_BASE} ${active ? TOOLBAR_TRIGGER_ACTIVE : ""}`}
          >
            <Layers size={12} aria-hidden="true" />
            {active ? active.header : "Group"}
          </button>
        </DropdownMenuTrigger>
      </Hint>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onSelect={() => setGroupBy("")}>No grouping</DropdownMenuItem>
        <DropdownMenuSeparator />
        {groupable.map((c) => (
          <DropdownMenuItem key={c.key} onSelect={() => setGroupBy(c.key)}>
            {c.header}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Inline empty-state row for when the dataset has rows but the active
 * search query and/or column filters narrow the visible set to zero.
 * Distinct from the dataset-level empty state — preserves the toolbar +
 * column headers and offers a one-click escape via "Clear Filters".
 */
function FilteredEmptyRow({
  query,
  filterCount,
  colSpan,
  onClearFilters,
}: {
  query: string;
  filterCount: number;
  colSpan: number;
  onClearFilters: () => void;
}) {
  const hasQuery = query.trim().length > 0;
  const message = hasQuery
    ? `No rows match "${query}"${filterCount > 0 ? ` with the active filter${filterCount === 1 ? "" : "s"}` : ""}`
    : filterCount > 0
      ? `No rows match the active filter${filterCount === 1 ? "" : "s"}`
      : "No rows to display";
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-10 text-center text-sm text-[var(--text-muted)]">
        <div className="flex flex-col items-center gap-2">
          <span>{message}</span>
          {(hasQuery || filterCount > 0) && (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center gap-1 rounded border border-[var(--border-color)] px-2 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-inset)] hover:text-[var(--text-primary)]"
            >
              <X size={12} aria-hidden="true" />
              Clear Filters
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

/**
 * Compact icon-only toolbar button with a tooltip-style aria-label and an
 * optional spinning state for in-flight async actions. Matches the
 * border-+-padding rhythm of the other toolbar buttons.
 */
function ToolbarIconButton({
  icon: Icon,
  label,
  onClick,
  spinning,
}: {
  icon: React.ComponentType<{ size?: number; "aria-hidden"?: boolean | "true" | "false"; className?: string }>;
  label: string;
  onClick?: () => void | Promise<void>;
  spinning?: boolean;
}) {
  return (
    <Hint label={label}>
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className="inline-flex h-7 w-7 items-center justify-center rounded text-[var(--text-secondary)] hover:bg-[var(--surface-inset)] hover:text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--org-primary)]"
      >
        <Icon size={12} aria-hidden="true" className={spinning ? "motion-safe:animate-spin" : undefined} />
      </button>
    </Hint>
  );
}

/**
 * FilterAddMenu — toolbar entry for the per-column filter system. Lists
 * filterable columns; selecting one opens a nested distinct-values picker
 * that writes into the same `filters` state the column-header funnels use,
 * so the active-filter chips and column-header indicators stay in sync.
 *
 * Canonical "+ Filter" pattern (Linear / Notion / Airtable).
 */
function FilterAddMenu({
  columns,
  filters,
  distinctValuesByKey,
  onChange,
}: {
  columns: InteractiveColumn[];
  filters: Record<string, string[]>;
  distinctValuesByKey: Map<string, Map<string, number>>;
  onChange: (next: Record<string, string[]>) => void;
}) {
  const filterable = columns.filter((c) => c.filterable);
  const [activeKey, setActiveKey] = React.useState<string>("");
  const activeColumn = filterable.find((c) => c.key === activeKey);
  const activeDistincts = activeKey ? distinctValuesByKey.get(activeKey) : undefined;
  const activeFilterCount = Object.values(filters).reduce((n, vs) => n + vs.length, 0);
  if (filterable.length === 0) return null;

  function setColumnFilter(key: string, vs: string[]) {
    const next = { ...filters };
    if (vs.length === 0) delete next[key];
    else next[key] = vs;
    onChange(next);
  }

  return (
    <DropdownMenu onOpenChange={(open) => !open && setActiveKey("")}>
      <Hint label={activeFilterCount ? `Filters · ${activeFilterCount} active` : "Add a filter to narrow rows"}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={activeFilterCount ? `Filters (${activeFilterCount} active)` : "Add filter"}
            className={`${TOOLBAR_TRIGGER_BASE} ${activeFilterCount ? TOOLBAR_TRIGGER_ACTIVE : ""}`}
          >
            {activeFilterCount ? <Filter size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}
            {activeFilterCount ? `Filter · ${activeFilterCount}` : "Filter"}
          </button>
        </DropdownMenuTrigger>
      </Hint>
      <DropdownMenuContent align="end" className="max-h-80 w-64 overflow-auto">
        {!activeColumn ? (
          <>
            <div className="px-2 py-1 text-[10px] font-semibold tracking-wide text-[var(--text-muted)]">Filter By</div>
            {filterable.map((c) => {
              const count = filters[c.key]?.length ?? 0;
              return (
                <DropdownMenuItem
                  key={c.key}
                  onSelect={(e) => {
                    e.preventDefault();
                    setActiveKey(c.key);
                  }}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="truncate">{c.header}</span>
                  {count > 0 && (
                    <span className="font-mono text-[10px] text-[var(--org-primary)] tabular-nums">{count}</span>
                  )}
                </DropdownMenuItem>
              );
            })}
            {activeFilterCount > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => onChange({})}>Clear All Filters</DropdownMenuItem>
              </>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-1 px-2 py-1">
              <button
                type="button"
                aria-label="Back to filter columns"
                onClick={() => setActiveKey("")}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <ChevronLeft size={12} aria-hidden="true" />
              </button>
              <span className="text-[10px] font-semibold tracking-wide text-[var(--text-muted)]">
                {activeColumn.header}
              </span>
            </div>
            <DropdownMenuSeparator />
            {!activeDistincts || activeDistincts.size === 0 ? (
              <div className="px-2 py-2 text-xs text-[var(--text-muted)]">No values</div>
            ) : (
              Array.from(activeDistincts.entries())
                .sort((a, b) => a[0].localeCompare(b[0]))
                .map(([val, count]) => {
                  const selected = filters[activeKey] ?? [];
                  const checked = selected.includes(val);
                  return (
                    <DropdownMenuItem
                      key={val}
                      onSelect={(e) => {
                        e.preventDefault();
                        if (checked)
                          setColumnFilter(
                            activeKey,
                            selected.filter((v) => v !== val),
                          );
                        else setColumnFilter(activeKey, [...selected, val]);
                      }}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <input type="checkbox" checked={checked} readOnly className="pointer-events-none" />
                        <span className="truncate">{val || "—"}</span>
                      </span>
                      <span className="font-mono text-[10px] text-[var(--text-muted)]">{count}</span>
                    </DropdownMenuItem>
                  );
                })
            )}
            {(filters[activeKey]?.length ?? 0) > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setColumnFilter(activeKey, [])}>Clear This Column</DropdownMenuItem>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * SortStackMenu — toolbar entry for the multi-sort system. Surfaces the
 * current primary + secondary sort keys with add / remove / direction
 * controls so multi-sort is discoverable (was only reachable via shift-
 * click on column headers).
 */
function SortStackMenu({
  columns,
  sortKey,
  sortDir,
  sortStack,
  onSetPrimary,
  onSetStack,
}: {
  columns: InteractiveColumn[];
  sortKey: string;
  sortDir: "asc" | "desc" | "";
  sortStack: Array<{ key: string; dir: "asc" | "desc" }>;
  onSetPrimary: (key: string, dir: "asc" | "desc") => void;
  onSetStack: (next: Array<{ key: string; dir: "asc" | "desc" }>) => void;
}) {
  const sortable = columns.filter((c) => c.sortable !== false);
  if (sortable.length === 0) return null;
  const headerByKey = new Map(columns.map((c) => [c.key, c.header]));
  const stack: Array<{ key: string; dir: "asc" | "desc" }> = [];
  if (sortKey) stack.push({ key: sortKey, dir: (sortDir || "asc") as "asc" | "desc" });
  stack.push(...sortStack);
  const stackKeys = new Set(stack.map((s) => s.key));
  const totalSorts = stack.length;

  function flipDir(idx: number) {
    if (idx === 0) {
      const next = sortDir === "asc" ? "desc" : "asc";
      onSetPrimary(sortKey, next);
    } else {
      const next = [...sortStack];
      next[idx - 1] = { ...next[idx - 1], dir: next[idx - 1].dir === "asc" ? "desc" : "asc" };
      onSetStack(next);
    }
  }
  function removeSort(idx: number) {
    if (idx === 0) {
      // Promote the first secondary to primary, drop the rest down.
      const promoted = sortStack[0];
      if (promoted) {
        onSetPrimary(promoted.key, promoted.dir);
        onSetStack(sortStack.slice(1));
      } else {
        onSetPrimary("", "asc");
      }
    } else {
      onSetStack(sortStack.filter((_, i) => i !== idx - 1));
    }
  }
  function addSort(key: string) {
    if (stackKeys.has(key)) return;
    if (!sortKey) onSetPrimary(key, "asc");
    else onSetStack([...sortStack, { key, dir: "asc" }]);
  }

  return (
    <DropdownMenu>
      <Hint
        label={
          totalSorts > 0
            ? `Sorted by ${totalSorts} column${totalSorts === 1 ? "" : "s"} · shift-click any column header to add another sort`
            : "Sort rows · shift-click column headers for multi-sort"
        }
      >
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={totalSorts > 0 ? `Sorted by ${totalSorts} column${totalSorts === 1 ? "" : "s"}` : "Add sort"}
            className={`${TOOLBAR_TRIGGER_BASE} ${totalSorts > 0 ? TOOLBAR_TRIGGER_ACTIVE : ""}`}
          >
            <ArrowUpDown size={12} aria-hidden="true" />
            {totalSorts > 0 ? `Sort · ${totalSorts}` : "Sort"}
          </button>
        </DropdownMenuTrigger>
      </Hint>
      <DropdownMenuContent align="end" className="w-72">
        <div className="px-2 py-1 text-[10px] font-semibold tracking-wide text-[var(--text-muted)]">Sort By</div>
        {stack.length === 0 ? (
          <div className="px-2 py-1 text-xs text-[var(--text-muted)]">No sort applied</div>
        ) : (
          stack.map((s, idx) => (
            <div key={`${s.key}-${idx}`} className="flex items-center justify-between gap-2 px-2 py-1 text-xs">
              <span className="flex items-center gap-2 truncate">
                <span className="font-mono text-[10px] text-[var(--text-muted)] tabular-nums">{idx + 1}</span>
                <span className="truncate">{headerByKey.get(s.key) ?? s.key}</span>
              </span>
              <span className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => flipDir(idx)}
                  aria-label={`Toggle ${s.key} direction (${s.dir})`}
                  className="rounded px-1 text-[var(--text-muted)] hover:bg-[var(--surface-inset)] hover:text-[var(--text-primary)]"
                >
                  {s.dir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                </button>
                <button
                  type="button"
                  onClick={() => removeSort(idx)}
                  aria-label={`Remove sort on ${s.key}`}
                  className="rounded px-1 text-[var(--text-muted)] hover:bg-[var(--surface-inset)] hover:text-[var(--text-primary)]"
                >
                  <X size={12} />
                </button>
              </span>
            </div>
          ))
        )}
        {sortable.some((c) => !stackKeys.has(c.key)) && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1 text-[10px] font-semibold tracking-wide text-[var(--text-muted)]">Add Sort</div>
            {sortable
              .filter((c) => !stackKeys.has(c.key))
              .map((c) => (
                <DropdownMenuItem key={c.key} onSelect={() => addSort(c.key)}>
                  {c.header}
                </DropdownMenuItem>
              ))}
          </>
        )}
        {totalSorts > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                onSetPrimary("", "asc");
                onSetStack([]);
              }}
            >
              Clear All Sorts
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * ViewMenu — saved-view affordance. Today only surfaces a Reset action
 * (clears query / sort / filters / density / hidden / pinned / order /
 * group / collapsed back to defaults). The single-named saved view
 * persists via `prefs.table_views[tableId]` regardless of this menu.
 *
 * Future: swap in a multi-view switcher when the storage shape extends to
 * `Record<viewName, SavedView>`.
 */
function ViewMenu({ customizationActive, onReset }: { customizationActive: boolean; onReset: () => void }) {
  return (
    <DropdownMenu>
      <Hint
        label={
          customizationActive
            ? "View · auto-saved per table; click to reset to defaults"
            : "Saved view · auto-saved per table"
        }
      >
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="View options"
            className={`${TOOLBAR_TRIGGER_BASE} ${customizationActive ? TOOLBAR_TRIGGER_ACTIVE : ""}`}
          >
            <Bookmark size={12} aria-hidden="true" />
            {customizationActive ? "View · Modified" : "View"}
          </button>
        </DropdownMenuTrigger>
      </Hint>
      <DropdownMenuContent align="end" className="w-52">
        <div className="px-2 py-1 text-[10px] font-semibold tracking-wide text-[var(--text-muted)]">Saved View</div>
        <DropdownMenuItem disabled className="opacity-60">
          Default · Auto-Saved
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onReset} disabled={!customizationActive}>
          <RotateCcw size={12} aria-hidden="true" className="me-1.5 inline" />
          Reset View To Defaults
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ColumnFilterMenu({
  columnKey: _columnKey,
  columnHeader,
  distincts,
  selected,
  onChange,
  activeCount,
}: {
  columnKey: string;
  columnHeader: string;
  distincts: Map<string, number>;
  selected: string[];
  onChange: (vs: string[]) => void;
  activeCount: number;
}) {
  const sortedEntries = React.useMemo(
    () => Array.from(distincts.entries()).sort((a, b) => a[0].localeCompare(b[0])),
    [distincts],
  );
  const sel = new Set(selected);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Filter ${columnHeader}`}
          className={`inline-flex h-5 w-5 items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] ${
            activeCount ? "text-[var(--org-primary)]" : ""
          }`}
        >
          <Filter size={11} aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-72 w-56 overflow-auto">
        {sortedEntries.length === 0 ? (
          <div className="px-2 py-1 text-xs text-[var(--text-muted)]">No values</div>
        ) : (
          sortedEntries.map(([val, count]) => {
            const checked = sel.has(val);
            return (
              <DropdownMenuItem
                key={val}
                onSelect={(e: Event) => {
                  e.preventDefault();
                  if (checked) onChange(selected.filter((v) => v !== val));
                  else onChange([...selected, val]);
                }}
                className="flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2 truncate">
                  <input type="checkbox" checked={checked} readOnly className="pointer-events-none" />
                  <span className="truncate">{val || "—"}</span>
                </span>
                <span className="font-mono text-[10px] text-[var(--text-muted)]">{count}</span>
              </DropdownMenuItem>
            );
          })
        )}
        {selected.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onChange([])}>Clear filter</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ActiveFilterChips({
  filters,
  columns,
  onRemove,
  onClearAll,
}: {
  filters: Record<string, string[]>;
  columns: InteractiveColumn[];
  onRemove: (key: string, val: string) => void;
  onClearAll: () => void;
}) {
  const entries = Object.entries(filters).flatMap(([k, vs]) => vs.map((v) => ({ k, v })));
  if (!entries.length) return null;
  const headerByKey = new Map(columns.map((c) => [c.key, c.header]));
  return (
    <div className="flex flex-wrap items-center gap-2 px-1 text-xs">
      {entries.map(({ k, v }) => (
        <span
          key={`${k}=${v}`}
          className="inline-flex items-center gap-1 rounded-full border border-[var(--border-color)] bg-[var(--surface-inset)] px-2 py-0.5"
        >
          <span className="text-[var(--text-muted)]">{headerByKey.get(k) ?? k}</span>
          <span>{v || "—"}</span>
          <button
            type="button"
            onClick={() => onRemove(k, v)}
            aria-label={`Remove ${headerByKey.get(k) ?? k} filter ${v || "—"}`}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X size={10} />
          </button>
        </span>
      ))}
      <button type="button" onClick={onClearAll} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
        Clear all
      </button>
    </div>
  );
}

function ColumnMenu({
  columns,
  order,
  hidden,
  pinned,
  onReorder,
  onToggleHidden,
  onTogglePinned,
}: {
  columns: InteractiveColumn[];
  order: string[];
  hidden: Set<string>;
  pinned: Set<string>;
  onReorder: (next: string[]) => void;
  onToggleHidden: (key: string) => void;
  onTogglePinned: (key: string) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));
  const known = new Set(columns.map((c) => c.key));
  const orderedKeys = [
    ...order.filter((k) => known.has(k)),
    ...columns.map((c) => c.key).filter((k) => !order.includes(k)),
  ];
  const items = orderedKeys.map((k) => columns.find((c) => c.key === k)!);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedKeys.indexOf(String(active.id));
    const newIndex = orderedKeys.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(orderedKeys, oldIndex, newIndex));
  }

  return (
    <DropdownMenu>
      <Hint label="Show / hide / pin / reorder columns">
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Column settings"
            className="inline-flex h-7 w-7 items-center justify-center rounded text-[var(--text-secondary)] hover:bg-[var(--surface-inset)] hover:text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--org-primary)]"
          >
            <SlidersHorizontal size={12} aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
      </Hint>
      <DropdownMenuContent align="end" className="w-64">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={orderedKeys} strategy={verticalListSortingStrategy}>
            {items.map((c) => (
              <SortableColumnRow
                key={c.key}
                column={c}
                isHidden={hidden.has(c.key)}
                isPinned={pinned.has(c.key)}
                onToggleHidden={() => onToggleHidden(c.key)}
                onTogglePinned={() => onTogglePinned(c.key)}
              />
            ))}
          </SortableContext>
        </DndContext>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            // Show all
            columns.forEach((c) => hidden.has(c.key) && onToggleHidden(c.key));
          }}
        >
          Show all columns
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onReorder(columns.map((c) => c.key))}>Reset order</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SortableColumnRow({
  column,
  isHidden,
  isPinned,
  onToggleHidden,
  onTogglePinned,
}: {
  column: InteractiveColumn;
  isHidden: boolean;
  isPinned: boolean;
  onToggleHidden: () => void;
  onTogglePinned: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: column.key });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[var(--bg-secondary)]"
    >
      <button
        type="button"
        aria-label={`Drag ${column.header}`}
        {...attributes}
        {...listeners}
        className="cursor-grab text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        <GripVertical size={12} aria-hidden="true" />
      </button>
      <button type="button" onClick={onToggleHidden} className="flex flex-1 items-center gap-2 text-left">
        {isHidden ? (
          <EyeOff size={12} className="text-[var(--text-muted)]" aria-hidden="true" />
        ) : (
          <Eye size={12} className="opacity-50" aria-hidden="true" />
        )}
        <span className={isHidden ? "line-through opacity-60" : ""}>{column.header}</span>
      </button>
      <button
        type="button"
        onClick={onTogglePinned}
        aria-label={isPinned ? `Unpin ${column.header}` : `Pin ${column.header}`}
        className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        {isPinned ? <Pin size={10} /> : <PinOff size={10} />}
      </button>
    </div>
  );
}

/**
 * Export the visible (filtered + sorted + currently-rendered) columns to a
 * CSV download. Uses `row.values[i]` for each column when present (so
 * server-rendered cells like `<Badge>` map to their underlying scalar);
 * falls back to a stripped string of the cell node otherwise.
 */
function exportCsv(cols: InteractiveColumn[], rows: InteractiveRow[], tableId?: string) {
  const colKeyToIdx = new Map<string, number>();
  cols.forEach((c, i) => colKeyToIdx.set(c.key, i));
  const escape = (s: string) => (/[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const headerLine = cols.map((c) => escape(c.header)).join(",");
  const lines = rows.map((r) =>
    cols
      .map((c) => {
        const i = colKeyToIdx.get(c.key);
        const value = i != null ? r.values?.[i] : undefined;
        if (value == null) return "";
        return escape(String(value));
      })
      .join(","),
  );
  const csv = [headerLine, ...lines].join("\n");
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `${tableId ?? "export"}-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
