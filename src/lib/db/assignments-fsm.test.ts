import { describe, expect, it } from "vitest";
import { FULFILLMENT_STATES, NEXT_FULFILLMENT_STATES, type FulfillmentState } from "./assignments";

/**
 * Locks the flagship advancing state machine (CLAUDE.md §Advancing canon).
 * `NEXT_FULFILLMENT_STATES` is enforced server-side on every transition —
 * a silent edit here changes which lifecycle jumps the platform accepts,
 * so the matrix itself is pinned, not just its shape.
 */

const TERMINAL: FulfillmentState[] = ["rejected", "redeemed", "expired", "voided", "returned"];

describe("fulfillment state machine", () => {
  it("covers every state exactly once", () => {
    expect(Object.keys(NEXT_FULFILLMENT_STATES).sort()).toEqual([...FULFILLMENT_STATES].sort());
  });

  it("every transition target is a known state", () => {
    for (const [from, targets] of Object.entries(NEXT_FULFILLMENT_STATES)) {
      for (const to of targets) {
        expect(FULFILLMENT_STATES, `${from} → ${to}`).toContain(to);
      }
    }
  });

  it("no state transitions to itself", () => {
    for (const [from, targets] of Object.entries(NEXT_FULFILLMENT_STATES)) {
      expect(targets, `${from} must not self-loop`).not.toContain(from);
    }
  });

  it("terminal states have no outgoing transitions", () => {
    for (const s of TERMINAL) {
      expect(NEXT_FULFILLMENT_STATES[s], `${s} is terminal`).toEqual([]);
    }
  });

  it("pins the doc/advance arc", () => {
    expect(NEXT_FULFILLMENT_STATES.briefed).toEqual(["draft", "submitted", "issued"]);
    expect(NEXT_FULFILLMENT_STATES.draft).toEqual(["submitted"]);
    expect(NEXT_FULFILLMENT_STATES.submitted).toEqual(["in_review", "approved", "revision_requested", "rejected"]);
    expect(NEXT_FULFILLMENT_STATES.in_review).toEqual(["approved", "revision_requested", "rejected"]);
    expect(NEXT_FULFILLMENT_STATES.revision_requested).toEqual(["submitted", "rejected"]);
    expect(NEXT_FULFILLMENT_STATES.approved).toEqual(["delivered", "issued"]);
    expect(NEXT_FULFILLMENT_STATES.delivered).toEqual(["returned"]);
  });

  it("pins the physical-asset/ticket arc", () => {
    // issued -> returned closes the field return path (checkin_my_assignment
    // RPC); the tuple, the RPC, and the studio transition UI now agree.
    expect(NEXT_FULFILLMENT_STATES.issued).toEqual(["transferred", "redeemed", "returned", "voided", "expired"]);
    expect(NEXT_FULFILLMENT_STATES.transferred).toEqual(["redeemed", "voided", "expired"]);
  });

  it("every non-terminal state can eventually reach a terminal state", () => {
    const reachesTerminal = (start: FulfillmentState): boolean => {
      const seen = new Set<FulfillmentState>();
      const stack: FulfillmentState[] = [start];
      while (stack.length) {
        const s = stack.pop()!;
        if (TERMINAL.includes(s)) return true;
        if (seen.has(s)) continue;
        seen.add(s);
        stack.push(...NEXT_FULFILLMENT_STATES[s]);
      }
      return false;
    };
    for (const s of FULFILLMENT_STATES) {
      expect(reachesTerminal(s), `${s} must reach a terminal state`).toBe(true);
    }
  });
});
