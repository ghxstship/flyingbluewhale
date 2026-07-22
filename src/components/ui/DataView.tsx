"use client";

import { useState, type ReactNode } from "react";
import { LayoutGrid, Rows3 } from "lucide-react";

/**
 * <DataView> — a generic record collection that toggles between a table
 * and a card grid. Used for the LEG3ND community members directory
 * (cards = avatar + contribution points) and any other browse surface
 * that benefits from a view switch. Token-only.
 *
 * Generic over the row type `T`; columns drive the table, `renderCard`
 * drives the grid (falls back to the column values stacked).
 */
export type DataViewColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
};

export function DataView<T>({
  items,
  columns,
  getKey,
  renderCard,
  defaultView = "table",
  emptyLabel = "Nothing here yet",
  toggleable = true,
}: {
  items: T[];
  columns: DataViewColumn<T>[];
  getKey: (row: T) => string;
  renderCard?: (row: T) => ReactNode;
  defaultView?: "table" | "grid";
  emptyLabel?: string;
  toggleable?: boolean;
}) {
  const [view, setView] = useState<"table" | "grid">(defaultView);

  if (!items.length) {
    return <p className="px-1 py-8 text-center text-sm text-[var(--p-text-2)]">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {toggleable && (
        <div className="flex justify-end gap-1">
          {(["table", "grid"] as const).map((v) => {
            const on = view === v;
            const Icon = v === "table" ? Rows3 : LayoutGrid;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={on}
                aria-label={v === "table" ? "Table view" : "Grid view"}
                className="flex h-9 w-9 items-center justify-center rounded-[var(--p-r-md)]"
                style={{
                  background: on ? "color-mix(in srgb, var(--p-accent) 14%, var(--p-surface))" : "var(--p-surface)",
                  border: `1px solid ${on ? "color-mix(in srgb, var(--p-accent) 40%, transparent)" : "var(--p-border)"}`,
                  color: on ? "var(--p-accent)" : "var(--p-text-2)",
                }}
              >
                <Icon size={16} />
              </button>
            );
          })}
        </div>
      )}

      {view === "table" ? (
        <div className="surface overflow-x-auto">
          <table className="ps-table w-full text-sm">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.key} scope="col" style={{ textAlign: c.align ?? "left" }} className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--p-text-3)]">
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={getKey(row)} className="border-t border-[var(--p-border)]">
                  {columns.map((c) => (
                    <td key={c.key} style={{ textAlign: c.align ?? "left" }} className="px-3 py-2 text-[var(--p-text-1)]">
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((row) => (
            <div key={getKey(row)} className="surface p-4">
              {renderCard ? (
                renderCard(row)
              ) : (
                <dl className="flex flex-col gap-1">
                  {columns.map((c) => (
                    <div key={c.key} className="flex justify-between gap-2 text-sm">
                      <dt className="text-xs uppercase tracking-wide text-[var(--p-text-3)]">{c.header}</dt>
                      <dd className="text-right text-[var(--p-text-1)]">{c.render(row)}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
