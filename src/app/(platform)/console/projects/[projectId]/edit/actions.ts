"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  name: z.string().min(1).max(200),
  status: z.string(),
  start_date: z.string().optional().or(z.literal("")),
  end_date: z.string().optional().or(z.literal("")),
  budget_cents: z.string().optional(),
  description: z.string().max(8000).optional().or(z.literal("")),
});

export type State = { error?: string } | null;

export async function updateProject(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({
      name: parsed.data.name,
      status: parsed.data.status as "draft" | "active" | "paused" | "archived" | "complete",
      start_date: parsed.data.start_date || null,
      end_date: parsed.data.end_date || null,
      budget_cents: parsed.data.budget_cents ? Number(parsed.data.budget_cents) : null,
      description: parsed.data.description || null,
    })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/projects/${id}`);
  revalidatePath("/console/projects");
  redirect(`/console/projects/${id}`);
}

export async function deleteProject(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  // Soft-delete projects.
  await supabase
    .from("projects")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", session.orgId);
  revalidatePath("/console/projects");
  redirect("/console/projects");
}
