"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  functional_area: z.string().max(120).optional(),
  planned_fte: z.coerce.number().min(0).max(10000),
  actual_fte: z.coerce.number().min(0).max(10000),
});

export type State = { error?: string } | null;

export async function updateDeployment(deploymentId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("workforce_deployments")
    .update({
      functional_area: parsed.data.functional_area || null,
      planned_fte: parsed.data.planned_fte,
      actual_fte: parsed.data.actual_fte,
    })
    .eq("id", deploymentId)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/workforce/deployment/${deploymentId}`);
  revalidatePath("/console/workforce/deployment");
  redirect(`/console/workforce/deployment/${deploymentId}`);
}

export async function deleteDeployment(deploymentId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.from("workforce_deployments").delete().eq("id", deploymentId).eq("org_id", session.orgId);
  revalidatePath("/console/workforce/deployment");
  redirect("/console/workforce/deployment");
}
