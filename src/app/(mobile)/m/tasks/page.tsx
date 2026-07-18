import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { listOrgScoped } from "@/lib/db/resource";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import type { Task } from "@/lib/supabase/types";
import {
  isTaskState,
  priorityLabel,
  type KitTask,
} from "./_shared";
import { TasksList, type TasksLabels } from "./TasksList";

export const dynamic = "force-dynamic";

/**
 * COMPVSS `/m/tasks` — the field task list. Server component: fetches the
 * org-scoped `tasks`, hydrates assignee display names, maps to the plain
 * `KitTask` shape, and hands them — with translated labels — to the
 * `<TasksList>` kit client (list / board / table). Ref app.jsx 1824-1929.
 */
export default async function MobileTasks() {
  const { t } = await getRequestT();

  if (!hasSupabase) {
    return (
      <div className="px-4 pt-6 pb-24 text-sm text-[var(--p-text-2)]">
        {t("common.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  // "My Tasks" means MY tasks. This read was org-wide with no assignee
  // predicate: on the seeded Test Professional Org it returned 201 rows of
  // which 2 belonged to the viewer. Worse, tasks with no due date sort last
  // under `orderBy: due_at`, so a crew member's own work fell past the list
  // cap and off the screen entirely — the page named for them could not
  // show them. The home widget one tap earlier counts
  // `tasks assigned to me`, so the list contradicted its own entry point.
  const rows = (await listOrgScoped("tasks", session.orgId, {
    orderBy: "due_at",
    ascending: true,
    filters: [{ column: "assigned_to", op: "eq", value: session.userId }],
  })) as Task[];

  // Hydrate assignee display names in one round-trip.
  const userIds = Array.from(new Set(rows.map((r) => r.assigned_to).filter(Boolean))) as string[];
  const nameMap = new Map<string, string>();
  if (userIds.length) {
    const { data: users } = await supabase.from("users").select("id, name, email").in("id", userIds);
    for (const u of (users ?? []) as Array<{ id: string; name: string | null; email: string | null }>) {
      nameMap.set(u.id, u.name ?? u.email ?? "—");
    }
  }

  const unassigned = t("m.tasks.unassigned", undefined, "Unassigned");

  const tasks: KitTask[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    sub: r.description ?? "",
    state: isTaskState(r.task_state) ? r.task_state : "todo",
    priority: priorityLabel(r.priority),
    due: r.due_at ? fmt.date(r.due_at) : t("m.tasks.noDue", undefined, "No Due Date"),
    assignee: r.assigned_to ? (nameMap.get(r.assigned_to) ?? unassigned) : unassigned,
    flagged: r.flagged_at != null,
    archived: r.archived_at != null,
    percent: r.percent_complete != null ? Number(r.percent_complete) : null,
  }));

  const doneCount = tasks.filter((x) => x.state === "done").length;

  const labels: TasksLabels = {
    eyebrow: t("m.tasks.eyebrow", { done: doneCount, total: tasks.length }, `${doneCount} of ${tasks.length} Done`),
    title: t("m.tasks.title", undefined, "My Tasks"),
    newTask: t("m.tasks.new", undefined, "New Task"),
    search: t("m.tasks.search", undefined, "Search Tasks…"),
    empty: t("m.tasks.empty", undefined, "No Tasks"),
    emptyBody: t("m.tasks.emptyBody", undefined, "Nothing matches these filters."),
    groupNone: t("m.tasks.group.none", undefined, "None"),
    groupStatus: t("m.tasks.group.status", undefined, "Status"),
    groupPriority: t("m.tasks.group.priority", undefined, "Priority"),
    groupAssignee: t("m.tasks.group.assignee", undefined, "Assignee"),
    sortDue: t("m.tasks.sort.due", undefined, "Due Time"),
    sortPriority: t("m.tasks.sort.priority", undefined, "Priority"),
    sortName: t("m.tasks.sort.name", undefined, "Name"),
    sortStatus: t("m.tasks.sort.status", undefined, "Status"),
    sortAssignee: t("m.tasks.sort.assignee", undefined, "Assignee"),
    filterStatus: t("m.tasks.filter.status", undefined, "Status"),
    showCompleted: t("m.tasks.filter.showCompleted", undefined, "Show Completed"),
    showArchived: t("m.tasks.filter.showArchived", undefined, "Show Archived"),
    reset: t("m.tasks.reset", undefined, "Reset Filters"),
    done: t("m.tasks.swipe.done", undefined, "Done"),
    reopen: t("m.tasks.swipe.reopen", undefined, "Reopen"),
    flag: t("m.tasks.swipe.flag", undefined, "Flag"),
    unflag: t("m.tasks.swipe.unflag", undefined, "Unflag"),
    archive: t("m.tasks.swipe.archive", undefined, "Archive"),
    archivedTag: t("m.tasks.archivedTag", undefined, "Archived"),
    archivedUndo: t("m.tasks.archivedUndo", undefined, "Archived"),
    undo: t("m.undo", undefined, "Undo"),
    stateOpen: t("m.tasks.state.open", undefined, "Open"),
    stateProgress: t("m.tasks.state.progress", undefined, "In Progress"),
    stateBlocked: t("m.tasks.state.blocked", undefined, "Blocked"),
    stateReview: t("m.tasks.state.review", undefined, "In Review"),
    stateDone: t("m.tasks.state.done", undefined, "Done"),
    colTask: t("m.tasks.col.task", undefined, "Task"),
    colDue: t("m.tasks.col.due", undefined, "Due"),
    noTasksInLane: t("m.tasks.noTasksInLane", undefined, "No tasks"),
    swipeHint: t("m.tasks.swipeHint", undefined, "Swipe between lanes"),
  };

  return <TasksList tasks={tasks} labels={labels} />;
}
