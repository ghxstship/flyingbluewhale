/**
 * Incident lifecycle DATA — states, transition map, labels. Pure values,
 * importable from ANY module graph.
 *
 * Split out of incident-fsm.ts (2026-07-17): the FSM executor is
 * server-only (it audits through the service client), but the client
 * TriageRow needs the labels/types — and a "use client" module importing a
 * server-only file is a Turbopack BUILD error, not a tsc error, so it
 * survived every local gate and killed the Vercel build. Data lives here
 * with no server imports; incident-fsm.ts re-exports it so server callers
 * keep one import path.
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
