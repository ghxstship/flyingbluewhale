import { describe, expect, it } from "vitest";
import { PORTAL_PERSONAS, portalNav, type PortalPersona } from "./nav";

/**
 * Canon guard for the portal persona rails (ADR-0008 §Open questions #1).
 *
 * The ADR carries an acceptance check — "persona rails respect Miller's band
 * per section (max 10 items)" — and it had been failing in production for
 * weeks without anyone noticing. Vendor was split when it reached 14. Crew
 * was left at 11 behind a comment promising a "future cut", then drifted to
 * 12 as surfaces were backfilled. Nothing failed, because nothing counted.
 *
 * A checkbox in a markdown file is not an acceptance check; it's an
 * intention. This counts.
 *
 * Note the ceiling applies PER SECTION, not per rail: the point of the
 * Engagement/Operations split is that a reader scans one group at a time, so
 * a 13-item rail in two labelled halves is fine and a 12-item undivided one
 * is not.
 */

const MILLER_CEILING = 10;

describe("portal persona rails (ADR-0008 §Open questions #1)", () => {
  it("every persona rail section stays within Miller's band", () => {
    const offenders: string[] = [];

    for (const persona of PORTAL_PERSONAS) {
      const nav = portalNav("test-slug", persona as PortalPersona);
      // A rail is either flat `items` or `sections`; both are subject to the
      // ceiling, since both are what a human actually scans.
      const groups: { label: string; count: number }[] = [
        ...(nav.items?.length ? [{ label: `${persona} (flat)`, count: nav.items.length }] : []),
        ...(nav.sections ?? []).map((s) => ({ label: s.label, count: s.items.length })),
      ];
      for (const g of groups) {
        if (g.count > MILLER_CEILING) offenders.push(`${persona} → "${g.label}" has ${g.count} items`);
      }
    }

    expect(
      offenders,
      `Persona rail sections over Miller's ceiling of ${MILLER_CEILING}.\n` +
        `Split the persona into "<Title> / Engagement" (the paperwork you have WITH the org: terms, money, ` +
        `compliance, training) + "<Title> / Operations" (the day-to-day of doing the work: where to be, who ` +
        `with, what changed) via the SPLITS map in nav.ts — the same cut vendor and crew already use.\n\n` +
        offenders.join("\n"),
    ).toEqual([]);
  });

  it("the two Workforce-parity personas are split, and the split loses no items", () => {
    // Regression guard for the split mechanics themselves: `pick()` silently
    // drops any slug that doesn't resolve, so a renamed route would quietly
    // vanish from the rail rather than fail. Assert the sections still
    // account for every item the persona defines.
    for (const persona of ["vendor", "crew"] as const) {
      const nav = portalNav("test-slug", persona);
      const sections = nav.sections ?? [];
      const labels = sections.map((s) => s.label);
      expect(labels, `${persona} should be split into Engagement + Operations`).toEqual([
        expect.any(String), // Workspace
        `${persona === "vendor" ? "Vendor" : "Crew"} / Engagement`,
        `${persona === "vendor" ? "Vendor" : "Crew"} / Operations`,
      ]);

      const personaItems = sections.slice(1).flatMap((s) => s.items);
      expect(personaItems.length, `${persona} split dropped items — check the SPLITS slugs in nav.ts`).toBeGreaterThan(
        0,
      );
      // No item may appear in both halves.
      const hrefs = personaItems.map((i) => i.href);
      expect(new Set(hrefs).size, `${persona} has a duplicate item across its two sections`).toBe(hrefs.length);
    }
  });
});
