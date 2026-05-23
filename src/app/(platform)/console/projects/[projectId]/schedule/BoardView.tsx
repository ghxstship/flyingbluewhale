"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";

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
  const statuses = Array.from(new Set(cards.map((c) => c.status))).sort();
  if (statuses.length === 0) {
    return <div className="surface p-6 text-sm text-[var(--text-muted)]">Nothing To Board.</div>;
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
              <span className="font-mono text-[10px] text-[var(--text-muted)]">{items.length}</span>
            </div>
            <ul className="space-y-2">
              {items.map((c) => (
                <li key={c.id}>
                  <Link
                    href={c.kind === "task" ? `/console/tasks/${c.id}` : `/console/events/${c.id}`}
                    className="surface hover-lift block rounded-sm p-2.5 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium">{c.title}</div>
                      <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase">
                        {c.kind === "task" ? "T" : "E"}
                      </span>
                    </div>
                    {c.due && <div className="mt-1 font-mono text-[10px] text-[var(--text-muted)]">{c.due}</div>}
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
