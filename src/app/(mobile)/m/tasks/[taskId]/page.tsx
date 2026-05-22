import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";
import type { Task } from "@/lib/supabase/types";
import { setTaskStatus } from "./actions";

export const dynamic = "force-dynamic";

const TRANSITIONS = [
  { value: "in_progress", label: "Start" },
  { value: "blocked", label: "Block" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
] as const;

export default async function Page({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("tasks", session.orgId, taskId);
  if (!row) notFound();
  const task = row as Task;

  return (
    <div className="px-4 pt-6 pb-24">
      <Link href="/m/tasks" className="text-xs text-[var(--text-muted)]">
        ← Tasks
      </Link>
      <h1 className="mt-2 text-2xl leading-snug font-semibold">{task.title}</h1>
      <div className="mt-3 flex items-center gap-2">
        <StatusBadge status={task.status} />
        <span className="text-xs text-[var(--text-muted)]">Due {formatDate(task.due_at)}</span>
      </div>
      {task.description && (
        <div className="surface mt-5 p-4">
          <p className="text-sm whitespace-pre-wrap">{task.description}</p>
        </div>
      )}
      <div className="mt-6">
        <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Update Status</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {TRANSITIONS.filter((t) => t.value !== task.status).map((t) => (
            <form key={t.value} action={setTaskStatus.bind(null, taskId)}>
              <input type="hidden" name="status" value={t.value} />
              <Button type="submit" variant="secondary" className="w-full">
                {t.label}
              </Button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
