import Link from "next/link";
import type { ReactNode } from "react";

/**
 * DataTable — server component.
 *
 * Renders a tenant-scoped table with one column-per-cell. Accepts function
 * props (`rowHref`, `column.render`) because it stays on the server.
 *
 * For sort / filter / pagination / saved views, import DataTableInteractive
 * directly from `@/components/DataTableInteractive` (a "use client" sibling).
 */

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /** Per-cell className applied to `<td>` only. Use for cell-level
   *  utilities like `font-mono text-xs` — they must NOT leak into the
   *  header (where they would override the theme's display-serif font). */
  className?: string;
  /** Optional header-only className (`<th>`). Most callers don't need this;
   *  the table header inherits the active theme's display font. */
  headerClassName?: string;
  /** Used by interactive wrapper for sort + filter. */
  sortable?: boolean;
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
  /** Optional second line under `emptyLabel` in the empty-state overlay. */
  emptyDescription?: string;
  /** Optional CTA rendered inside the empty-state overlay (e.g. "+ New X"). */
  emptyAction?: ReactNode;
  loading?: boolean;
  density?: "comfortable" | "compact";
  /** Pin the table header to the top of its scroll container. Gets the
   *  surface background so rows scroll cleanly underneath. Modern data
   *  grid expectation. */
  stickyHeader?: boolean;
  /** Bound the table height; rows scroll inside this container, header
   *  stays pinned (use with `stickyHeader`). */
  maxHeight?: string;
};

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  rowHref,
  emptyLabel = "No records yet",
  emptyDescription,
  emptyAction,
  loading,
  density = "comfortable",
  stickyHeader,
  maxHeight,
}: DataTableProps<T>) {
  if (loading) {
    return <DataTableSkeleton columns={columns.length} rows={6} />;
  }

  if (rows.length === 0) {
    return (
      <DataTableEmpty
        columns={columns}
        title={emptyLabel}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  const rowPad = density === "compact" ? "py-1.5" : "py-2.5";

  return (
    <div
      className="surface overflow-auto"
      style={maxHeight ? { maxHeight } : undefined}
    >
      <table className="data-table" role="grid" aria-rowcount={rows.length}>
        <thead className={stickyHeader ? "sticky top-0 z-10 bg-[var(--background)]" : undefined}>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.headerClassName}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const href = rowHref?.(row);
            return (
              <tr key={row.id} className={rowPad}>
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
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * DataTableEmpty — structure-preserving empty state. Headers stay live so
 * operators can read the data model at a glance; ghost rows show field
 * shape; centered overlay carries the title / description / CTA. Modeled
 * on Linear, Stripe, Ramp, Attio, and Notion empty data views.
 */
function DataTableEmpty<T>({
  columns,
  title,
  description,
  action,
  ghostRows = 4,
}: {
  columns: Column<T>[];
  title: string;
  description?: string;
  action?: ReactNode;
  ghostRows?: number;
}) {
  return (
    <div className="surface relative overflow-x-auto" aria-label={title}>
      <table className="data-table" role="grid">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.headerClassName}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody aria-hidden="true">
          {Array.from({ length: ghostRows }).map((_, r) => (
            <tr
              key={r}
              className="opacity-30"
              style={{ borderBottomStyle: "dashed" }}
            >
              {columns.map((c) => (
                <td key={c.key} className={c.className}>
                  <span className="text-[var(--text-muted)]">—</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div
        role="status"
        className="absolute inset-x-0 top-1/2 mx-auto flex max-w-sm -translate-y-1/2 flex-col items-center gap-2 rounded-md border border-[var(--border-color)] bg-[var(--surface-raised)] px-5 py-4 text-center shadow-sm"
        style={{ marginTop: 12 }}
      >
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
        {description && (
          <p className="text-xs text-[var(--text-muted)]">{description}</p>
        )}
        {action && <div className="mt-1">{action}</div>}
      </div>
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

