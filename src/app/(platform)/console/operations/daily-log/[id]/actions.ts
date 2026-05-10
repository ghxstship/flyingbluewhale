"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type DailyLogStatus = "draft" | "submitted" | "approved";

// Daily-log FSM: draft → submitted → approved. Approved is terminal —
// double-approving would clobber the original approver attribution +
// timestamp.
const DAILY_LOG_TRANSITIONS: Record<DailyLogStatus, readonly DailyLogStatus[]> = {
  draft: ["submitted"],
  submitted: ["approved"],
  approved: [],
};

export async function transitionDailyLog(id: string, to: "submitted" | "approved"): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("daily_logs")
    .select("status")
    .eq("org_id", session.orgId)
    .eq("id", id)
    .maybeSingle();
  if (!row) throw new Error("Daily log not found");
  const current = (row as { status: DailyLogStatus }).status;
  const allowed = DAILY_LOG_TRANSITIONS[current] ?? [];
  if (!allowed.includes(to)) {
    throw new Error(`Cannot move ${current} → ${to}. Allowed: ${allowed.join(", ") || "(terminal)"}`);
  }

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
  const { data: updated, error } = await supabase
    .from("daily_logs")
    .update(patch as never)
    .eq("org_id", session.orgId)
    .eq("id", id)
    .eq("status", current as "draft")
    .select("id");
  if (error) throw new Error(error.message);
  if (!updated || updated.length === 0) {
    throw new Error("Daily log status changed concurrently — refresh and retry");
  }
  revalidatePath(`/console/operations/daily-log/${id}`);
  revalidatePath("/console/operations/daily-log");
}
