import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Session } from "@/lib/auth";
import { emitAudit } from "@/lib/audit";

/**
 * Incident lifecycle — shared by the ATLVS console and COMPVSS.
 *
 * Extracted for the same reason as time-off, daily-log and assets: the
 * console owned the whole FSM and COMPVSS owned none of it. Mobile could
 * FILE an incident and nothing else — the list rows weren't even links —
 * so the person who witnessed it handed it to a queue and lost sight of it.
 *
 * AUTHORIZATION mirrors the console exactly, which is to say: there is no
 * app-level gate here. `incidents_update` RLS grants the `crew` persona
 * alongside the manager band, and `setIncidentStatus` has never checked
 * anything beyond the session. That may or may not be the right policy —
 * "may the crew member who filed it also close it?" is a real question —
 * but it is the CURRENT policy, and answering it differently on mobile
 * would be exactly the drift this refactor exists to stop. If it should be
 * tightened, tighten it once, here, and both shells follow.
 */

export const INCIDENT_STATES = ["open", "investigating", "resolved", "closed"] as const;
export type IncidentState = (typeof INCIDENT_STATES)[number];

/**
 * open → investigating → resolved → closed, with re-opening allowed from
 * resolved/investigating because an incident popping back up is ordinary.
 * `closed` is terminal.
 */
export const INCIDENT_TRANSITIONS: Record<IncidentState, readonly IncidentState[]> = {
  open: ["investigating", "resolved", "closed"],
  investigating: ["open", "resolved", "closed"],
  resolved: ["investigating", "closed"],
  closed: [],
};

export const INCIDENT_STATE_LABEL: Record<IncidentState, string> = {
  open: "Open",
  investigating: "Investigating",
  resolved: "Resolved",
  closed: "Closed",
};

export type IncidentTransitionResult = { ok: true } | { ok: false; error: string };

/**
 * Move an incident to `to`, enforcing the FSM.
 *
 * The UPDATE predicates on the state we read, so a stale board (or a stale
 * phone in a pocket) can't re-open an incident ops already closed — the
 * loser of a race gets an error rather than silently winning.
 */
export async function transitionIncident(
  supabase: SupabaseClient,
  session: Session,
  id: string,
  to: IncidentState,
): Promise<IncidentTransitionResult> {
  const { data: row } = await supabase
    .from("incidents")
    .select("incident_state")
    .eq("org_id", session.orgId)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!row) return { ok: false, error: "Incident not found." };

  const current = (row as { incident_state: IncidentState }).incident_state;
  // Idempotent: tapping the state you're already in is a no-op, not an error.
  if (current === to) return { ok: true };

  const allowed = INCIDENT_TRANSITIONS[current] ?? [];
  if (!allowed.includes(to)) {
    return {
      ok: false,
      error: `Cannot move ${current} → ${to}. Allowed: ${allowed.join(", ") || "(terminal)"}`,
    };
  }

  const patch: Record<string, unknown> = { incident_state: to };
  if (to === "closed") patch.closed_at = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from("incidents")
    .update(patch as never)
    .eq("org_id", session.orgId)
    .eq("id", id)
    .eq("incident_state", current)
    .is("deleted_at", null)
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!updated || updated.length === 0) {
    return { ok: false, error: "This incident changed while you were looking at it. Refresh and retry." };
  }

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "incident.state_changed",
    targetTable: "incidents",
    targetId: id,
    metadata: { fromState: current, toState: to },
  });

  return { ok: true };
}
