/**
 * Field-relevant on-site capabilities surfaced on the Rose "Access & Permissions"
 * list. Each maps a REAL capability key (see auth.ts CAPABILITIES /
 * effective_capabilities) to a human label + KIcon name.
 *
 * We render ONLY the granted subset — "what you're cleared to do" — and never a
 * "denied" list. That is deliberate and honest: many base field actions (submit
 * an expense, file an incident, request an advance) are RLS-gated rather than
 * capability-gated, so the ABSENCE of a capability here does NOT mean the worker
 * can't do that thing. Listing "not cleared" rows from the capability model would
 * misrepresent those RLS-available actions. Owner/admin (grant "*") match every
 * row. This replaces the prototype's hardcoded PASS_PERMS fiction with the
 * holder's actual authorities.
 */
export type SiteCapability = { cap: string; key: string; label: string; icon: string };

export const FIELD_CAPABILITIES: readonly SiteCapability[] = [
  { cap: "time:write", key: "m.wallet.cap.clock", label: "Clock In & Out", icon: "Clock" },
  { cap: "check-in:write", key: "m.wallet.cap.scan", label: "Gate & Asset Scanning", icon: "ScanLine" },
  { cap: "tasks:write", key: "m.wallet.cap.tasks", label: "Update Tasks", icon: "ClipboardCheck" },
  { cap: "schedule:write", key: "m.wallet.cap.schedule", label: "Manage Schedule", icon: "CalendarClock" },
  { cap: "people:manage", key: "m.wallet.cap.roster", label: "Manage Roster", icon: "Users" },
  { cap: "advance:approve", key: "m.wallet.cap.approve", label: "Approve Advances", icon: "CheckCheck" },
];

/**
 * The granted subset of field capabilities, given a capability predicate
 * (e.g. `(c) => can(session, c)`). Pure — no session dependency — so it unit
 * tests without auth wiring.
 */
export function grantedSiteCapabilities(has: (cap: string) => boolean): SiteCapability[] {
  return FIELD_CAPABILITIES.filter((c) => has(c.cap));
}
