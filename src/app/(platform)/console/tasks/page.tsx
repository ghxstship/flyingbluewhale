import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DueDateBadge } from "@/components/ui/DueDateBadge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";
import { timeAgo } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import type { Task, TaskStatus } from "@/lib/supabase/types";
import { TasksKanban } from "./TasksKanban";

export const dynamic = "force-dynamic";

const VALID_VIEWS = new Set(["list", "kanban"]);

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
  const rows = await listOrgScoped("tasks", session.orgId, { orderBy: "due_at", ascending: true });
  const open = rows.filter((r) => r.status !== "done").length;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.tasks.eyebrow", undefined, "Work")}
        title={t("console.tasks.title", undefined, "Tasks")}
        subtitle={t(
          "console.tasks.subtitle",
          { open, done: rows.length - open },
          `${open} Open  · ${rows.length - open} Done`,
        )}
        action={<Button href="/console/tasks/new">{t("console.tasks.newTask", undefined, "+ New Task")}</Button>}
      />
      <div className="page-content">
        <div className="mb-3 flex items-center justify-end gap-1 text-xs">
          <a
            href="?view=list"
            className={`rounded border border-[var(--border-color)] px-2 py-1 ${view === "list" ? "bg-[var(--surface-raised)] text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}
            aria-current={view === "list" ? "true" : undefined}
          >
            {t("console.tasks.view.list", undefined, "List")}
          </a>
          <a
            href="?view=kanban"
            className={`rounded border border-[var(--border-color)] px-2 py-1 ${view === "kanban" ? "bg-[var(--surface-raised)] text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}
            aria-current={view === "kanban" ? "true" : undefined}
          >
            {t("console.tasks.view.kanban", undefined, "Kanban")}
          </a>
        </div>
        {view === "kanban" ? (
          <TasksKanban rows={rows as Array<Task & { status: TaskStatus }>} />
        ) : (
          <DataTable<Task>
            rows={rows}
            rowHref={(r) => `/console/tasks/${r.id}`}
            columns={[
              {
                key: "title",
                header: t("console.tasks.columns.title", undefined, "Title"),
                render: (r) => r.title,
                accessor: (r) => r.title,
              },
              {
                key: "status",
                header: t("console.tasks.columns.status", undefined, "Status"),
                render: (r) => <StatusBadge status={r.status} />,
                accessor: (r) => r.status,
                filterable: true,
                groupable: true,
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
                    <DueDateBadge dueAt={r.due_at} status={r.status} iconOnly size="sm" />
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
