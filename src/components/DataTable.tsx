import Link from "next/link";
import type { ReactNode } from "react";

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  rowHref,
  emptyLabel = "No records yet",
}: {
  rows: T[];
  columns: Column<T>[];
  rowHref?: (row: T) => string;
  emptyLabel?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="surface px-6 py-10 text-center text-sm text-[var(--text-muted)]">{emptyLabel}</div>
    );
  }
  return (
    <div className="surface overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.className}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const href = rowHref?.(row);
            return (
              <tr key={row.id}>
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
