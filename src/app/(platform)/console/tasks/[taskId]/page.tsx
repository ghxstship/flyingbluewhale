import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";
import { timeAgo } from "@/lib/format";
import { TaskStatusControls } from "./TaskStatusControls";
import { deleteTask } from "./edit/actions";

export const dynamic = "force-dynamic";

export default async function TaskPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const task = await getOrgScoped("tasks", session.orgId, taskId);
  if (!task) notFound();
  return (
    <>
      <ModuleHeader
        eyebrow={`P${task.priority} task`}
        title={task.title}
        subtitle={`${task.status} · due ${formatDate(task.due_at, "medium")}`}
        action={
          <div className="flex items-center gap-2">
            <TaskStatusControls id={task.id} status={task.status} />
            <Button href={`/console/tasks/${taskId}/edit`} size="sm" variant="secondary">
              Edit
            </Button>
            <DeleteForm
              action={deleteTask.bind(null, taskId)}
              confirm={`Delete task "${task.title}"? This cannot be undone.`}
            />
          </div>
        }
      />
      <div className="page-content space-y-6">
        <div className="metric-grid">
          <Field label="Status">
            <StatusBadge status={task.status} />
          </Field>
          <Field label="Priority">P{task.priority}</Field>
          <Field label="Due">{formatDate(task.due_at, "medium")}</Field>
          <Field label="Updated">{timeAgo(task.updated_at)}</Field>
        </div>
        {task.description && (
          <div className="surface p-5">
            <h3 className="text-sm font-semibold">Description</h3>
            <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--text-secondary)]">{task.description}</p>
          </div>
        )}
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="surface-raised p-3">
      <div className="text-[11px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">{label}</div>
      <div className="mt-1 font-mono text-sm">{children}</div>
    </div>
  );
}
