import { describe, expect, it } from "vitest";
import { PERSONAS, PLATFORM_ROLES } from "@/lib/supabase/types";

/**
 * Policy vocabulary canon — the `'controller'` trap.
 *
 * `private.has_org_role(org_id, required[])` matches:
 *
 *     role::text = any(required)  OR  persona = any(required)
 *
 * so every policy's `required[]` mixes two vocabularies. `owner`/`admin`/
 * `manager` are ROLES; `crew`/`collaborator` are PERSONAS. And `'controller'`
 * is NEITHER — it appears in **405 of 1571 public policies** and can never
 * match anything.
 *
 * Today that is inert, and provably so: `platform_role` is a Postgres enum
 * (owner|admin|manager|member) that rejects the literal outright, and
 * `memberships.persona` carries a CHECK that omits it. Both were verified
 * against the live schema. Nothing can hold `controller`, so those 405
 * grants are dead text.
 *
 * The hazard is what happens if that stops being true. Adding `'controller'`
 * to either vocabulary — a one-line change that would look entirely
 * reasonable in review — silently activates a quarter of the authorization
 * surface at once. Nobody would connect the two.
 *
 * Sweeping 405 policies to remove the string is the wrong trade: high blast
 * radius, zero behaviour change, and it would collide with a concurrent
 * refactor. Guarding the invariant is the proportionate fix. If someone ever
 * needs a controller role, this test fails first and forces the 405 policies
 * to be a decision rather than a side effect.
 *
 * See also `docs/compvss/MOBILE_PARITY_AUDIT.md` §3.3 and the field-intake
 * RLS work (20260715140000 / 150000 / 160000), where the same
 * role-vs-persona confusion silently excluded the field from four stores.
 */

/** Strings that appear in policy `required[]` lists but match no vocabulary. */
const DEAD_POLICY_VOCABULARY = ["controller"] as const;

describe("policy vocabulary canon", () => {
  it("keeps `controller` out of PlatformRole — 405 policies name it", () => {
    for (const dead of DEAD_POLICY_VOCABULARY) {
      expect(
        (PLATFORM_ROLES as readonly string[]).includes(dead),
        `'${dead}' became a PlatformRole. It is named in ~405 RLS policies that have always been dead text; adding it here silently activates every one of them at once. If that is genuinely intended, audit those policies FIRST, then delete this assertion in the same change.`,
      ).toBe(false);
    }
  });

  it("keeps `controller` out of Persona — has_org_role matches persona too", () => {
    for (const dead of DEAD_POLICY_VOCABULARY) {
      expect(
        (PERSONAS as readonly string[]).includes(dead),
        `'${dead}' became a Persona. has_org_role matches role OR PERSONA, so this is the same trap by the other door: ~405 policies would start granting. Audit them first.`,
      ).toBe(false);
    }
  });

  it("documents the two vocabularies a policy list may draw from", () => {
    // Not a behaviour assertion — a tripwire on the assumption the guard
    // above rests on. If either vocabulary is renamed or restructured, the
    // reasoning here needs re-reading rather than silently carrying over.
    expect(PLATFORM_ROLES).toEqual(["owner", "admin", "manager", "member"]);
    expect(PERSONAS).toContain("crew");
    expect(PERSONAS).toContain("collaborator");
  });
});
