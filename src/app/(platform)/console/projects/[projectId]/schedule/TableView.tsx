"use client";

import Link from "next/link";
import { toTitle } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { fmtDateTime } from "@/components/detail/DetailShell";
import { useT } from "@/lib/i18n/LocaleProvider";

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
  const t = useT();
  if (rows.length === 0) {
    return (
      <div className="surface p-6 text-sm text-[var(--p-text-2)]">
        {t("console.projects.schedule.table.empty", undefined, "Nothing To Show.")}
      </div>
    );
  }
  return (
    <div className="surface overflow-hidden rounded-md border border-[var(--p-border)]">
      <table className="ps-table w-full text-sm">
        <thead>
          <tr>
            <th>{t("console.projects.schedule.table.title", undefined, "Title")}</th>
            <th>{t("console.projects.schedule.table.kind", undefined, "Kind")}</th>
            <th>{t("console.projects.schedule.table.status", undefined, "Status")}</th>
            <th>{t("console.projects.schedule.table.when", undefined, "When")}</th>
            <th>{t("console.projects.schedule.table.end", undefined, "End")}</th>
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
              <td className="font-mono text-xs text-[var(--p-text-2)] uppercase">{toTitle(r.kind)}</td>
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
