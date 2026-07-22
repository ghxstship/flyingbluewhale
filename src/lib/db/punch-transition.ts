import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Session } from "@/lib/auth";

/**
 * Punch-item lifecycle — shared by the console (`/studio/punch/[id]`) and the
 * COMPVSS field detail (`/m/punch/[itemId]`).
 *
 * Extracted for the same reason as incident-fsm, asset-transition and
 * chat-rooms: the console owned the whole FSM and COMPVSS owned none of it.
 * The field could RAISE a snag and read the queue, and nothing else — the
 * person standing in front of the defect couldn't say "I'm on it" or "this is
 * ready to look at", so every state change had to be relayed to someone at a
 * laptop.
 *
 * AUTHORIZATION mirrors the console exactly, which is to say: there is no
 * app-level gate here. `punch_items` RLS is the boundary, and the console's
 * transition has never checked anything beyond the session. Whether the crew
 * member who raised a snag should also be able to close it is a real question
 * — but it is the CURRENT policy, and answering it differently on mobile would
 * be exactly the drift this module exists to stop. If it should be tightened,
 * tighten it once, here, and both shells follow.
 */
export type PunchState = "open" | "in_progress" | "ready_for_review" | "complete" | "void";

/**
 * open → in_progress → ready_for_review → complete. A reviewer can kick back
 * from ready_for_review to in_progress. Void is allowed from any non-complete
 * state. complete + void are terminal.
 */
export const PUNCH_TRANSITIONS: Record<PunchState, readonly PunchState[]> = {
  open: ["in_progress", "ready_for_review", "void"],
  in_progress: ["ready_for_review", "open", "void"],
  ready_for_review: ["complete", "in_progress", "void"],
  complete: [],
  void: [],
};

export type PunchTransitionResult = { ok: true } | { ok: false; error: string };

/**
 * Move a punch item to `to`, refusing illegal jumps and losing races.
 *
 * The UPDATE re-asserts the state we read (`.eq("item_state", current)`), so
 * two field taps on a bad connection can't both pass the check — the loser
 * gets "changed concurrently" instead of silently overwriting the winner.
 */
export async function transitionPunch(
  supabase: SupabaseClient,
  session: Session,
  id: string,
  to: PunchState,
): Promise<PunchTransitionResult> {
  const { data: row } = await supabase
    .from("punch_items")
    .select("item_state")
    .eq("org_id", session.orgId)
    .eq("id", id)
    .maybeSingle();
  if (!row) return { ok: false, error: "Punch item not found" };

  const current = (row as { item_state: PunchState }).item_state;
  const allowed = PUNCH_TRANSITIONS[current] ?? [];
  if (!allowed.includes(to)) {
    return {
      ok: false,
      error: `Cannot move ${current} → ${to}. Allowed: ${allowed.join(", ") || "(terminal)"}`,
    };
  }

  const patch: Record<string, unknown> = { item_state: to };
  if (to === "complete") {
    patch.closed_at = new Date().toISOString();
    patch.closed_by = session.userId;
  }

  const { data: updated, error } = await supabase
    .from("punch_items")
    .update(patch as never)
    .eq("org_id", session.orgId)
    .eq("id", id)
    .eq("item_state", current as "open")
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!updated || updated.length === 0) {
    return { ok: false, error: "Punch item status changed concurrently. Refresh and retry" };
  }
  return { ok: true };
}
