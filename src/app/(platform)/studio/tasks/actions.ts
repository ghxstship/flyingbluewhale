"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  due_at: z.string().date().optional().or(z.literal("")),
  project_id: z.string().uuid().optional().or(z.literal("")),
  priority: z.string().optional(),
  xpms_atom_id: z.string().uuid().optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createTaskAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  // Cross-tenant FK guard: when project_id is supplied, confirm it
  // belongs to the caller's org. Without it a user could attach a
  // task to another org's project_id while still claiming their
  // own org_id, leaving a dangling cross-org reference.
  const projectId = parsed.data.project_id || null;
  if (projectId) {
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!project) return { error: "Project not found in your organization" };
  }

  // Cross-tenant guard on atom pin — must belong to same org, and to
  // the same project if both are set.
  const atomId = parsed.data.xpms_atom_id || null;
  if (atomId) {
    const { data: atom } = await supabase
      .from("xpms_atoms")
      .select("id, project_id")
      .eq("id", atomId)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (!atom) return { error: "Atom not found in your organization" };
    if (projectId && atom.project_id && atom.project_id !== projectId) {
      return { error: "Atom belongs to a different project" };
    }
  }

  const { error } = await supabase.from("tasks").insert({
    org_id: session.orgId,
    title: parsed.data.title,
    description: parsed.data.description || null,
    due_at: parsed.data.due_at || null,
    project_id: projectId,
    priority: parsed.data.priority ? parseInt(parsed.data.priority, 10) : 2,
    created_by: session.userId,
    xpms_atom_id: atomId,
  });
  if (error) return actionFail(error.message, fd);
  revalidatePath("/studio/tasks");
  redirect("/studio/tasks");
}

const TASK_STATES = ["todo", "in_progress", "blocked", "review", "done"] as const;

const BulkIds = z.array(z.string().uuid()).min(1).max(200);

export type BulkResult = { message?: string; error?: string };

/**
 * Bulk-complete tasks from the list table (audit A-22). Org-pinned update;
 * rows already done (or cross-org / missing) are skipped and reported so
 * the toast tells the operator exactly what landed.
 */
export async function bulkCompleteTasks(ids: string[]): Promise<BulkResult> {
  const session = await requireSession();
  const parsed = BulkIds.safeParse(ids);
  if (!parsed.success) return { error: "Invalid Selection" };
  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("tasks")
    .update({ task_state: "done" })
    .in("id", parsed.data)
    .eq("org_id", session.orgId)
    .neq("task_state", "done")
    .select("id");
  if (error) return { error: `Could Not Update · ${error.message}` };
  const done = updated?.length ?? 0;
  const skipped = parsed.data.length - done;
  revalidatePath("/studio/tasks");
  if (skipped > 0) return { error: `${done} Marked Done · ${skipped} Skipped (already done or not found)` };
  return { message: `${done} ${done === 1 ? "Task" : "Tasks"} Marked Done` };
}

/**
 * Inline cell edit for the tasks list (audit A-13). Whitelisted columns
 * only; enum values validated server-side. Throws on rejection so the
 * table's optimistic override rolls back.
 */
export async function editTaskCell(rowId: string, columnKey: string, value: string): Promise<void> {
  const session = await requireSession();
  const id = z.string().uuid().parse(rowId);
  let patch: { title: string } | { task_state: (typeof TASK_STATES)[number] };
  if (columnKey === "title") {
    const title = value.trim();
    if (!title || title.length > 200) throw new Error("Title must be 1 to 200 characters");
    patch = { title };
  } else if (columnKey === "status") {
    const next = value.trim().toLowerCase().replace(/\s+/g, "_");
    if (!(TASK_STATES as readonly string[]).includes(next)) {
      throw new Error(`Status must be one of: ${TASK_STATES.join(", ")}`);
    }
    patch = { task_state: next as (typeof TASK_STATES)[number] };
  } else {
    throw new Error("Column is not editable");
  }
  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("org_id", session.orgId)
    .eq("id", id)
    .select("id");
  if (error) throw new Error(error.message);
  if (!updated?.length) throw new Error("Task not found");
  revalidatePath("/studio/tasks");
}

export async function setTaskStatusAction(id: string, status: "todo" | "in_progress" | "blocked" | "review" | "done") {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ task_state: status })
    .eq("org_id", session.orgId)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/studio/tasks");
  return { ok: true as const };
}
