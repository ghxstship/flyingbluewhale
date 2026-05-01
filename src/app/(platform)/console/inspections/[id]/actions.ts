"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function transitionInspection(
  id: string,
  to: "in_progress" | "passed" | "failed" | "cancelled",
): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { status: to };
  if (to === "in_progress") patch.started_at = now;
  if (to === "passed" || to === "failed") patch.completed_at = now;
  await supabase
    .from("inspections")
    .update(patch as never)
    .eq("org_id", session.orgId)
    .eq("id", id);
  revalidatePath(`/console/inspections/${id}`);
  revalidatePath("/console/inspections");
}

export async function setInspectionItemResult(
  inspectionId: string,
  itemId: string,
  result: "pass" | "fail" | "na",
): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase
    .from("inspection_items")
    .update({ result } as never)
    .eq("org_id", session.orgId)
    .eq("inspection_id", inspectionId)
    .eq("id", itemId);
  revalidatePath(`/console/inspections/${inspectionId}`);
}
