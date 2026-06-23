"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useT } from "@/lib/i18n/LocaleProvider";

export type BoardCard = {
  id: string;
  kind: "task" | "event";
  title: string;
  status: string;
  due: string | null;
};

/**
 * Kanban-style board grouped by status. Each card links to its detail page.
 * Status columns are derived from the union of statuses present in the data
 * so empty columns don't waste horizontal space.
 */
export function BoardView({ cards }: { cards: BoardCard[] }) {
  const t = useT();
  const statuses = Array.from(new Set(cards.map((c) => c.status))).sort();
  if (statuses.length === 0) {
    return (
      <div className="surface p-6 text-sm text-[var(--p-text-2)]">
        {t("console.projects.schedule.board.empty", undefined, "Nothing To Board.")}
      </div>
    );
  }
  const byStatus = new Map<string, BoardCard[]>();
  for (const c of cards) {
    const list = byStatus.get(c.status) ?? [];
    list.push(c);
    byStatus.set(c.status, list);
  }
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {statuses.map((s) => {
        const items = byStatus.get(s) ?? [];
        return (
          <div key={s} className="surface-inset w-72 shrink-0 rounded-md p-2">
            <div className="mb-2 flex items-center justify-between px-1">
              <StatusBadge status={s} />
              <span className="font-mono text-[10px] text-[var(--p-text-2)]">{items.length}</span>
            </div>
            <ul className="space-y-2">
              {items.map((c) => (
                <li key={c.id}>
                  <Link
                    href={c.kind === "task" ? `/studio/tasks/${c.id}` : `/studio/events/${c.id}`}
                    className="surface hover-lift block rounded-sm p-2.5 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium">{c.title}</div>
                      <span className="font-mono text-[10px] text-[var(--p-text-2)] uppercase">
                        {c.kind === "task"
                          ? t("console.projects.schedule.board.kindTask", undefined, "T")
                          : t("console.projects.schedule.board.kindEvent", undefined, "E")}
                      </span>
                    </div>
                    {c.due && <div className="mt-1 font-mono text-[10px] text-[var(--p-text-2)]">{c.due}</div>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
