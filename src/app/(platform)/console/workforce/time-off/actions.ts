"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendPushTo } from "@/lib/push/send";

const Schema = z.object({
  id: z.string().uuid(),
  decision: z.enum(["approved", "denied"]),
});

export type DecideState = { error?: string; ok?: true } | null;

export async function decideTimeOff(_prev: DecideState, fd: FormData): Promise<DecideState> {
  const session = await requireSession();
  // Time-off approvals are HR-level — manager+ only. Return a visible
  // denial instead of a silent no-op (members clicking Approve used to
  // get nothing).
  if (!isManagerPlus(session)) {
    return { error: "You need manager access to decide time-off requests" };
  }
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid decision" };
  const supabase = await createClient();

  // Load the request first — for state validation and so we can notify
  // the requester after the decision lands.
  const { data: reqRow, error: readErr } = await supabase
    .from("time_off_requests")
    .select("id, user_id, starts_on, ends_on, request_state")
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (readErr) return { error: readErr.message };
  if (!reqRow) return { error: "Request not found" };
  if (reqRow.request_state !== "pending") return { error: "This request was already decided" };

  if (parsed.data.decision === "approved") {
    // The RPC flips state + decrements the balance atomically. There is
    // deliberately NO plain-UPDATE fallback: when the RPC rejects (e.g.
    // insufficient balance), falling back to a bare state flip approved
    // the request while skipping the balance decrement — corrupting
    // time_off_balances. Surface the error instead.
    const { error } = await (
      supabase.rpc as unknown as (
        name: string,
        params: Record<string, unknown>,
      ) => Promise<{ error: { message: string } | null }>
    )("approve_time_off_request", {
      p_request_id: parsed.data.id,
      p_decider_id: session.userId,
      p_decision_note: null,
    });
    if (error) return { error: `Could not approve: ${error.message}` };
  } else {
    // Denials don't touch the balance.
    const { error } = await supabase
      .from("time_off_requests")
      .update({
        request_state: "denied",
        decided_by: session.userId,
        decided_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.id)
      .eq("org_id", session.orgId)
      .eq("request_state", "pending");
    if (error) return { error: `Could not deny: ${error.message}` };
  }

  // Tell the requester — the approval used to vanish into the void and
  // crew found out by checking the app.
  const verb = parsed.data.decision === "approved" ? "approved" : "denied";
  await sendPushTo(reqRow.user_id as string, {
    title: `Time off ${verb}`,
    body: `Your request for ${reqRow.starts_on} – ${reqRow.ends_on} was ${verb}.`,
    url: "/m/time-off",
    kind: "time_off",
    scope: "mobile",
    orgId: session.orgId,
  });

  revalidatePath("/console/workforce/time-off");
  return { ok: true };
}
