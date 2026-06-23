"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type PunchStatus = "open" | "in_progress" | "ready_for_review" | "complete" | "void";

// Punch-list FSM: open → in_progress → ready_for_review → complete.
// Reviewer can kick back from ready_for_review to in_progress. Void is
// allowed from any non-complete state. complete + void are terminal.
const PUNCH_TRANSITIONS: Record<PunchStatus, readonly PunchStatus[]> = {
  open: ["in_progress", "ready_for_review", "void"],
  in_progress: ["ready_for_review", "open", "void"],
  ready_for_review: ["complete", "in_progress", "void"],
  complete: [],
  void: [],
};

export async function transitionPunchItem(
  id: string,
  to: "open" | "in_progress" | "ready_for_review" | "complete" | "void",
): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("punch_items")
    .select("item_state")
    .eq("org_id", session.orgId)
    .eq("id", id)
    .maybeSingle();
  if (!row) throw new Error("Punch item not found");
  const current = (row as { item_state: PunchStatus }).item_state;
  const allowed = PUNCH_TRANSITIONS[current] ?? [];
  if (!allowed.includes(to)) {
    throw new Error(`Cannot move ${current} → ${to}. Allowed: ${allowed.join(", ") || "(terminal)"}`);
  }

  const patch: Record<string, unknown> = { item_state: to };
  if (to === "complete") {
    patch.closed_at = new Date().toISOString();
    patch.closed_by = session.userId;
  }
  const { data: updated, error } = await supabase
    .from("punch_items")
    .update(patch as never)
    .eq("org_id", session.orgId)
    .eq("id", id)
    .eq("item_state", current as "open")
    .select("id");
  if (error) throw new Error(error.message);
  if (!updated || updated.length === 0) {
    throw new Error("Punch item status changed concurrently — refresh and retry");
  }
  revalidatePath(`/studio/punch/${id}`);
  revalidatePath("/studio/punch");
}
