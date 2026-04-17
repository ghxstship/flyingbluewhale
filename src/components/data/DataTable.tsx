import type { ReactNode } from 'react';

/* ═══════════════════════════════════════════════════════
   DataTable — Canonical data table
   Replaces 8+ inline <table style={{...}}> patterns.
   Uses globals.css .data-table as styling base.
   ═══════════════════════════════════════════════════════ */

export interface DataTableColumn<T> {
  /** Unique key for the column */
  key: string;
  /** Column header text */
  header: string;
  /** Text alignment */
  align?: 'left' | 'right' | 'center';
  /** Custom render function. Falls back to string coercion of accessor result. */
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  /** Unique key extractor. Defaults to (row as any).id */
  rowKey?: (row: T) => string;
  /** Text shown when data is empty */
  emptyText?: string;
  /** Optional row background override */
  rowClassName?: (row: T) => string;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  emptyText = 'No data',
  rowClassName,
  className = '',
}: DataTableProps<T>) {
  const getKey = rowKey ?? ((row: T) => (row as Record<string, unknown>).id as string);

  if (data.length === 0) {
    return (
      <div className={`card p-16 text-center ${className}`}>
        <p className="text-sm text-text-tertiary">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className={`card overflow-auto ${className}`}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ textAlign: col.align ?? 'left' }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={getKey(row)}
              className={rowClassName?.(row) ?? ''}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{ textAlign: col.align ?? 'left' }}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
