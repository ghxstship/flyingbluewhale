"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type InspectionStatus = "scheduled" | "in_progress" | "passed" | "failed" | "cancelled";

// Inspection FSM: scheduled → in_progress → passed | failed. Cancel is
// allowed from scheduled or in_progress. passed/failed/cancelled are
// terminal — re-stamping completed_at would lose the original outcome
// timestamp.
const INSPECTION_TRANSITIONS: Record<InspectionStatus, readonly InspectionStatus[]> = {
  scheduled: ["in_progress", "cancelled"],
  in_progress: ["passed", "failed", "cancelled"],
  passed: [],
  failed: [],
  cancelled: [],
};

export async function transitionInspection(
  id: string,
  to: "in_progress" | "passed" | "failed" | "cancelled",
): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("inspections")
    .select("inspection_state")
    .eq("org_id", session.orgId)
    .eq("id", id)
    .maybeSingle();
  if (!row) throw new Error("Inspection not found");
  const current = (row as { inspection_state: InspectionStatus }).inspection_state;
  const allowed = INSPECTION_TRANSITIONS[current] ?? [];
  if (!allowed.includes(to)) {
    throw new Error(`Cannot move ${current} → ${to}. Allowed: ${allowed.join(", ") || "(terminal)"}`);
  }

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { inspection_state: to };
  if (to === "in_progress") patch.started_at = now;
  if (to === "passed" || to === "failed") patch.completed_at = now;
  const { data: updated, error } = await supabase
    .from("inspections")
    .update(patch as never)
    .eq("org_id", session.orgId)
    .eq("id", id)
    .eq("inspection_state", current as "scheduled")
    .select("id");
  if (error) throw new Error(error.message);
  if (!updated || updated.length === 0) {
    throw new Error("Inspection status changed concurrently. Refresh and retry");
  }
  revalidatePath(`/studio/inspections/${id}`);
  revalidatePath("/studio/inspections");
}

export async function setInspectionItemResult(
  inspectionId: string,
  itemId: string,
  result: "pass" | "fail" | "na",
): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("inspection_items")
    .update({ result } as never)
    .eq("org_id", session.orgId)
    .eq("inspection_id", inspectionId)
    .eq("id", itemId);
  if (error) throw new Error(`Could not update inspection item: ${error.message}`);
  revalidatePath(`/studio/inspections/${inspectionId}`);
}
