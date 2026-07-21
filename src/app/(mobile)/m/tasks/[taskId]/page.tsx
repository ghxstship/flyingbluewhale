import { notFound } from "next/navigation";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import type { Task } from "@/lib/supabase/types";
import { isTaskState, priorityLabel } from "../_shared";
import { TaskDetail, type CommentItem, type AttachmentItem, type EventItem } from "./TaskDetail";

export const dynamic = "force-dynamic";

/**
 * COMPVSS `/m/tasks/[taskId]` — task detail. Server component: loads the
 * org-scoped task, resolves the assignee name + canTransition band (manager+
 * or the assignee themselves), and the real `task_comments` / `task_events` /
 * `task_attachments` rows, hydrating author names from `users`. Hands the
 * plain records + labels to the `<TaskDetail>` kit client, which owns the
 * lifecycle-chip transitions and the comment composer.
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

  // Real collaboration rows — comments (newest list, oldest-first for thread),
  // append-only events, photo/file attachments.
  const [{ data: commentRows }, { data: eventRows }, { data: attachmentRows }, ccRes, vendorRes, { data: timerRows }] =
    await Promise.all([
    supabase
      .from("task_comments")
      .select("id, body, mentions, author_id, created_at")
      .eq("org_id", session.orgId)
      .eq("task_id", taskId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(200),
    supabase
      .from("task_events")
      .select("id, event_kind, from_state, to_state, actor_id, body, created_at")
      .eq("org_id", session.orgId)
      .eq("task_id", taskId)
      .order("created_at", { ascending: true })
      .limit(200),
    supabase
      .from("task_attachments")
      .select("id, storage_path, file_name, mime_type, attachment_kind, created_at")
      .eq("org_id", session.orgId)
      .eq("task_id", taskId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50),
    // Kit 31 #14 — the construction facet display strings (cost center code ·
    // name, vendor name) depend only on the task row, not on the collaboration
    // rows, so they resolve in the same round trip.
    row.cost_center_id
      ? supabase
          .from("cost_centers")
          .select("code, name")
          .eq("id", row.cost_center_id)
          .eq("org_id", session.orgId)
          .maybeSingle()
      : null,
    row.vendor_id
      // soft-delete-exempt: resolving the display name of a historical FK —
      // the task still references the vendor even after it's archived.
      ? supabase
          .from("vendors")
          .select("name")
          .eq("id", row.vendor_id)
          .eq("org_id", session.orgId)
          .maybeSingle()
      : null,
    // Per-task timer: this user's own task-timer entries (activity_category
    // 'task') for the logged-total and running-since counter.
    supabase
      .from("time_entries")
      .select("started_at, ended_at, duration_minutes")
      .eq("org_id", session.orgId)
      .eq("user_id", session.userId)
      .eq("task_id", taskId)
      .eq("activity_category", "task")
      .order("started_at", { ascending: false }),
  ]);

  const comments = (commentRows ?? []) as Array<{
    id: string;
    body: string;
    mentions: string[] | null;
    author_id: string | null;
    created_at: string;
  }>;
  const events = (eventRows ?? []) as Array<{
    id: string;
    event_kind: string;
    from_state: string | null;
    to_state: string | null;
    actor_id: string | null;
    body: string | null;
    created_at: string;
  }>;
  const attachments = (attachmentRows ?? []) as Array<{
    id: string;
    storage_path: string;
    file_name: string | null;
    mime_type: string | null;
    attachment_kind: string;
    created_at: string;
  }>;

  // Resolve every actor / author / assignee name in one round-trip.
  const userIds = Array.from(
    new Set(
      [
        row.assigned_to,
        ...comments.map((c) => c.author_id),
        ...events.map((e) => e.actor_id),
      ].filter(Boolean) as string[],
    ),
  );
  const nameMap = new Map<string, string>();
  if (userIds.length) {
    const { data: users } = await supabase
      .from("users")
      .select("id, name, email")
      .in("id", userIds);
    for (const u of (users ?? []) as Array<{ id: string; name: string | null; email: string | null }>) {
      nameMap.set(u.id, u.name ?? u.email ?? unassigned);
    }
  }
  const nameFor = (id: string | null) => (id ? (nameMap.get(id) ?? unassigned) : unassigned);

  const assignee = row.assigned_to ? nameFor(row.assigned_to) : unassigned;
  const canTransition = isManagerPlus(session) || row.assigned_to === session.userId;

  // Per-task timer state: minutes logged (closed entries) + the running entry.
  const timerEntries = (timerRows ?? []) as Array<{
    started_at: string;
    ended_at: string | null;
    duration_minutes: number | null;
  }>;
  const timerLoggedMinutes = timerEntries.reduce((sum, e) => sum + (e.ended_at ? (e.duration_minutes ?? 0) : 0), 0);
  const timerOpenSince = timerEntries.find((e) => e.ended_at == null)?.started_at ?? null;

  // Kit 31 #14 — the construction facets' display strings, resolved in the
  // batched round trip above.
  let costCode: string | null = null;
  const cc = ccRes?.data;
  if (cc) costCode = `${cc.code} · ${cc.name}`;
  let company: string | null = null;
  const vendor = vendorRes?.data;
  if (vendor) company = vendor.name;
  const checklist = (Array.isArray(row.checklist) ? row.checklist : [])
    .map((item) => {
      const it = item as { label?: unknown; done?: unknown };
      return { label: String(it.label ?? ""), done: !!it.done };
    })
    .filter((item) => item.label);

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
    trade: row.trade ?? null,
    costCode,
    company,
    location: row.location ?? null,
    ppe: (row.ppe ?? []) as string[],
    permitRequired: !!row.permit_required,
    percentComplete: row.percent_complete ?? null,
    checklist,
  };

  const commentItems: CommentItem[] = comments.map((c) => ({
    who: nameFor(c.author_id),
    time: `${fmt.date(c.created_at)} · ${fmt.time(c.created_at)}`,
    text: c.body,
    mentions: (c.mentions ?? []).map((id) => nameFor(id)),
  }));

  const attachmentItems: AttachmentItem[] = attachments.map((a) => ({
    id: a.id,
    name: a.file_name ?? a.storage_path.split("/").pop() ?? "Attachment",
    kind: a.attachment_kind === "file" ? "file" : "photo",
  }));

  const stateLabelDb: Record<string, string> = {
    todo: t("m.tasks.state.open", undefined, "Open"),
    in_progress: t("m.tasks.state.progress", undefined, "In Progress"),
    blocked: t("m.tasks.state.blocked", undefined, "Blocked"),
    review: t("m.tasks.state.review", undefined, "In Review"),
    done: t("m.tasks.state.done", undefined, "Done"),
  };
  const stateName = (s: string | null) => (s ? (stateLabelDb[s] ?? s) : "—");

  const eventItems: EventItem[] = events.map((e) => {
    const time = `${fmt.date(e.created_at)} · ${fmt.time(e.created_at)}`;
    const actor = nameFor(e.actor_id);
    if (e.event_kind === "state_change") {
      return {
        id: e.id,
        icon: "ArrowRightLeft",
        txt: `${actor} · ${stateName(e.from_state)} → ${stateName(e.to_state)}`,
        time,
      };
    }
    if (e.event_kind === "comment") {
      return { id: e.id, icon: "MessageSquare", txt: `${actor} ${t("m.tasks.detail.actCommented", undefined, "commented")}`, time };
    }
    if (e.event_kind === "attachment") {
      return { id: e.id, icon: "Paperclip", txt: `${actor} ${t("m.tasks.detail.actAttached", undefined, "added an attachment")}`, time };
    }
    if (e.event_kind === "assigned") {
      return { id: e.id, icon: "UserPlus", txt: `${actor} ${t("m.tasks.detail.actAssigned", undefined, "reassigned the task")}`, time };
    }
    if (e.event_kind === "due_change") {
      return { id: e.id, icon: "CalendarClock", txt: `${actor} ${t("m.tasks.detail.actDue", undefined, "changed the due date")}`, time };
    }
    return { id: e.id, icon: "Plus", txt: `${actor} · ${t("m.tasks.detail.actCreated", undefined, "Task Created")}`, time };
  });

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
    photos: t("m.tasks.detail.photos", undefined, "Photos"),
    photosEmpty: t("m.tasks.detail.photosEmpty", undefined, "No photos yet."),
    description: t("m.tasks.detail.description", undefined, "Description"),
    descriptionEmpty: t("m.tasks.detail.descriptionEmpty", undefined, "No description."),
    activity: t("m.tasks.detail.activity", undefined, "Activity"),
    activityEmpty: t("m.tasks.detail.activityEmpty", undefined, "No activity yet."),
    actCreated: t("m.tasks.detail.actCreated", undefined, "Task Created"),
    actUpdated: t("m.tasks.detail.actUpdated", undefined, "Last Updated"),
    permWarn: t("m.tasks.detail.permWarn", undefined, "You don't have permission to change this task."),
    updated_toast: t("m.tasks.detail.updatedToast", undefined, "Task Updated"),
    trade: t("m.tasks.detail.trade", undefined, "Trade"),
    costCode: t("m.tasks.detail.costCode", undefined, "Cost Code"),
    company: t("m.tasks.detail.company", undefined, "Company / Sub"),
    location: t("m.tasks.detail.location", undefined, "Location / Zone"),
    ppe: t("m.tasks.detail.ppe", undefined, "PPE Requirements"),
    permit: t("m.tasks.detail.permit", undefined, "Permit / Hot Work"),
    permitYes: t("m.tasks.detail.permitYes", undefined, "Required"),
    progress: t("m.tasks.detail.progress", undefined, "Progress"),
    checklist: t("m.tasks.detail.checklist", undefined, "Checklist"),
    checklistEmpty: t("m.tasks.detail.checklistEmpty", undefined, "No checklist items."),
    timeTracked: t("m.tasks.detail.timeTracked", undefined, "Time Tracked"),
  };

  return (
    <TaskDetail
      task={task}
      canTransition={canTransition}
      labels={labels}
      comments={commentItems}
      events={eventItems}
      attachments={attachmentItems}
      timerLoggedMinutes={timerLoggedMinutes}
      timerOpenSince={timerOpenSince}
    />
  );
}
