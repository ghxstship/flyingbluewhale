"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function awardResponse(reqId: string, responseId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase
    .from("rfq_responses")
    .update({
      status: "awarded",
      awarded_at: new Date().toISOString(),
      awarded_by: session.userId,
    } as never)
    .eq("org_id", session.orgId)
    .eq("id", responseId);
  // Mark losing bids as declined so the leveling view stays clean.
  await supabase
    .from("rfq_responses")
    .update({ status: "declined" } as never)
    .eq("org_id", session.orgId)
    .eq("requisition_id", reqId)
    .neq("id", responseId)
    .in("status", ["responded", "invited", "viewed"]);
  revalidatePath(`/console/procurement/requisitions/${reqId}/leveling`);
}
