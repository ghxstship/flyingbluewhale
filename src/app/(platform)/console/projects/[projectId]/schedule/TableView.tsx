"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fmtDateTime } from "@/components/detail/DetailShell";

export type TableRow = {
  id: string;
  kind: "task" | "event";
  title: string;
  status: string;
  when: string | null;
  endsAt: string | null;
};

/**
 * Flat sortable grid — the universal default view. Tasks and events
 * intermixed; the kind chip lets you scan which is which.
 */
export function TableView({ rows }: { rows: TableRow[] }) {
  if (rows.length === 0) {
    return <div className="surface p-6 text-sm text-[var(--text-muted)]">Nothing To Show.</div>;
  }
  return (
    <div className="surface overflow-hidden rounded-md border border-[var(--border-color)]">
      <table className="data-table w-full text-sm">
        <thead>
          <tr>
            <th>Title</th>
            <th>Kind</th>
            <th>Status</th>
            <th>When</th>
            <th>End</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                <Link
                  href={r.kind === "task" ? `/console/tasks/${r.id}` : `/console/events/${r.id}`}
                  className="hover:underline"
                >
                  {r.title}
                </Link>
              </td>
              <td className="font-mono text-xs text-[var(--text-muted)] uppercase">{r.kind}</td>
              <td>
                <StatusBadge status={r.status} />
              </td>
              <td className="font-mono text-xs">{r.when ? fmtDateTime(r.when) : "—"}</td>
              <td className="font-mono text-xs">{r.endsAt ? fmtDateTime(r.endsAt) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
