import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Session } from "@/lib/auth";
import { isManagerPlus } from "@/lib/auth";

/**
 * Canonical time-off decision path — shared by the ATLVS console
 * (`/studio/workforce/time-off`) and the COMPVSS field app (`/m/requests`).
 *
 * This module exists because the two shells forked. The mobile action grew
 * its own plain-UPDATE approve (skipping the balance decrement, corrupting
 * `time_off_balances`) and wrote `"declined"` — a value the
 * `time_off_requests_request_state_check` CHECK rejects, so every field
 * denial failed with 23514. Both bugs were invisible because nothing tied
 * the two code paths together. Route every shell through here.
 */

/**
 * The only two decisions the DB accepts. The CHECK constraint
 * (baseline.sql: time_off_requests_request_state_check) allows
 * pending | approved | denied | cancelled — `"declined"` is NOT a member.
 */
export const TIME_OFF_DECISIONS = ["approved", "denied"] as const;
export type TimeOffDecision = (typeof TIME_OFF_DECISIONS)[number];

export type DecideTimeOffInput = {
  id: string;
  decision: TimeOffDecision;
  note?: string | null;
};

export type DecideTimeOffResult =
  | { ok: true; row: { user_id: string; starts_on: string; ends_on: string } }
  | { ok: false; error: string };

type LooseRpc = (name: string, params: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;

/**
 * Decide a time-off request, atomically and with the balance kept honest.
 *
 * Approve routes through the `approve_time_off_request` SECURITY DEFINER
 * RPC, which flips the state and decrements `time_off_balances` in one
 * transaction. There is deliberately NO plain-UPDATE fallback: when the
 * RPC rejects (e.g. insufficient balance), a bare state flip would approve
 * the request while skipping the decrement. Surface the error instead.
 *
 * Deny doesn't touch the balance, but still predicates on
 * `request_state = 'pending'` so a stale tab can't re-decide a settled row.
 *
 * Caller is responsible for `revalidatePath` and for notifying the
 * requester — the returned row carries the fields a push needs.
 */
export async function decideTimeOffRequest(
  supabase: SupabaseClient,
  session: Session,
  input: DecideTimeOffInput,
): Promise<DecideTimeOffResult> {
  // Time-off decisions are HR-level. Re-checked here rather than trusted
  // from the caller so neither shell can skip the gate by hiding a button.
  if (!isManagerPlus(session)) {
    return { ok: false, error: "You need manager access to decide time-off requests" };
  }

  const { data: row, error: readErr } = await supabase
    .from("time_off_requests")
    .select("id, user_id, starts_on, ends_on, request_state")
    .eq("id", input.id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (readErr) return { ok: false, error: readErr.message };
  if (!row) return { ok: false, error: "Request not found" };
  if (row.request_state !== "pending") return { ok: false, error: "This request was already decided" };

  const note = input.note?.trim() || null;

  if (input.decision === "approved") {
    const { error } = await (supabase.rpc as unknown as LooseRpc)("approve_time_off_request", {
      p_request_id: input.id,
      p_decider_id: session.userId,
      p_decision_note: note,
    });
    if (error) return { ok: false, error: `Could not approve: ${error.message}` };
  } else {
    const { error } = await supabase
      .from("time_off_requests")
      .update({
        request_state: "denied",
        decided_by: session.userId,
        decided_at: new Date().toISOString(),
        decision_note: note,
      })
      .eq("id", input.id)
      .eq("org_id", session.orgId)
      .eq("request_state", "pending");
    if (error) return { ok: false, error: `Could not deny: ${error.message}` };
  }

  return {
    ok: true,
    row: {
      user_id: row.user_id as string,
      starts_on: row.starts_on as string,
      ends_on: row.ends_on as string,
    },
  };
}
