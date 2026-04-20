import Link from "next/link";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/EmptyState";

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
  className?: string;
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
  loading?: boolean;
  density?: "comfortable" | "compact";
};

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  rowHref,
  emptyLabel = "No records yet",
  loading,
  density = "comfortable",
}: DataTableProps<T>) {
  if (loading) {
    return <DataTableSkeleton columns={columns.length} rows={6} />;
  }

  if (rows.length === 0) {
    return <EmptyState title={emptyLabel} />;
  }

  const rowPad = density === "compact" ? "py-1.5" : "py-2.5";

  return (
    <div className="surface overflow-x-auto">
      <table className="data-table" role="grid" aria-rowcount={rows.length}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.className}>
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

