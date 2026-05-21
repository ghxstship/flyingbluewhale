"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  due_at: z.string().date().optional().or(z.literal("")),
  project_id: z.string().uuid().optional().or(z.literal("")),
  priority: z.string().optional(),
  xpms_atom_id: z.string().uuid().optional().or(z.literal("")),
});

export type State = { error?: string } | null;

export async function createTaskAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid" };
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
  if (error) return { error: error.message };
  revalidatePath("/console/tasks");
  redirect("/console/tasks");
}

export async function setTaskStatusAction(id: string, status: "todo" | "in_progress" | "blocked" | "review" | "done") {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").update({ status }).eq("org_id", session.orgId).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/console/tasks");
  return { ok: true as const };
}
