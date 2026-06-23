"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function awardResponse(reqId: string, responseId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();

  // Award the winner. The .eq("response_state", "responded") guard prevents
  // double-awarding (calling award twice for the same bid would otherwise
  // re-stamp awarded_at + awarded_by) and prevents awarding a bid that
  // wasn't actually submitted yet (invited/viewed states). Errors throw
  // so the caller sees the conflict rather than the request silently
  // succeeding with no data change.
  const { data: awarded, error: awardErr } = await supabase
    .from("rfq_responses")
    .update({
      response_state: "awarded",
      awarded_at: new Date().toISOString(),
      awarded_by: session.userId,
    } as never)
    .eq("org_id", session.orgId)
    .eq("id", responseId)
    .eq("response_state", "responded")
    .select("id");
  if (awardErr) throw new Error(awardErr.message);
  if (!awarded || awarded.length === 0) {
    throw new Error("Only a responded bid can be awarded (already awarded or not yet submitted)");
  }

  // Decline siblings only after we've confirmed the award landed.
  // Otherwise a failed award + successful sibling-decline leaves the
  // requisition in a state with no winner + no live bids.
  const { error: declineErr } = await supabase
    .from("rfq_responses")
    .update({ response_state: "declined" } as never)
    .eq("org_id", session.orgId)
    .eq("requisition_id", reqId)
    .neq("id", responseId)
    .in("response_state", ["responded", "invited", "viewed"]);
  if (declineErr) throw new Error(declineErr.message);

  revalidatePath(`/studio/procurement/requisitions/${reqId}/leveling`);
}
