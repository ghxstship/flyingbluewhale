"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  name: z.string().min(1).max(200),
  width_ft: z.string().optional(),
  depth_ft: z.string().optional(),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateStagePlot(projectId: string, id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  // Sea Trial FINDING-022: optimistic concurrency. Inlined here because the
  // stage_plots row also requires the project_id scope, which the generic
  // helper doesn't carry. Same pattern as updateOrgScopedWithCheck.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  if (!expectedUpdatedAt) return { error: STALE_ROW_MESSAGE };
  const { data, error } = await supabase
    .from("stage_plots")
    .update({
      name: parsed.data.name,
      width_ft: parsed.data.width_ft ? Number(parsed.data.width_ft) : null,
      depth_ft: parsed.data.depth_ft ? Number(parsed.data.depth_ft) : null,
      notes: parsed.data.notes || null,
    })
    .eq("id", id)
    .eq("project_id", projectId)
    .eq("org_id", session.orgId)
    .eq("updated_at", expectedUpdatedAt)
    .select("id")
    .maybeSingle();
  if (error) return actionFail(error.message, fd);
  if (!data) return { error: STALE_ROW_MESSAGE };
  revalidatePath(`/console/projects/${projectId}/stage-plots/${id}`);
  revalidatePath(`/console/projects/${projectId}/stage-plots`);
  redirect(`/console/projects/${projectId}/stage-plots/${id}`);
}

export async function deleteStagePlot(projectId: string, id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  // Soft delete.
  const { error } = await supabase
    .from("stage_plots")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("project_id", projectId)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete stage plot: ${error.message}`);
  revalidatePath(`/console/projects/${projectId}/stage-plots`);
  redirect(`/console/projects/${projectId}/stage-plots`);
}
