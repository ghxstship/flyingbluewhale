"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  name: z.string().min(1).max(200),
  width_ft: z.string().optional(),
  depth_ft: z.string().optional(),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export type State = { error?: string } | null;

export async function updateStagePlot(projectId: string, id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("stage_plots")
    .update({
      name: parsed.data.name,
      width_ft: parsed.data.width_ft ? Number(parsed.data.width_ft) : null,
      depth_ft: parsed.data.depth_ft ? Number(parsed.data.depth_ft) : null,
      notes: parsed.data.notes || null,
    })
    .eq("id", id)
    .eq("project_id", projectId)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/projects/${projectId}/stage-plots/${id}`);
  revalidatePath(`/console/projects/${projectId}/stage-plots`);
  redirect(`/console/projects/${projectId}/stage-plots/${id}`);
}

export async function deleteStagePlot(projectId: string, id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  // Soft delete.
  await supabase
    .from("stage_plots")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("project_id", projectId)
    .eq("org_id", session.orgId);
  revalidatePath(`/console/projects/${projectId}/stage-plots`);
  redirect(`/console/projects/${projectId}/stage-plots`);
}
