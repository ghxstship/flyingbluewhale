import { describe, expect, it, vi } from "vitest";
import type { Session } from "@/lib/auth";
import { can } from "@/lib/auth";
import { ASSET_CAPABILITIES, isGrantableCapability, SHIFT_DERIVABLE_BY_DEFAULT } from "@/lib/rbac/capabilities";
import { CHECK_IN, CHECK_OUT } from "./assets";

vi.mock("server-only", () => ({}));

/**
 * `asset:custody` narrowness guard (audit G3 / ADR-0015).
 *
 * Crew self-checkout is assignable via the capability-grant layer. The whole
 * safety of that decision rests on the grant being NARROW: it lets someone
 * take a radio off a shelf and bring it back, and it must never let them
 * retire, write off, or service an asset.
 *
 * `transitionAssetState` enforces this by gating on the TARGET state rather
 * than the caller's stated intent — `allowedFrom` is an optional argument, so
 * a custody-granted caller passing `to: "retired"` with no `allowedFrom` has
 * to be refused by the target check alone. These tests pin that contract at
 * the level it can be tested without a live Postgres: the capability catalog,
 * the custody target set, and `can()`'s treatment of the grant.
 */

function sessionWith(grants: string[], role: Session["role"] = "member"): Session {
  return {
    userId: "u1",
    email: "crew@example.test",
    orgId: "o1",
    orgSlug: "demo",
    role,
    isDeveloper: false,
    tier: "core",
    persona: "crew",
    grants,
  } as Session;
}

describe("asset:custody grant", () => {
  it("is a recognised grantable capability", () => {
    // An unknown capability string in a grant row silently grants nothing —
    // the worst failure mode for a permission system, because it looks
    // configured and isn't.
    expect(isGrantableCapability("asset:custody")).toBe(true);
    expect(ASSET_CAPABILITIES).toContain("asset:custody");
  });

  it("covers exactly the two custody moves and nothing else", () => {
    // The gate reads CUSTODY_TARGETS = [CHECK_OUT.to, CHECK_IN.to]. If either
    // constant ever grows to include a destructive state, the grant would
    // silently widen — this pins the pair.
    expect(CHECK_OUT.to).toBe("in_use");
    expect(CHECK_IN.to).toBe("available");
    const custodyTargets = [CHECK_OUT.to, CHECK_IN.to];
    for (const destructive of ["retired", "in_maintenance", "lost"] as const) {
      expect(custodyTargets, `${destructive} must never be a custody target`).not.toContain(destructive);
    }
  });

  it("grants custody to a crew member who holds it, and not to one who doesn't", () => {
    expect(can(sessionWith(["asset:custody"]), "asset:custody")).toBe(true);
    expect(can(sessionWith([]), "asset:custody")).toBe(false);
  });

  it("does not let the custody grant imply any other asset power", () => {
    // Additive-only, no wildcards smuggled in: holding asset:custody must not
    // match a broader asset capability.
    const s = sessionWith(["asset:custody"]);
    expect(can(s, "asset:retire")).toBe(false);
    expect(can(s, "asset:delete")).toBe(false);
    // ...and it must not confer scanning, which is a separate grant.
    expect(can(s, "scan:credential")).toBe(false);
  });

  it("is NOT shift-derivable by default", () => {
    // Shift-derived grants make the SCHEDULER an authorization surface:
    // whoever can roster Bob onto a warehouse shift would hand him custody of
    // the gear. That may be what an org wants, and it can mark the role
    // shift_derivable deliberately — but taking possession of physical assets
    // is not a safe default to confer as a side effect of rostering.
    expect(SHIFT_DERIVABLE_BY_DEFAULT).not.toContain("asset:custody");
  });
});
