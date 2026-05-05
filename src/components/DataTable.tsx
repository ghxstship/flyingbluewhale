import type { ReactNode } from "react";
import { headers } from "next/headers";
import {
  DataTableInteractive,
  type InteractiveColumn,
  type InteractiveRow,
  type BulkAction as InteractiveBulkAction,
} from "./DataTableInteractive";
import type { RowActionItem } from "./ui/RowActions";
import { EmptyState } from "./ui/EmptyState";

/**
 * DataTable — server-side wrapper around DataTableInteractive.
 *
 * Pre-renders cells with the caller's per-row `render` functions, derives
 * scalar `values[]` from the optional `accessor` (or strips text from the
 * rendered ReactNode), and hands the result to the interactive client
 * component. The wrapper also auto-derives a stable `tableId` from the
 * current pathname so saved views, sort, filter, search, and column state
 * persist per page without callers having to think about it.
 *
 * The legacy props (`emptyLabel`, `density`, `stickyHeader`, `maxHeight`)
 * are forwarded so existing call-sites compile unchanged.
 *
 * For sort + filter + pin to work on a column the caller must either set
 * `sortable: true` / `filterable: true` and ideally provide an `accessor`
 * that returns a string or number. Without an accessor the wrapper falls
 * back to the plain-text content of the rendered cell.
 */

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /** Per-cell className applied to `<td>`. */
  className?: string;
  /** Optional header-only className (`<th>`). */
  headerClassName?: string;
  /** Enable header click-to-sort. */
  sortable?: boolean;
  /** Enable per-column include-only filter (multi-select on distinct values). */
  filterable?: boolean;
  /** Default-hidden columns the user can re-enable from the column menu. */
  defaultHidden?: boolean;
  /** Surface this column as a Group-by option. */
  groupable?: boolean;
  /** When true, render cells in the theme's mono font — for genuinely
   *  code-like data (hashes, IDs, file paths). Don't enable for emails,
   *  phones, names, free text — body font reads better. Replaces the
   *  prior pattern of stringly-typed `className: "font-mono text-xs"`
   *  that scattered mono everywhere. */
  mono?: boolean;
  /** When true, render cells with `tabular-nums` so numeric columns align
   *  vertically. Use for money / counts / percentages. */
  tabular?: boolean;
  /** Returns the underlying scalar value for sort / filter / CSV export.
   *  Returning `unknown` is allowed so pages with loosely-typed rows can pass
   *  a field through; the wrapper coerces non-scalars to a stringified value. */
  accessor?: (row: T) => string | number | null | undefined | unknown;
  /** When set, renders a `<tfoot>` cell aggregating the column's accessor
   *  values across the (filtered) rows. Per SmartSuite Column Totals.
   *  - `count`  — number of rows where the value is non-null
   *  - `sum`    — sum of numeric coercions; nulls / NaN ignored
   *  - `avg`    — mean of numeric coercions; nulls / NaN ignored
   *  - `min`    — min of numeric coercions
   *  - `max`    — max of numeric coercions
   *  Renders `—` when there are no eligible values. */
  total?: "sum" | "avg" | "min" | "max" | "count";
  /** Optional formatter for the footer cell. Defaults to plain
   *  `toLocaleString()` for numeric aggregates and the integer string for
   *  `count`. */
  totalFormat?: (n: number) => string;
};

/**
 * Spotlight rule — applied per-row. When `when(row)` is true the row (or a
 * specific cell, if `scope: 'cell'`) picks up the tone class. Per
 * [SmartSuite Spotlight](https://help.smartsuite.com/en/articles/4766225-spotlight).
 *
 * Multiple matching rules layer in array order; later rules win for the
 * scope they target (row tone vs cell tone).
 */
export type SpotlightRule<T> = {
  /** Predicate run per row. */
  when: (row: T) => boolean;
  /** Tone token. Maps to CSS class `data-spotlight-{tone}`. */
  tone: "info" | "warn" | "error" | "success" | "neutral";
  /** What to color. Default 'row'. 'cell' requires `cell` (column key). */
  scope?: "row" | "cell";
  /** Required when scope==='cell'. */
  cell?: string;
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
  rowHref?: (row: T) => string | undefined;
  emptyLabel?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  loading?: boolean;
  density?: "comfortable" | "compact";
  stickyHeader?: boolean;
  maxHeight?: string;
  /** Stable identifier — overrides the auto-derived tableId. Use when a
   *  page renders multiple tables, or you want a deliberate persistence key. */
  tableId?: string;
  /** Toolbar search box. Defaults to true when there are 6+ rows. */
  searchable?: boolean;
  /** When set, paginate at this size. Mutually exclusive with row virtualization. */
  pageSize?: number;
  /** Per-row kebab-menu actions. Function receives the row and returns the
   *  menu item list (or null/undefined to skip). Runs server-side on the
   *  initial render; refresh the page after bulk-action completion to refetch. */
  rowActions?: (row: T) => RowActionItem[] | null | undefined;
  /** Bulk-action toolbar — receives the selected row IDs (strings). Must
   *  be a client-safe callable: pass a server action ref or a wrapper that
   *  fires a fetch. */
  bulkActions?: Array<{
    id: string;
    label: string;
    variant?: "default" | "danger";
    perform: (ids: string[]) => void | Promise<void>;
  }>;
  /** Optional Import handler. Surfaces an "Import" button in the toolbar
   *  that opens a file picker; selected file is passed to this callback for
   *  the page to parse / upload. */
  onImport?: (file: File) => void | Promise<void>;
  /** Optional Refresh handler. Defaults to `router.refresh()` when omitted. */
  onRefresh?: () => void | Promise<void>;
  /** Per-row className resolver. Return CSS class string or undefined. Used
   *  for ad-hoc conditional row formatting; for the structured rule API see
   *  `spotlight`. */
  rowClassName?: (row: T) => string | undefined;
  /** Spotlight rules — applied row-by-row. Multiple matching rules layer in
   *  array order; the last matching rule wins for its scope. */
  spotlight?: SpotlightRule<T>[];
  /** Which kind of view the host page is rendering. P3.1 only ships
   *  `'grid'`; alt renderers (kanban, calendar, timeline, chart, map)
   *  land in P3.2-3.6 and read this off the saved-view row's `type`.
   *  Defaults to `'grid'`. */
  viewType?: "grid" | "kanban" | "calendar" | "timeline" | "chart" | "map";
};

// Helpers — defined above the component because Turbopack's server runtime
// has been observed not to hoist function declarations across an `async`
// component boundary.
function coerceScalar(v: unknown): string | number | null {
  if (v == null || typeof v === "boolean") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") return v;
  if (v instanceof Date) return v.toISOString();
  try {
    return String(v);
  } catch {
    return null;
  }
}

function extractText(node: ReactNode): string | number | null {
  if (node == null || typeof node === "boolean") return null;
  if (typeof node === "number") return node;
  if (typeof node === "string") return node;
  if (Array.isArray(node))
    return node
      .map(extractText)
      .filter((v) => v != null)
      .join(" ");
  const obj = node as unknown as { props?: { children?: ReactNode } };
  if (obj && typeof obj === "object" && obj.props && "children" in obj.props) {
    return extractText(obj.props.children);
  }
  return null;
}

function normalizePath(p: string): string {
  try {
    const u = p.startsWith("http") ? new URL(p) : { pathname: p };
    return (u.pathname || "/").replace(/\/+$/, "") || "/";
  } catch {
    return p;
  }
}

async function deriveTableId<T>(columns: Column<T>[]): Promise<string> {
  try {
    const h = await headers();
    const path = h.get("x-pathname") ?? h.get("x-invoke-path") ?? h.get("referer") ?? "";
    if (path) return `t:${normalizePath(path)}:${columns.map((c) => c.key).join(",")}`;
  } catch {
    /* not in a request scope — fall through to fingerprint */
  }
  return `t:${columns.map((c) => c.key).join(",")}`;
}

export async function DataTable<T extends { id: string }>({
  rows,
  columns,
  rowHref,
  emptyLabel = "No records yet",
  emptyDescription,
  emptyAction,
  loading,
  density,
  // Absorbed by the interactive component (header is always sticky there;
  // body bound at 70vh). Kept in props for API compatibility with the
  // legacy DataTable shape — see file-level docstring.
  stickyHeader: _stickyHeader,
  maxHeight: _maxHeight,
  tableId,
  searchable,
  pageSize,
  rowActions,
  bulkActions,
  onImport,
  onRefresh,
  rowClassName,
  spotlight,
  viewType = "grid",
}: DataTableProps<T>) {
  if (loading) {
    return <DataTableSkeleton columns={columns.length} rows={6} />;
  }

  if (rows.length === 0) {
    return (
      <DataTableEmpty
        columns={columns.map((c) => ({
          key: c.key,
          header: c.header,
          headerClassName: c.headerClassName,
          className: c.className,
        }))}
        title={emptyLabel}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  // Auto-derive a stable tableId from the current pathname so saved views
  // persist per-page without callers having to wire it manually. Falls back
  // to a column-fingerprint hash when the request headers aren't available
  // (e.g. unit tests).
  const resolvedTableId = tableId ?? (await deriveTableId(columns));

  // Sort defaults true on every column — the wrapper falls back to text-stripped
  // cell content when accessor is omitted, so even unannotated columns sort.
  // Pages that genuinely don't want sort (decorative / actions columns) opt
  // out with `sortable: false`.
  //
  // Compose className from explicit + typed flags (mono / tabular). The
  // typed flags are the canonical way to express semantics; explicit
  // className stays as an escape hatch.
  const composeClassName = (c: Column<T>): string | undefined => {
    const parts = [c.className].filter(Boolean) as string[];
    if (c.mono) parts.push("font-mono text-xs");
    if (c.tabular) parts.push("tabular-nums");
    return parts.length ? parts.join(" ") : undefined;
  };
  const interactiveCols: InteractiveColumn[] = columns.map((c) => ({
    key: c.key,
    header: c.header,
    className: composeClassName(c),
    sortable: c.sortable ?? true,
    filterable: c.filterable,
    defaultHidden: c.defaultHidden,
    groupable: c.groupable,
    total: c.total,
    totalFormat: c.totalFormat,
  }));

  const interactiveRows: InteractiveRow[] = rows.map((row) => {
    const cells = columns.map((c) => c.render(row));
    const values = columns.map((c, i) => (c.accessor ? coerceScalar(c.accessor(row)) : extractText(cells[i])));
    const actions = rowActions?.(row) ?? undefined;

    // Spotlight — collapse matching rules into a row-level className and
    // an optional per-cell className map. Later rules win.
    let rowSpotClass: string | undefined;
    let cellClassNames: Record<string, string> | undefined;
    if (spotlight && spotlight.length) {
      for (const rule of spotlight) {
        if (!rule.when(row)) continue;
        const toneClass = `data-spotlight-${rule.tone}`;
        if (rule.scope === "cell" && rule.cell) {
          cellClassNames = { ...(cellClassNames ?? {}), [rule.cell]: toneClass };
        } else {
          rowSpotClass = toneClass;
        }
      }
    }

    const explicit = rowClassName?.(row);
    const className = [explicit, rowSpotClass].filter(Boolean).join(" ") || undefined;

    return {
      id: row.id,
      href: rowHref?.(row),
      cells,
      values,
      actions: actions && actions.length ? actions : undefined,
      className,
      cellClassNames,
    };
  });

  const interactiveBulk: InteractiveBulkAction[] | undefined = bulkActions?.map((a) => ({
    id: a.id,
    label: a.label,
    variant: a.variant,
    perform: a.perform,
  }));

  return (
    <DataTableInteractive
      rows={interactiveRows}
      columns={interactiveCols}
      emptyLabel={emptyLabel}
      // Search is canonical chrome — always visible unless the caller
      // explicitly opts out with `searchable={false}` (rare; e.g. a
      // 3-row finance summary that genuinely doesn't grow). Was
      // auto-hidden when rows.length < 6 which made small tables
      // feel broken / muscle memory ("⌘F isn't here?") miss.
      searchable={searchable ?? true}
      pageSize={pageSize}
      density={density}
      bulkActions={interactiveBulk}
      tableId={resolvedTableId}
      onImport={onImport}
      onRefresh={onRefresh}
      viewType={viewType}
    />
  );
  // `stickyHeader` and `maxHeight` are absorbed: the interactive table
  // pins the header by default and bounds height to 70vh. If a caller
  // genuinely needs different bounds we can expose them later.
}

/**
 * DataTableEmpty — structure-preserving empty state. Headers stay live so
 * operators can read the data model at a glance; ghost rows show field
 * shape; centered overlay delegates to the canonical `<EmptyState>`
 * primitive so blank slates look identical across every shell (Linear /
 * Stripe / Attio pattern: structure visible behind, message centered).
 */
function DataTableEmpty({
  columns,
  title,
  description,
  action,
  ghostRows = 4,
}: {
  columns: Array<{ key: string; header: string; headerClassName?: string; className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
  ghostRows?: number;
}) {
  return (
    <div className="relative overflow-x-auto" aria-label={title} role="status">
      <table className="data-table" role="grid" aria-hidden="true">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.headerClassName}>
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
                  <span className="text-[var(--text-muted)]">—</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 px-4">
        <div className="pointer-events-auto mx-auto max-w-sm rounded-md border border-[var(--border-color)] bg-[var(--background)]/95 backdrop-blur-md">
          <EmptyState size="compact" title={title} description={description} action={action} />
        </div>
      </div>
    </div>
  );
}

function DataTableSkeleton({ columns, rows }: { columns: number; rows: number }) {
  return (
    <div className="overflow-x-auto" aria-busy="true" aria-label="Loading table">
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
