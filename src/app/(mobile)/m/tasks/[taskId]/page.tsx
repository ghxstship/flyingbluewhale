import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";
import type { Task } from "@/lib/supabase/types";
import { setTaskStatus } from "./actions";

export const dynamic = "force-dynamic";

const TRANSITIONS = [
  { value: "in_progress", labelKey: "m.tasks.detail.transition.start", labelFallback: "Start" },
  { value: "blocked", labelKey: "m.tasks.detail.transition.block", labelFallback: "Block" },
  { value: "review", labelKey: "m.tasks.detail.transition.review", labelFallback: "Review" },
  { value: "done", labelKey: "m.tasks.detail.transition.done", labelFallback: "Done" },
] as const;

export default async function Page({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("tasks", session.orgId, taskId);
  if (!row) notFound();
  const task = row as Task;
  const { t } = await getRequestT();

  return (
    <div className="px-4 pt-6 pb-24">
      <Link href="/m/tasks" className="text-xs text-[var(--text-muted)]">
        {t("m.tasks.detail.back", undefined, "← Tasks")}
      </Link>
      <h1 className="mt-2 text-2xl leading-snug font-semibold">{task.title}</h1>
      <div className="mt-3 flex items-center gap-2">
        <StatusBadge status={task.status} />
        <span className="text-xs text-[var(--text-muted)]">
          {t("m.tasks.detail.dueLabel", { date: formatDate(task.due_at) }, `Due ${formatDate(task.due_at)}`)}
        </span>
      </div>
      {task.description && (
        <div className="surface mt-5 p-4">
          <p className="text-sm whitespace-pre-wrap">{task.description}</p>
        </div>
      )}
      <div className="mt-6">
        <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
          {t("m.tasks.detail.updateStatus", undefined, "Update Status")}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {TRANSITIONS.filter((tx) => tx.value !== task.status).map((tx) => (
            <form key={tx.value} action={setTaskStatus.bind(null, taskId)}>
              <input type="hidden" name="status" value={tx.value} />
              <button type="submit" className="btn btn-secondary w-full">
                {t(tx.labelKey, undefined, tx.labelFallback)}
              </button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
