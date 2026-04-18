"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PullToRefresh } from "@/components/mobile/PullToRefresh";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/i18n/format";
import type { Task } from "@/lib/supabase/types";

export function TasksList({ initial }: { initial: Task[] }) {
  const [tasks] = useState(initial);
  const router = useRouter();
  const [, start] = useTransition();
  const open = tasks.filter((r) => r.status !== "done");

  async function refresh() {
    return new Promise<void>((resolve) => {
      start(() => {
        router.refresh();
        // Give Next a tick to fetch fresh server data
        setTimeout(resolve, 400);
      });
    });
  }

  return (
    <PullToRefresh onRefresh={refresh}>
      <div className="px-4 pt-6 pb-24">
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--org-primary)]">
          Field
        </div>
        <h1 className="mt-1 text-2xl font-semibold">My tasks</h1>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {open.length} open · {tasks.length - open.length} done
        </p>
        <ul className="mt-4 space-y-2">
          {tasks.length === 0 ? (
            <li className="surface p-5 text-center text-sm text-[var(--text-muted)]">
              No tasks assigned
            </li>
          ) : (
            tasks.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/console/tasks/${t.id}`}
                  className="surface-raised flex items-center justify-between p-4"
                >
                  <div>
                    <div className="text-sm font-medium">{t.title}</div>
                    <div className="mt-1 text-xs text-[var(--text-muted)]">
                      Due {formatDate(t.due_at)}
                    </div>
                  </div>
                  <StatusBadge status={t.status} />
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </PullToRefresh>
  );
}
