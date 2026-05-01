"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function transitionDailyLog(id: string, to: "submitted" | "approved"): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { status: to };
  if (to === "submitted") {
    patch.submitted_by = session.userId;
    patch.submitted_at = now;
  }
  if (to === "approved") {
    patch.approved_by = session.userId;
    patch.approved_at = now;
  }
  await supabase
    .from("daily_logs")
    .update(patch as never)
    .eq("org_id", session.orgId)
    .eq("id", id);
  revalidatePath(`/console/operations/daily-log/${id}`);
  revalidatePath("/console/operations/daily-log");
}
