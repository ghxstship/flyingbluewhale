"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendPushTo } from "@/lib/push/send";
import { log } from "@/lib/log";
import { TIME_OFF_DECISIONS, decideTimeOffRequest } from "@/lib/db/time-off";
import { UNDECIDED_SWAP_STATES } from "@/lib/workforce";

export type State = { error?: string; ok?: boolean } | null;

const TimeOffDecision = z.object({
  id: z.string().uuid(),
  // `denied`, never `declined` — the CHECK constraint rejects the latter.
  // Sourced from the shared tuple so the two shells can't drift again.
  decision: z.enum(TIME_OFF_DECISIONS),
  note: z.string().optional(),
});

const SwapDecision = z.object({
  id: z.string().uuid(),
  decision: z.enum(["approved", "declined"]),
});

/**
 * Decide a time-off request. Manager+ only (re-checked server-side inside
 * the shared decider, not just hidden in the UI). Delegates to
 * `decideTimeOffRequest` so approve routes through the balance-decrementing
 * RPC exactly as the console does.
 */
export async function decideTimeOff(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Not authorized." };
  const parsed = TimeOffDecision.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid request." };

  const supabase = await createClient();
  const result = await decideTimeOffRequest(supabase, session, {
    id: parsed.data.id,
    decision: parsed.data.decision,
    note: parsed.data.note,
  });
  if (!result.ok) {
    log.error("m.requests.timeoff_decide_failed", { err: result.error });
    return { error: result.error };
  }

  const requester = result.row.user_id;
  if (requester && requester !== session.userId) {
    const verb = parsed.data.decision;
    await sendPushTo(requester, {
      title: `Time off ${verb}`,
      body: `Your request for ${result.row.starts_on} to ${result.row.ends_on} was ${verb}.${
        parsed.data.note ? ` Note: ${parsed.data.note}` : ""
      }`,
      url: "/m/time-off",
      kind: "time_off",
      scope: "mobile",
      orgId: session.orgId,
    });
  }

  revalidatePath("/m/requests");
  revalidatePath("/m/time-off");
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
    .select("id, requested_by, swap_state")
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!swap) return { error: "Swap not found." };
  if (!(UNDECIDED_SWAP_STATES as readonly string[]).includes(swap.swap_state as string)) {
    return { error: "This swap was already decided." };
  }

  // Predicate on the undecided states so a concurrent decision from the
  // console can't be silently overwritten by a stale mobile tab (mirrors
  // the guard in studio/workforce/shift-swaps/actions.ts).
  const { error } = await supabase
    .from("shift_swaps")
    .update({
      swap_state: parsed.data.decision,
      decided_by: session.userId,
      decided_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId)
    .in("swap_state", [...UNDECIDED_SWAP_STATES]);
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
