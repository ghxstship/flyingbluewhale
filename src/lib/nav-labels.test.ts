import { describe, expect, it } from "vitest";
import { NAV_LENSES, platformNav, type NavGroup, type NavItem } from "./nav";

/**
 * v7.8 kit Law #3 — "One Noun · One Home": a noun appears in the platform
 * rail exactly once. The 2026-07-03 dedup (ADR-0014) disambiguated the five
 * historical collisions (Reports/Documents/Warranties/Contracts/Payouts);
 * this guard keeps new collisions out.
 */
function allItems(groups: NavGroup[]): NavItem[] {
  return groups.flatMap((g) => [
    ...g.items,
    ...(g.sections ?? []).flatMap((s) => s.items),
  ]);
}

describe("platform nav label canon (ADR-0014)", () => {
  it("no two rail items share a label", () => {
    const seen = new Map<string, string>();
    const dupes: string[] = [];
    for (const item of allItems(platformNav)) {
      const prior = seen.get(item.label);
      if (prior && prior !== item.href) dupes.push(`${item.label} (${prior} · ${item.href})`);
      seen.set(item.label, item.href);
    }
    expect(dupes, `Duplicate rail nouns — disambiguate per ADR-0014: ${dupes.join(", ")}`).toEqual([]);
  });

  it("every rail item carries a hover subtitle (v7.8 zero-training layer)", () => {
    const missing = allItems(platformNav)
      .filter((i) => !i.sub || i.sub.trim().length === 0)
      .map((i) => i.href);
    expect(missing, `Nav items missing sub: ${missing.join(", ")}`).toEqual([]);
  });

  it("every Role Lens allow-list entry names a real group", () => {
    const groupLabels = new Set(platformNav.map((g) => g.label));
    for (const [lens, allow] of Object.entries(NAV_LENSES)) {
      for (const label of allow ?? []) {
        expect(groupLabels.has(label), `Lens ${lens} references unknown group "${label}"`).toBe(true);
      }
    }
  });

  it("no em/en dashes in labels or subtitles (voice canon)", () => {
    // The one grandfathered exception is the "TOC — ITIL" label, which
    // predates the rule and is an acronym lockup, not copy.
    const offenders = allItems(platformNav)
      .filter((i) => i.label !== "TOC — ITIL")
      .filter((i) => /[—–]/.test(i.label) || /[—–]/.test(i.sub ?? ""))
      .map((i) => i.href);
    expect(offenders).toEqual([]);
  });
});
