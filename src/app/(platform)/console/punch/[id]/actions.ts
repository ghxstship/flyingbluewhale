"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function transitionPunchItem(
  id: string,
  to: "open" | "in_progress" | "ready_for_review" | "complete" | "void",
): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const patch: Record<string, unknown> = { status: to };
  if (to === "complete") {
    patch.closed_at = new Date().toISOString();
    patch.closed_by = session.userId;
  }
  await supabase
    .from("punch_items")
    .update(patch as never)
    .eq("org_id", session.orgId)
    .eq("id", id);
  revalidatePath(`/console/punch/${id}`);
  revalidatePath("/console/punch");
}
