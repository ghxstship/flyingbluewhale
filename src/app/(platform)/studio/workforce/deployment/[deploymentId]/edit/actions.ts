"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z.object({
  functional_area: z.string().max(120).optional(),
  planned_fte: z.coerce.number().min(0).max(10000),
  actual_fte: z.coerce.number().min(0).max(10000),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateDeployment(deploymentId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck(
    "workforce_deployments",
    session.orgId,
    deploymentId,
    expectedUpdatedAt,
    {
      functional_area: parsed.data.functional_area || null,
      planned_fte: parsed.data.planned_fte,
      actual_fte: parsed.data.actual_fte,
    },
  );
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : actionErrorMessage("not-found.workforce-deployment", "Workforce Deployment not found.") };
  }
  revalidatePath(`/studio/workforce/deployment/${deploymentId}`);
  revalidatePath("/studio/workforce/deployment");
  redirect(`/studio/workforce/deployment/${deploymentId}`);
}

export async function deleteDeployment(deploymentId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("workforce_deployments")
    .delete()
    .eq("id", deploymentId)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete workforce deployment: ${error.message}`);
  revalidatePath("/studio/workforce/deployment");
  redirect("/studio/workforce/deployment");
}
