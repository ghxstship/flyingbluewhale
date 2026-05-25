"use client";

import * as React from "react";
import Link from "next/link";
import type { SavedViewWidget as SavedViewWidgetConfig } from "@/lib/dashboards/types";
import type { SavedView, ViewConfigRow } from "@/lib/views/types";
import { formatDate } from "@/lib/i18n/format";

/**
 * SavedViewWidget — embeds a `view_configs` row's saved view as a read-only
 * table preview. The page-level server component resolves the view config
 * and a sample of rows; this client component renders them with the saved
 * view's column ordering, hidden columns, and pinned columns honored.
 *
 * For MVP we render a compact HTML table inline rather than mounting the
 * full `<DataTable>` (which is an async server component and ships its own
 * toolbar / sort UI we don't want inside a dashboard cell). Click-through
 * on the header navigates to the saved view's host page.
 */
export type SavedViewWidgetData = {
  /** The view_configs row; null when the referenced row no longer exists
   *  or the caller can't read it (RLS). */
  view: ViewConfigRow | null;
  /** Sample rows to preview. Already filtered/limited server-side. */
  rows: Array<Record<string, unknown>>;
  /** Optional href to the host page that mounts the full DataTable. */
  href?: string;
};

export function SavedViewWidget({
  widget,
  data,
}: {
  widget: SavedViewWidgetConfig;
  data: SavedViewWidgetData;
}): React.ReactElement {
  const { view, rows, href } = data;

  if (!view) {
    return (
      <div className="surface flex h-full flex-col p-4">
        <div className="mb-2 text-sm font-semibold tracking-tight text-[var(--foreground)]">
          {widget.title ?? "Saved View"}
        </div>
        <div className="flex flex-1 items-center justify-center text-xs text-[var(--text-muted)]">
          The referenced saved view is unavailable.
        </div>
      </div>
    );
  }

  const columns = deriveColumns(rows, view.config);
  const limit = widget.rowLimit ?? 10;
  const visibleRows = rows.slice(0, limit);

  return (
    <div className="surface flex h-full flex-col overflow-hidden p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold tracking-tight text-[var(--foreground)]">
            {widget.title ?? view.name}
          </div>
          {widget.title && view.name !== widget.title && (
            <div className="truncate text-[10px] tracking-wider text-[var(--text-muted)] uppercase">{view.name}</div>
          )}
        </div>
        {href && (
          <Link
            href={href}
            className="shrink-0 text-[10px] font-medium tracking-wider text-[var(--org-primary)] uppercase hover:underline"
          >
            Open
          </Link>
        )}
      </div>
      <div className="-mx-3 flex-1 overflow-auto px-3">
        <table className="data-table w-full text-xs">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="border-b border-[var(--border-color)] px-2 py-1.5 text-left text-[10px] font-medium tracking-wider text-[var(--text-muted)] uppercase"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length || 1} className="px-2 py-3 text-center text-[var(--text-muted)]">
                  No rows.
                </td>
              </tr>
            ) : (
              visibleRows.map((row, i) => (
                <tr key={i} className="border-b border-[var(--border-color)] last:border-b-0">
                  {columns.map((col) => (
                    <td key={col} className="px-2 py-1.5 text-[var(--text-secondary)]">
                      {formatCell(row[col])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {rows.length > visibleRows.length && (
        <div className="mt-2 text-[10px] text-[var(--text-muted)]">
          Showing {visibleRows.length} of {rows.length} rows.
        </div>
      )}
    </div>
  );
}

function deriveColumns(rows: Array<Record<string, unknown>>, config: SavedView): string[] {
  const all = new Set<string>();
  for (const r of rows) {
    for (const k of Object.keys(r)) all.add(k);
  }
  const hidden = new Set(config.hidden ?? []);
  const pinned = config.pinned ?? [];
  const order = config.order ?? [];

  const visible = [...all].filter((k) => !hidden.has(k));
  const ordered: string[] = [];
  // 1. Pinned first.
  for (const k of pinned) if (visible.includes(k) && !ordered.includes(k)) ordered.push(k);
  // 2. Explicit order next.
  for (const k of order) if (visible.includes(k) && !ordered.includes(k)) ordered.push(k);
  // 3. Remaining columns.
  for (const k of visible) if (!ordered.includes(k)) ordered.push(k);
  return ordered;
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(2);
  if (typeof value === "string") return value;
  if (value instanceof Date) return formatDate(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
