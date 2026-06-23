"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendPushTo } from "@/lib/push/send";
import { log } from "@/lib/log";

const Schema = z.object({
  id: z.string().uuid(),
  decision: z.enum(["approved", "declined"]),
});

export async function decideSwap(fd: FormData): Promise<void> {
  const session = await requireSession();
  // Roster decisions are scheduler-level — manager+ only.
  if (!isManagerPlus(session)) return;
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  const supabase = await createClient();

  // Conditional update — without it, a concurrent approve+decline would
  // last-write-wins and lose the audit attribution. `.select` confirms a
  // row actually flipped so we only notify on a real transition.
  const { data: updated, error } = await supabase
    .from("shift_swaps")
    .update({
      swap_state: parsed.data.decision,
      decided_by: session.userId,
      decided_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId)
    .in("swap_state", ["requested", "accepted"])
    .select("id, requested_by");
  if (error) throw new Error(`Could not update shift swap: ${error.message}`);

  // Tell the requester — the decision used to land silently and crew
  // found out by re-checking /m/shift. Best-effort: a notify failure
  // never rolls back the decision.
  const requestedBy = (updated?.[0] as { requested_by?: string } | undefined)?.requested_by;
  if (requestedBy) {
    try {
      const verb = parsed.data.decision === "approved" ? "Approved" : "Declined";
      await sendPushTo(requestedBy, {
        title: `Shift Swap ${verb}`,
        body: `Your shift swap request was ${parsed.data.decision}.`,
        url: "/m/requests",
        kind: "shift_swap",
        scope: "mobile",
        orgId: session.orgId,
      });
    } catch (e) {
      log.warn("shift_swap.decision_notify_failed", { err: e instanceof Error ? e.message : String(e) });
    }
  }

  revalidatePath("/studio/workforce/shift-swaps");
}
