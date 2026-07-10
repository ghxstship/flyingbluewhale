import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DueDateBadge } from "@/components/ui/DueDateBadge";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/i18n/format";
import { timeAgo } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import type { Task, TaskStatus } from "@/lib/supabase/types";
import { TasksKanban } from "./TasksKanban";
import { bulkCompleteTasks, editTaskCell } from "./actions";

export const dynamic = "force-dynamic";

const VALID_VIEWS = new Set(["list", "kanban"]);

/** Narrow, uncapped aggregate source for the Open / Done subtitle (audit
 *  A-05) — `listOrgScoped` caps at 100 rows, which silently truncated the
 *  counts once an org passed the cap. */
async function taskStates(orgId: string): Promise<Array<{ task_state: TaskStatus }>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("tasks").select("task_state").eq("org_id", orgId);
  if (error) throw error;
  return (data ?? []) as Array<{ task_state: TaskStatus }>;
}

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={t("console.tasks.title", undefined, "Tasks")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.tasks.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const sp = await searchParams;
  const view = VALID_VIEWS.has(sp.view ?? "") ? (sp.view as "list" | "kanban") : "list";
  // Newest-first: a just-created task (often with no due date) must surface at
  // the top, not be buried last by a due_at sort (NULLS LAST) past the row cap.
  const [rows, states] = await Promise.all([
    listOrgScoped("tasks", session.orgId, { orderBy: "created_at", ascending: false }),
    taskStates(session.orgId),
  ]);
  const totalCount = states.length;
  const open = states.filter((r) => r.task_state !== "done").length;
  return (
    <>
      {/* Live nudge — tasks are a collaborative list; re-render when any
          org task changes instead of relying on manual Refresh (A-32). */}
      <RealtimeRefresh table="tasks" filter={`org_id=eq.${session.orgId}`} channelName="studio-tasks-list" />
      <ModuleHeader
        eyebrow={t("console.tasks.eyebrow", undefined, "Work")}
        title={t("console.tasks.title", undefined, "Tasks")}
        subtitle={t(
          "console.tasks.subtitle",
          { open, done: totalCount - open },
          `${open} Open  · ${totalCount - open} Done`,
        )}
        action={<Button href="/studio/tasks/new">{t("console.tasks.newTask", undefined, "+ New Task")}</Button>}
      />
      <div className="page-content">
        <div className="mb-3 flex items-center justify-end gap-1 text-xs">
          <Link
            href="?view=list"
            replace
            scroll={false}
            className={`rounded border border-[var(--p-border)] px-2 py-1 ${view === "list" ? "bg-[var(--p-surface)] text-[var(--p-text-1)]" : "text-[var(--p-text-2)]"}`}
            aria-current={view === "list" ? "true" : undefined}
          >
            {t("console.tasks.view.list", undefined, "List")}
          </Link>
          <Link
            href="?view=kanban"
            replace
            scroll={false}
            className={`rounded border border-[var(--p-border)] px-2 py-1 ${view === "kanban" ? "bg-[var(--p-surface)] text-[var(--p-text-1)]" : "text-[var(--p-text-2)]"}`}
            aria-current={view === "kanban" ? "true" : undefined}
          >
            {t("console.tasks.view.kanban", undefined, "Kanban")}
          </Link>
        </div>
        {view === "kanban" ? (
          <TasksKanban rows={rows as Array<Task & { task_state: TaskStatus }>} />
        ) : (
          <DataTable<Task>
            rows={rows}
            totalCount={totalCount}
            rowHref={(r) => `/studio/tasks/${r.id}`}
            emptyLabel={t("console.tasks.emptyLabel", undefined, "No tasks yet")}
            emptyDescription={t(
              "console.tasks.emptyDescription",
              undefined,
              "Capture the next piece of work; assign it, date it, and track it to done.",
            )}
            emptyAction={
              <Button href="/studio/tasks/new" size="sm">
                {t("console.tasks.newTask", undefined, "+ New Task")}
              </Button>
            }
            bulkActions={[
              {
                id: "complete",
                label: t("console.tasks.bulk.markDone", undefined, "Mark Done"),
                perform: bulkCompleteTasks,
              },
            ]}
            onCellEdit={editTaskCell}
            columns={[
              {
                key: "title",
                header: t("console.tasks.columns.title", undefined, "Title"),
                render: (r) => r.title,
                accessor: (r) => r.title,
                editable: true,
              },
              {
                key: "status",
                header: t("console.tasks.columns.status", undefined, "Status"),
                render: (r) => <StatusBadge status={r.task_state} />,
                accessor: (r) => r.task_state,
                filterable: true,
                groupable: true,
                editable: true,
              },
              {
                key: "priority",
                header: t("console.tasks.columns.priority", undefined, "P"),
                render: (r) => <span className="font-mono text-xs">P{r.priority}</span>,
                filterable: true,
                groupable: true,
                accessor: (r) => r.priority ?? null,
              },
              {
                key: "due",
                header: t("console.tasks.columns.due", undefined, "Due"),
                render: (r) => (
                  <span className="inline-flex items-center gap-2">
                    {formatDate(r.due_at, "medium")}
                    <DueDateBadge dueAt={r.due_at} status={r.task_state} iconOnly size="sm" />
                  </span>
                ),
                className: "font-mono text-xs",
                accessor: (r) => r.due_at,
              },
              {
                key: "created",
                header: t("console.tasks.columns.created", undefined, "Created"),
                render: (r) => timeAgo(r.created_at),
                className: "font-mono text-xs",
                accessor: (r) => r.created_at,
              },
            ]}
          />
        )}
      </div>
    </>
  );
}
