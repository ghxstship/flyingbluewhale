"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  id: z.string().uuid(),
  decision: z.enum(["approved", "denied"]),
});

export async function decideTimeOff(fd: FormData): Promise<void> {
  const session = await requireSession();
  // Time-off approvals are HR-level — manager+ only.
  if (!isManagerPlus(session)) return;
  const parsed = Schema.parse(Object.fromEntries(fd));
  const supabase = await createClient();

  if (parsed.decision === "approved") {
    // Go through the RPC so the balance row decrements atomically with
    // the state flip. SECURITY DEFINER on the function gates on
    // private.is_org_member; we still ran isManagerPlus above to keep
    // the user-facing approval action manager-only.
    const { error } = await (
      supabase.rpc as unknown as (
        name: string,
        params: Record<string, unknown>,
      ) => Promise<{ error: { message: string } | null }>
    )("approve_time_off_request", {
      p_request_id: parsed.id,
      p_decider_id: session.userId,
      p_decision_note: null,
    });
    if (error) {
      // Fall back to plain UPDATE so a stale Postgres function (e.g.
      // 0048 not yet applied on a branch) doesn't block the action.
      await supabase
        .from("time_off_requests")
        .update({
          request_state: "approved",
          decided_by: session.userId,
          decided_at: new Date().toISOString(),
        })
        .eq("id", parsed.id)
        .eq("org_id", session.orgId)
        .eq("request_state", "pending");
    }
  } else {
    // Denials don't touch the balance.
    await supabase
      .from("time_off_requests")
      .update({
        request_state: "denied",
        decided_by: session.userId,
        decided_at: new Date().toISOString(),
      })
      .eq("id", parsed.id)
      .eq("org_id", session.orgId)
      .eq("request_state", "pending");
  }

  revalidatePath("/console/workforce/time-off");
}
