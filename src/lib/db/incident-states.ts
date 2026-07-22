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
 *
 * `closed` is NO LONGER terminal (2026-07-22). In the field incidents reopen
 * constantly — a sprained wrist closed on Friday becomes a claim on Monday,
 * symptoms surface after the show, an insurer asks a question three weeks
 * later. A wrongly-closed injury record with no way back is a worse liability
 * than a wrongly-open one. Reopening is the manager band's call — see
 * `allowedIncidentTransitions`.
 */
export const INCIDENT_TRANSITIONS: Record<IncidentState, readonly IncidentState[]> = {
  open: ["investigating", "resolved", "closed"],
  investigating: ["open", "resolved", "closed"],
  resolved: ["investigating", "closed"],
  closed: ["investigating"],
};

/** Facts about the record that decide who may close it. */
export type IncidentAuthzFacts = {
  /** `incidents.report_kind` — 'safety' (default) or 'lost_property'. */
  reportKind?: string | null;
  /** `incidents.severity` — near_miss | minor | major | critical. */
  severity?: string | null;
  /** Whether `injury_type` is recorded on the report. */
  hasInjury?: boolean;
};

/**
 * Does closing THIS record need the manager band?
 *
 * `incidents` carries two very different things under one lifecycle: a phone
 * handed back at the desk (`lost_property`) and an injury report that an
 * insurer or investigator may later read (`safety`). A flat policy is wrong for
 * both — lock it down and handing back a phone needs a manager; leave it open
 * and someone closes their own injury report with no second pair of eyes.
 *
 * So the gate is on the STAKES, not the person: closing is a sign-off where
 * there is something to sign off. Filing and forward progress
 * (open → investigating → resolved) are never gated — friction on reporting
 * suppresses reporting, and `resolved` is the honest field terminal
 * ("I made it safe").
 */
export function incidentCloseNeedsManager(f: IncidentAuthzFacts): boolean {
  if (f.reportKind === "lost_property") return false;
  if (f.hasInjury) return true; // any injury gets a second look
  return f.severity === "major" || f.severity === "critical";
}

/**
 * The moves this caller may actually make — the FSM narrowed by authorization.
 *
 * Both the server executor and the UIs read this, so a surface renders exactly
 * what the server will accept instead of offering an action and then refusing
 * it.
 */
export function allowedIncidentTransitions(
  current: IncidentState,
  ctx: IncidentAuthzFacts & { isManager: boolean },
): readonly IncidentState[] {
  const base = INCIDENT_TRANSITIONS[current] ?? [];
  if (ctx.isManager) return base;
  // Reopening a closed record is always the manager band's call.
  if (current === "closed") return [];
  return base.filter((to) => (to === "closed" ? !incidentCloseNeedsManager(ctx) : true));
}

export const INCIDENT_STATE_LABEL: Record<IncidentState, string> = {
  open: "Open",
  investigating: "Investigating",
  resolved: "Resolved",
  closed: "Closed",
};

/**
 * Canonical badge tones (SSOT). The list and the detail carried private copies
 * that DISAGREED — the same incident painted resolved=ok/closed=neutral on the
 * list and resolved=info/closed=ok on the detail. One vocabulary, matching the
 * sign-off model: `resolved` reads as in-flight (info — it awaits the manager
 * close), `closed` as settled (ok).
 */
export const INCIDENT_STATE_TONE: Record<IncidentState, string> = {
  open: "danger",
  investigating: "warn",
  resolved: "info",
  closed: "ok",
};

export const INCIDENT_SEVERITY_TONE: Record<string, string> = {
  critical: "danger",
  major: "danger",
  minor: "warn",
  near_miss: "neutral",
};

export type IncidentTransitionResult = { ok: true } | { ok: false; error: string };
