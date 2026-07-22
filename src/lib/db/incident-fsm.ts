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
 * AUTHORIZATION (2026-07-22). The open question this file used to carry —
 * "may the crew member who filed it also close it?" — is now answered, once,
 * here, so both shells follow.
 *
 * Filing and forward progress (open → investigating → resolved) stay ungated:
 * friction on reporting suppresses reporting, and `resolved` is the honest
 * field terminal ("I made it safe"). The gate is on CLOSING, and only where
 * there are stakes to sign off — see `incidentCloseNeedsManager`. Reopening a
 * closed record is always the manager band's. RLS remains the outer boundary;
 * this is the tier inside it.
 */

/* The lifecycle DATA (states, transition map, labels) lives in
   incident-states.ts so client components can import it without dragging
   this server-only executor into their graph. Re-exported here so server
   callers keep one import path. */
export {
  INCIDENT_STATES,
  INCIDENT_TRANSITIONS,
  INCIDENT_STATE_LABEL,
  incidentCloseNeedsManager,
  allowedIncidentTransitions,
  type IncidentAuthzFacts,
  type IncidentState,
  type IncidentTransitionResult,
} from "./incident-states";
import {
  INCIDENT_TRANSITIONS,
  allowedIncidentTransitions,
  type IncidentState,
  type IncidentTransitionResult,
} from "./incident-states";
import { isManagerPlus } from "@/lib/auth";

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
  // report_kind/severity/injury_type decide who may CLOSE this record.
  const { data: row } = await supabase
    .from("incidents")
    .select("incident_state, report_kind, severity, injury_type")
    .eq("org_id", session.orgId)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!row) return { ok: false, error: "Incident not found." };

  const r = row as {
    incident_state: IncidentState;
    report_kind: string | null;
    severity: string | null;
    injury_type: string | null;
  };
  const current = r.incident_state;
  // Idempotent: tapping the state you're already in is a no-op, not an error.
  if (current === to) return { ok: true };

  const facts = {
    reportKind: r.report_kind,
    severity: r.severity,
    hasInjury: r.injury_type != null,
  };
  const allowed = allowedIncidentTransitions(current, { ...facts, isManager: isManagerPlus(session) });
  if (!allowed.includes(to)) {
    // Separate "that move doesn't exist" from "that move isn't yours", so the
    // field gets a message it can act on rather than a generic refusal.
    const legal = INCIDENT_TRANSITIONS[current] ?? [];
    if (legal.includes(to)) {
      return {
        ok: false,
        error:
          current === "closed"
            ? "Only a manager can reopen a closed incident."
            : "Closing an injury or major/critical report is a manager sign-off. Mark it resolved and it goes to them.",
      };
    }
    return {
      ok: false,
      error: `Cannot move ${current} → ${to}. Allowed: ${legal.join(", ") || "(terminal)"}`,
    };
  }

  const patch: Record<string, unknown> = { incident_state: to };
  if (to === "closed") {
    patch.closed_at = new Date().toISOString();
    // The column existed and was never written: attribution lived only in the
    // audit log. Who signed a safety record off belongs ON the record.
    patch.closed_by = session.userId;
  } else if (current === "closed") {
    // Reopened — clear the sign-off rather than leave a closed_at on an open
    // record. The audit log keeps the history of who closed it and when.
    patch.closed_at = null;
    patch.closed_by = null;
  }

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
