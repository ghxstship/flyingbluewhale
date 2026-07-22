import { describe, it, expect } from "vitest";
import {
  INCIDENT_TRANSITIONS,
  incidentCloseNeedsManager,
  allowedIncidentTransitions,
} from "./incident-states";

/**
 * The incident close policy is a SAFETY authorization rule, not a preference:
 * it decides who may sign off a record an insurer or investigator may later
 * read. These tests pin it so a future edit has to change them on purpose.
 */
describe("incident close authorization", () => {
  const crew = { isManager: false };
  const mgr = { isManager: true };

  describe("incidentCloseNeedsManager", () => {
    it("lets anyone close lost property — handing back a phone is clerical", () => {
      expect(incidentCloseNeedsManager({ reportKind: "lost_property" })).toBe(false);
      // Even if the lost-property row carries a severity, it is still clerical.
      expect(incidentCloseNeedsManager({ reportKind: "lost_property", severity: "critical" })).toBe(false);
    });

    it("requires a manager whenever an injury is recorded, at ANY severity", () => {
      expect(incidentCloseNeedsManager({ reportKind: "safety", severity: "minor", hasInjury: true })).toBe(true);
      expect(incidentCloseNeedsManager({ reportKind: "safety", severity: "near_miss", hasInjury: true })).toBe(true);
    });

    it("requires a manager for major/critical safety reports", () => {
      expect(incidentCloseNeedsManager({ reportKind: "safety", severity: "major" })).toBe(true);
      expect(incidentCloseNeedsManager({ reportKind: "safety", severity: "critical" })).toBe(true);
    });

    it("lets the field close its own low-stakes safety reports", () => {
      expect(incidentCloseNeedsManager({ reportKind: "safety", severity: "minor" })).toBe(false);
      expect(incidentCloseNeedsManager({ reportKind: "safety", severity: "near_miss" })).toBe(false);
    });

    it("defaults to the safety tier when the kind is missing", () => {
      // report_kind defaults to 'safety' in the schema; an absent value must
      // not fall through to the lenient branch.
      expect(incidentCloseNeedsManager({ severity: "critical" })).toBe(true);
      expect(incidentCloseNeedsManager({ hasInjury: true })).toBe(true);
    });
  });

  describe("allowedIncidentTransitions", () => {
    it("never gates forward progress for crew — reporting must stay frictionless", () => {
      const injury = { reportKind: "safety", severity: "critical", hasInjury: true };
      // The field can always say "I'm on it" and "I made it safe".
      expect(allowedIncidentTransitions("open", { ...injury, ...crew })).toContain("investigating");
      expect(allowedIncidentTransitions("open", { ...injury, ...crew })).toContain("resolved");
      expect(allowedIncidentTransitions("investigating", { ...injury, ...crew })).toContain("resolved");
    });

    it("withholds close from crew on an injury report, but not the rest", () => {
      const allowed = allowedIncidentTransitions("resolved", {
        reportKind: "safety",
        severity: "minor",
        hasInjury: true,
        ...crew,
      });
      expect(allowed).not.toContain("closed");
      expect(allowed).toContain("investigating");
    });

    it("lets crew close a lost-property record (the Mark Claimed flow)", () => {
      expect(allowedIncidentTransitions("open", { reportKind: "lost_property", ...crew })).toContain("closed");
    });

    it("makes reopening a closed record manager-only", () => {
      expect(allowedIncidentTransitions("closed", { reportKind: "safety", ...crew })).toEqual([]);
      expect(allowedIncidentTransitions("closed", { reportKind: "safety", ...mgr })).toContain("investigating");
    });

    it("gives the manager band the full FSM", () => {
      for (const state of ["open", "investigating", "resolved", "closed"] as const) {
        expect(allowedIncidentTransitions(state, { reportKind: "safety", hasInjury: true, ...mgr })).toEqual(
          INCIDENT_TRANSITIONS[state],
        );
      }
    });

    it("keeps closed reopenable — a wrongly-closed injury must not be terminal", () => {
      // A sprained wrist closed on Friday can become a claim on Monday.
      expect(INCIDENT_TRANSITIONS.closed.length).toBeGreaterThan(0);
    });
  });
});
