"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type State = { error?: string; fieldErrors?: Record<string, string> } | null;

const Input = z.object({
  // kit `task` form field ids
  title: z.string().min(1, "Give the task a name."),
  notes: z.string().optional(),
  due: z.string().optional(),
  priority: z.string().optional(),
  projectId: z.string().uuid().optional().or(z.literal("")),
});

/** Kit priority seg → tasks.priority int (1 = highest). */
const PRIORITY_MAP: Record<string, number> = { High: 1, Medium: 2, Low: 3 };

/**
 * Create a task from the field.
 *
 * COMPVSS could complete tasks but not make one — so anything a crew
 * member noticed on site had to wait for someone at a desk to write it
 * down, which is how it stops being written down at all.
 *
 * Deliberately narrower than the console form: title, note, due, priority.
 * No atom pin, no cross-project picker — those are planning concerns and
 * the console owns them. `assigned_to` defaults to the caller: someone
 * raising a task on site is nearly always the person who will do it, and
 * an unassigned task is one nobody owns.
 */
export async function createFieldTask(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Input.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) if (i.path[0]) fieldErrors[String(i.path[0])] = i.message;
    return { error: "Please fix the errors below.", fieldErrors };
  }
  const v = parsed.data;
  const supabase = await createClient();

  // Cross-tenant FK guard, mirroring the console action: a supplied
  // project must belong to the caller's org, or the row would carry a
  // dangling cross-org reference under an honest-looking org_id.
  const projectId = v.projectId || null;
  if (projectId) {
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!project) return { error: "Project not found in your organization." };
  }

  const { error } = await supabase.from("tasks").insert({
    org_id: session.orgId,
    title: v.title.slice(0, 200),
    description: v.notes || null,
    due_at: v.due || null,
    project_id: projectId,
    priority: PRIORITY_MAP[v.priority ?? "Medium"] ?? 2,
    created_by: session.userId,
    assigned_to: session.userId,
    task_state: "todo",
  });
  if (error) return { error: error.message };

  revalidatePath("/m/tasks");
  redirect("/m/tasks");
}
