import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { can, type Session } from "@/lib/auth";

/**
 * AUTHORIZATION regression guard — portal proposal sign-off must enforce the
 * client-signer persona, NOT bare org membership.
 *
 * The finding (HIGH): the GVTEWAY client-portal sign-off server actions —
 * sign/decline an approval, check a gate / approve a phase, request/decide a
 * change order, open/decide a revision round — gated only on `getSession()`,
 * then wrote through the RLS-enforced user client. The `proposal_approvals`
 * (and sibling) write policies are `private.is_org_member(org_id) FOR ALL`,
 * so ANY authenticated member of the operator org (a `crew`, generic `member`,
 * `contractor`, or `viewer` persona — not just the intended `client`) could
 * sign a legally-meaningful client proposal approval. RLS cannot distinguish
 * the persona, so the fix lives at the app layer: a dedicated
 * `proposals:approve` capability granted to the client (+ stakeholder viewer)
 * and, via `proposals:*`, operator manager+ — checked by every sign-off action.
 *
 * This spec is two-pronged:
 *   1. Capability-matrix shape: the right personas CAN approve, the wrong ones
 *      CANNOT. This is the substantive authorization assertion — it exercises
 *      `can()` directly, so it fails if a future edit drops the client grant
 *      (locking out the real signer) OR widens it to crew/member (re-opening
 *      the bypass).
 *   2. Wiring: each guarded sign-off action file actually consults
 *      `can(session, "proposals:approve")`. A correct matrix is worthless if an
 *      action forgets to call it — this catches the regression at the call site.
 */

const ROOT = process.cwd();

function sessionWith(persona: Session["persona"], role: Session["role"]): Session {
  return {
    userId: "u",
    email: "x@example.com",
    orgId: "o",
    orgSlug: "demo",
    role,
    // No add-on grants: this canon test asserts the STATIC floor, which is
    // exactly what a session with no grants exercises.
    grants: [],
    isDeveloper: false,
    tier: "access",
    persona,
  };
}

describe("portal proposal approve — capability matrix", () => {
  // The legitimate signer: the client persona who received the proposal.
  it("client persona CAN approve (the legitimate signer)", () => {
    expect(can(sessionWith("client", "member"), "proposals:approve")).toBe(true);
  });

  // Secondary signer on a shared client portal (e.g. the client's counsel).
  it("viewer persona CAN approve (secondary stakeholder signer)", () => {
    expect(can(sessionWith("viewer", "member"), "proposals:approve")).toBe(true);
  });

  // Operator manager+ act on the client's behalf — covered by proposals:*.
  it.each(["owner", "admin", "manager"] as const)("operator role %s CAN approve", (role) => {
    // Operator personas mirror their role; persona has no overlay for these.
    expect(can(sessionWith(role, role), "proposals:approve")).toBe(true);
  });

  it("collaborator persona CANNOT approve (co-producer has proposals:read only)", () => {
    // collaborator is project-write but explicitly proposals:read — it is NOT
    // the client signer and should not be able to sign the client's approval.
    expect(can(sessionWith("collaborator", "member"), "proposals:approve")).toBe(false);
  });

  // The bypass personas — share org membership but are NOT the client.
  it.each([
    ["crew", "member"],
    ["contractor", "member"],
    ["community", "member"],
  ] as const)("%s persona CANNOT approve (org member but not the client)", (persona, role) => {
    expect(can(sessionWith(persona, role), "proposals:approve")).toBe(false);
  });

  it("generic member (no persona overlay) CANNOT approve", () => {
    expect(can(sessionWith("member", "member"), "proposals:approve")).toBe(false);
  });

  // The client must NOT gain proposals:write — it can sign, not author.
  it("client persona still CANNOT proposals:write (sign, not author)", () => {
    expect(can(sessionWith("client", "member"), "proposals:write")).toBe(false);
  });
});

const GUARDED_SIGN_OFF_ACTIONS: readonly string[] = [
  "src/app/(portal)/p/[slug]/client/proposals/[proposalId]/approvals/actions.ts",
  "src/app/(portal)/p/[slug]/client/proposals/[proposalId]/lifecycle/actions.ts",
  "src/app/(portal)/p/[slug]/client/proposals/[proposalId]/change-orders/actions.ts",
  "src/app/(portal)/p/[slug]/client/proposals/[proposalId]/revisions/actions.ts",
];

describe("portal proposal sign-off actions — capability wiring", () => {
  for (const rel of GUARDED_SIGN_OFF_ACTIONS) {
    it(`${rel}: gates on can(session, "proposals:approve")`, () => {
      const src = readFileSync(join(ROOT, rel), "utf8");
      // Must import + call the capability check (not bare is_org_member/session).
      expect(src, `${rel} must import \`can\` from @/lib/auth`).toMatch(
        /import\s*{[^}]*\bcan\b[^}]*}\s*from\s*["']@\/lib\/auth["']/,
      );
      expect(
        /can\(\s*session\s*,\s*["']proposals:approve["']\s*\)/.test(src),
        `${rel} does not gate on can(session, "proposals:approve") — ` +
          `any org member could sign the client's proposal sign-off`,
      ).toBe(true);
    });

    it(`${rel}: every exported server action checks the capability`, () => {
      const src = readFileSync(join(ROOT, rel), "utf8");
      const exported = [...src.matchAll(/export\s+async\s+function\s+(\w+)/g)].map((m) => m[1]);
      const checks = (src.match(/can\(\s*session\s*,\s*["']proposals:approve["']\s*\)/g) ?? []).length;
      expect(exported.length).toBeGreaterThan(0);
      // One capability check per exported action (each is an independent entry
      // point a forged FormData POST could hit directly).
      expect(
        checks,
        `${rel} exports ${exported.length} action(s) (${exported.join(", ")}) but only ${checks} ` +
          `capability check(s) — every exported action must gate independently`,
      ).toBeGreaterThanOrEqual(exported.length);
    });
  }
});
