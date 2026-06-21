"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendPushTo } from "@/lib/push/send";
import { log } from "@/lib/log";

export type State = { error?: string; ok?: boolean } | null;

const TimeOffDecision = z.object({
  id: z.string().uuid(),
  decision: z.enum(["approved", "declined"]),
  note: z.string().optional(),
});

const SwapDecision = z.object({
  id: z.string().uuid(),
  decision: z.enum(["approved", "declined"]),
});

/**
 * Decide a time-off request. Manager+ only (re-checked server-side, not
 * just hidden in the UI). Writes request_state + decider stamp, then
 * notifies the requester.
 */
export async function decideTimeOff(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Not authorized." };
  const parsed = TimeOffDecision.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid request." };

  const supabase = await createClient();
  const { data: req } = await supabase
    .from("time_off_requests")
    .select("id, user_id")
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!req) return { error: "Request not found." };

  const { error } = await supabase
    .from("time_off_requests")
    .update({
      request_state: parsed.data.decision,
      decided_by: session.userId,
      decided_at: new Date().toISOString(),
      decision_note: parsed.data.note || null,
    })
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId);
  if (error) {
    log.error("m.requests.timeoff_decide_failed", { err: error.message });
    return { error: error.message };
  }

  const requester = req.user_id as string;
  if (requester && requester !== session.userId) {
    await sendPushTo(requester, {
      title: `Time off ${parsed.data.decision}`,
      body: "Your time-off request was reviewed.",
      url: "/m/requests",
      kind: "time_off",
      scope: "mobile",
      orgId: session.orgId,
    });
  }

  revalidatePath("/m/requests");
  return { ok: true };
}

/**
 * Decide a shift-swap request. Manager+ only. Writes swap_state + decider
 * stamp, then notifies the requester.
 */
export async function decideSwap(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Not authorized." };
  const parsed = SwapDecision.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid request." };

  const supabase = await createClient();
  const { data: swap } = await supabase
    .from("shift_swaps")
    .select("id, requested_by")
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!swap) return { error: "Swap not found." };

  const { error } = await supabase
    .from("shift_swaps")
    .update({
      swap_state: parsed.data.decision,
      decided_by: session.userId,
      decided_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId);
  if (error) {
    log.error("m.requests.swap_decide_failed", { err: error.message });
    return { error: error.message };
  }

  const requester = swap.requested_by as string;
  if (requester && requester !== session.userId) {
    await sendPushTo(requester, {
      title: `Shift swap ${parsed.data.decision}`,
      body: "Your shift-swap request was reviewed.",
      url: "/m/requests",
      kind: "shift_swap",
      scope: "mobile",
      orgId: session.orgId,
    });
  }

  revalidatePath("/m/requests");
  return { ok: true };
}
