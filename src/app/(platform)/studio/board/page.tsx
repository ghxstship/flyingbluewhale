import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataView } from "@/components/views/DataViewServer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DueDateBadge } from "@/components/ui/DueDateBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import type { Task, TaskStatus } from "@/lib/supabase/types";
import { TasksKanban } from "../tasks/TasksKanban";

export const dynamic = "force-dynamic";

const VALID_VIEWS = new Set(["board", "list"]);

/**
 * /studio/board — the kit v7 <KanbanBoard> workspace. A drag-and-drop board
 * over the org's work items with a list ↔ board toggle (`?view=`). The board
 * lane is the task lifecycle state; drops persist via the shared task action.
 */
export default async function BoardPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Work" title={t("console.board.title", undefined, "Board")} />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const sp = await searchParams;
  const view = VALID_VIEWS.has(sp.view ?? "") ? (sp.view as "board" | "list") : "board";
  const supabase = await createClient();
  // Header metrics are exact server-side aggregates — the previous version
  // derived open/done from the capped row fetch, silently under-counting
  // any org past the cap.
  const [rows, { count: openCount }, { count: doneCount }] = await Promise.all([
    listOrgScoped("tasks", session.orgId, {
      orderBy: "created_at",
      ascending: false,
      limit: 500,
    }) as Promise<Array<Task & { task_state: TaskStatus }>>,
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .neq("task_state", "done"),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("task_state", "done"),
  ]);
  const open = openCount ?? 0;
  const done = doneCount ?? 0;
  const total = open + done;

  const tab = (key: "board" | "list", label: string) => (
    <a
      href={`?view=${key}`}
      aria-current={view === key ? "true" : undefined}
      className={`rounded border border-[var(--p-border)] px-2 py-1 ${
        view === key ? "bg-[var(--p-surface)] text-[var(--p-text-1)]" : "text-[var(--p-text-2)]"
      }`}
    >
      {label}
    </a>
  );

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.board.eyebrow", undefined, "Work")}
        title={t("console.board.title", undefined, "Board")}
        subtitle={t("console.board.subtitle", { open, done }, "{open} open · {done} done")}
        breadcrumbs={[{ label: "Work" }, { label: "Board" }]}
        action={<Button href="/studio/tasks/new">{t("console.board.newTask", undefined, "+ New Task")}</Button>}
      />
      <div className="page-content">
        <div className="mb-3 flex items-center justify-end gap-1 text-xs">
          {tab("board", t("console.board.view.board", undefined, "Board"))}
          {tab("list", t("console.board.view.list", undefined, "List"))}
        </div>
        {rows.length === 0 ? (
          <EmptyState
            title={t("console.board.emptyTitle", undefined, "No work items yet")}
            description={t("console.board.emptyDescription", undefined, "Add a task to start populating the board.")}
            action={<Button href="/studio/tasks/new">{t("console.board.newTask", undefined, "+ New Task")}</Button>}
          />
        ) : view === "board" ? (
          <>
            {total > rows.length && (
              <p className="mb-2 text-xs text-[var(--p-text-2)]">
                {t(
                  "console.board.truncated",
                  { shown: rows.length, total },
                  `Showing the ${rows.length} most recent of ${total} tasks.`,
                )}
              </p>
            )}
            <TasksKanban rows={rows} />
          </>
        ) : (
          <DataView<Task>
            rows={rows}
            totalCount={total}
            rowHref={(r) => `/studio/tasks/${r.id}`}
            columns={[
              {
                key: "title",
                header: t("console.board.col.title", undefined, "Task"),
                render: (r) => r.title,
                accessor: (r) => r.title,
              },
              {
                key: "due",
                header: t("console.board.col.due", undefined, "Due"),
                render: (r) => <DueDateBadge dueAt={r.due_at} status={r.task_state} size="sm" />,
                accessor: (r) => r.due_at ?? "",
              },
              {
                key: "state",
                header: t("console.board.col.state", undefined, "State"),
                render: (r) => <StatusBadge status={r.task_state} />,
                accessor: (r) => r.task_state,
                filterable: true,
                groupable: true,
              },
            ]}
          />
        )}
      </div>
    </>
  );
}
