/**
 * Tour Management (kit 26) — IA remediation guard.
 *
 * The touring layer promotes Tours onto the Talent rail, collapses the Talent
 * "mirror" tab family (sidebar = the noun; tabs = lenses/sub-entities that live
 * ONLY inside that one workspace — if a tab family's hrefs equal other rail
 * items' hrefs, it's a mirror), merges Casting Calls + Submissions into one
 * Casting workspace, adds a Tours cockpit tab family, a Tour Settlement lens in
 * Finance, and a Day Sheets rail item in Operations. These assertions freeze
 * that contract so a future nav edit can't silently reintroduce the redundancy.
 */
import { describe, expect, it } from "vitest";
import { platformNavDomain, platformTabs, platformUtility } from "./nav";

const talent = platformNavDomain.find((g) => g.label === "Talent");
const operations = platformNavDomain.find((g) => g.label === "Operations");

describe("Tour Management — Talent rail", () => {
  it("has exactly four items: Artist Roster · Artist Offers & Holds · Tours · Casting", () => {
    expect(talent).toBeDefined();
    expect(talent!.items.map((i) => i.label)).toEqual([
      "Artist Roster",
      "Artist Offers & Holds",
      "Tours",
      "Casting",
    ]);
  });

  it("promotes Tours onto the rail (icon Route) and drops the standalone Submissions item", () => {
    const tours = talent!.items.find((i) => i.label === "Tours");
    expect(tours?.href).toBe("/studio/agency/tours");
    expect(tours?.icon).toBe("Route");
    expect(talent!.items.some((i) => i.label === "Submissions")).toBe(false);
  });

  it("removes Tours from platformUtility (it now lives on the rail)", () => {
    expect(platformUtility.some((i) => i.href === "/studio/agency/tours")).toBe(false);
  });
});

describe("Tour Management — Operations rail", () => {
  it("carries a Day Sheets item with the FileClock icon", () => {
    const day = operations!.items.find((i) => i.href === "/studio/operations/day-sheets");
    expect(day?.label).toBe("Day Sheets");
    expect(day?.icon).toBe("FileClock");
  });
});

describe("Tour Management — tab families", () => {
  it("collapses the Talent mirror (no owner on /studio/marketplace/talent)", () => {
    expect(platformTabs.some((f) => f.owner === "/studio/marketplace/talent")).toBe(false);
  });

  it("Casting workspace has Calls + Submissions sub-entity tabs", () => {
    const casting = platformTabs.find((f) => f.owner === "/studio/marketplace/calls");
    expect(casting?.tabs.map((t) => t.href)).toEqual([
      "/studio/marketplace/calls",
      "/studio/marketplace/submissions",
    ]);
  });

  it("Tours cockpit has Tours + Routing lenses", () => {
    const tours = platformTabs.find((f) => f.owner === "/studio/agency/tours");
    expect(tours?.tabs.map((t) => t.href)).toEqual([
      "/studio/agency/tours",
      "/studio/agency/tours/routing",
    ]);
  });

  it("Finance · Budgets carries the Tour Settlement lens", () => {
    const budgets = platformTabs.find((f) => f.owner === "/studio/finance/budgets");
    expect(budgets?.tabs.some((t) => t.href === "/studio/finance/wip?scope=tour")).toBe(true);
  });

  it("no tab family mirrors OTHER rail items' hrefs (the mirror rule)", () => {
    // Every rail href across all groups.
    const railHrefs = new Set(platformNavDomain.flatMap((g) => g.items.map((i) => i.href)));
    for (const fam of platformTabs) {
      // A family's own owner is allowed to be a rail item (that IS its workspace).
      const nonOwnerTabHrefs = fam.tabs.map((t) => t.href).filter((h) => h !== fam.owner);
      // A mirror = a family whose EVERY non-owner tab points at some OTHER rail
      // item. Sub-entity/lens tabs (submissions, routing, wip?scope=tour) are not
      // rail items, so a healthy family always has at least one non-rail tab.
      const allTabsAreRailItems =
        nonOwnerTabHrefs.length > 0 && nonOwnerTabHrefs.every((h) => railHrefs.has(h));
      expect(allTabsAreRailItems, `tab family ${fam.owner} mirrors the rail`).toBe(false);
    }
  });
});
