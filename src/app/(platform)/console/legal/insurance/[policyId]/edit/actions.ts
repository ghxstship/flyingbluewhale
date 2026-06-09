"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";

const Schema = z.object({
  carrier: z.string().min(1).max(160),
  policy_no: z.string().min(1).max(120),
  kind: z.string().min(1).max(60),
  effective_on: z.string().optional(),
  expires_on: z.string().optional(),
});

export type State = { error?: string } | null;

export async function updatePolicy(policyId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("insurance_policies", session.orgId, policyId, expectedUpdatedAt, {
    carrier: parsed.data.carrier,
    policy_no: parsed.data.policy_no,
    kind: parsed.data.kind,
    effective_on: parsed.data.effective_on || null,
    expires_on: parsed.data.expires_on || null,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Insurance Policie not found." };
  }
  revalidatePath(`/console/legal/insurance/${policyId}`);
  revalidatePath("/console/legal/insurance");
  redirect(`/console/legal/insurance/${policyId}`);
}

export async function deletePolicy(policyId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.from("insurance_policies").delete().eq("id", policyId).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete insurance policy: ${error.message}`);
  revalidatePath("/console/legal/insurance");
  redirect("/console/legal/insurance");
}
