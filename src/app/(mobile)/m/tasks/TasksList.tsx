"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PullToRefresh } from "@/components/mobile/PullToRefresh";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/i18n/format";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { Task } from "@/lib/supabase/types";

export function TasksList({ initial }: { initial: Task[] }) {
  const t = useT();
  const [tasks] = useState(initial);
  const router = useRouter();
  const open = tasks.filter((r) => r.task_state !== "done");

  async function refresh() {
    // Plain refresh — avoids wrapping router.refresh in a transition, which
    // Playwright sees as a never-settling "load" state on mobile.
    router.refresh();
    await new Promise<void>((r) => setTimeout(r, 200));
  }

  return (
    <PullToRefresh onRefresh={refresh}>
      <div className="px-4 pt-6 pb-24">
        <div className="text-xs font-semibold tracking-wider text-[var(--p-accent)] uppercase">
          {t("m.tasks.eyebrow", undefined, "Field")}
        </div>
        <h1 className="mt-1 text-2xl font-semibold">{t("m.tasks.title", undefined, "My Tasks")}</h1>
        <p className="mt-1 text-xs text-[var(--p-text-2)]">
          {t(
            "m.tasks.counts",
            { open: open.length, done: tasks.length - open.length },
            `${open.length} open · ${tasks.length - open.length} done`,
          )}
        </p>
        <ul className="mt-4 space-y-2">
          {tasks.length === 0 ? (
            <li className="surface p-5 text-center text-sm text-[var(--p-text-2)]">
              {t("m.tasks.empty", undefined, "No tasks assigned")}
            </li>
          ) : (
            tasks.map((task) => (
              <li key={task.id}>
                <Link href={`/m/tasks/${task.id}`} className="surface flex items-center justify-between p-4">
                  <div>
                    <div className="text-sm font-medium">{task.title}</div>
                    <div className="mt-1 text-xs text-[var(--p-text-2)]">
                      {t("m.tasks.dueLabel", { date: formatDate(task.due_at) }, `Due ${formatDate(task.due_at)}`)}
                    </div>
                  </div>
                  <StatusBadge status={task.task_state} />
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </PullToRefresh>
  );
}
