import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Session } from "@/lib/auth";

/**
 * Daily-log lifecycle — shared by the ATLVS console and COMPVSS.
 *
 * Extracted for the same reason as `db/time-off.ts`: the two shells had
 * already forked. The console owned the whole FSM (`transitionDailyLog`,
 * with a CAS guard so a double-approve can't clobber the original
 * approver), while COMPVSS could only ever `upsert(... log_state: 'draft')`
 * — hard-coded, no transition path, no `[id]` route. So a site diary was
 * authored on the phone, in the field, by the person who was there, and
 * then had to wait for someone to reach a desk before it could be
 * submitted. The one artifact most obviously owned by the field was the
 * one the field couldn't finish.
 */

export const DAILY_LOG_STATES = ["draft", "submitted", "approved"] as const;
export type DailyLogState = (typeof DAILY_LOG_STATES)[number];

/**
 * Allowed transitions. `approved` is terminal — re-approving would
 * overwrite the original approver attribution and timestamp.
 */
export const DAILY_LOG_TRANSITIONS: Record<DailyLogState, readonly DailyLogState[]> = {
  draft: ["submitted"],
  submitted: ["approved"],
  approved: [],
};

export type TransitionResult = { ok: true } | { ok: false; error: string };

/**
 * Move a daily log to `to`, enforcing the FSM and stamping the actor.
 *
 * The UPDATE predicates on the state we read (`.eq("log_state", current)`),
 * so two people submitting the same log race safely: the loser gets a
 * "changed concurrently" error rather than silently overwriting the
 * winner's attribution.
 */
export async function transitionDailyLogState(
  supabase: SupabaseClient,
  session: Session,
  id: string,
  to: DailyLogState,
): Promise<TransitionResult> {
  const { data: row } = await supabase
    .from("daily_logs")
    .select("log_state")
    .eq("org_id", session.orgId)
    .eq("id", id)
    .maybeSingle();
  if (!row) return { ok: false, error: "Daily log not found." };

  const current = (row as { log_state: DailyLogState }).log_state;
  const allowed = DAILY_LOG_TRANSITIONS[current] ?? [];
  if (!allowed.includes(to)) {
    return {
      ok: false,
      error: `Cannot move ${current} → ${to}. Allowed: ${allowed.join(", ") || "(terminal)"}`,
    };
  }

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { log_state: to };
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
    .eq("log_state", current)
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!updated || updated.length === 0) {
    return { ok: false, error: "Daily log changed concurrently. Refresh and retry." };
  }
  return { ok: true };
}
