import { notFound } from "next/navigation";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import type { Task } from "@/lib/supabase/types";
import { isTaskState, priorityLabel } from "../_shared";
import { TaskDetail } from "./TaskDetail";

export const dynamic = "force-dynamic";

/**
 * COMPVSS `/m/tasks/[taskId]` — task detail. Server component: loads the
 * org-scoped task, resolves the assignee name + canTransition band (manager+
 * or the assignee themselves), and hands the plain record + labels to the
 * `<TaskDetail>` kit client, which owns the lifecycle-chip transitions.
 */
export default async function Page({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const { t } = await getRequestT();

  if (!hasSupabase) notFound();

  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const row = (await getOrgScoped("tasks", session.orgId, taskId)) as Task | null;
  if (!row) notFound();

  const unassigned = t("m.tasks.unassigned", undefined, "Unassigned");
  let assignee = unassigned;
  if (row.assigned_to) {
    const { data: u } = await supabase
      .from("users")
      .select("name, email")
      .eq("id", row.assigned_to)
      .maybeSingle();
    assignee = u?.name ?? u?.email ?? unassigned;
  }

  const canTransition = isManagerPlus(session) || row.assigned_to === session.userId;

  const task = {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    state: isTaskState(row.task_state) ? row.task_state : ("todo" as const),
    priority: priorityLabel(row.priority),
    due: row.due_at ? fmt.date(row.due_at) : t("m.tasks.noDue", undefined, "No Due Date"),
    assignee,
    created: fmt.date(row.created_at),
    updated: fmt.date(row.updated_at),
  };

  const labels = {
    eyebrow: t("m.tasks.detail.eyebrow", undefined, "Task"),
    status: t("m.tasks.detail.status", undefined, "Status"),
    priority: t("m.tasks.detail.priority", undefined, "Priority"),
    due: t("m.tasks.detail.due", undefined, "Due"),
    assignee: t("m.tasks.detail.assignee", undefined, "Assignee"),
    created: t("m.tasks.detail.created", undefined, "Created"),
    updated: t("m.tasks.detail.updated", undefined, "Updated"),
    stateOpen: t("m.tasks.state.open", undefined, "Open"),
    stateProgress: t("m.tasks.state.progress", undefined, "In Progress"),
    stateBlocked: t("m.tasks.state.blocked", undefined, "Blocked"),
    stateReview: t("m.tasks.state.review", undefined, "In Review"),
    stateDone: t("m.tasks.state.done", undefined, "Done"),
    checklist: t("m.tasks.detail.checklist", undefined, "Checklist"),
    checklistEmpty: t("m.tasks.detail.checklistEmpty", undefined, "No checklist items."),
    description: t("m.tasks.detail.description", undefined, "Description"),
    descriptionEmpty: t("m.tasks.detail.descriptionEmpty", undefined, "No description."),
    activity: t("m.tasks.detail.activity", undefined, "Activity"),
    actCreated: t("m.tasks.detail.actCreated", undefined, "Task Created"),
    actUpdated: t("m.tasks.detail.actUpdated", undefined, "Last Updated"),
    permWarn: t("m.tasks.detail.permWarn", undefined, "You don't have permission to change this task."),
    updated_toast: t("m.tasks.detail.updatedToast", undefined, "Task Updated"),
  };

  return <TaskDetail task={task} canTransition={canTransition} labels={labels} />;
}
