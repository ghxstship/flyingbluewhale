import { describe, it, expect } from "vitest";
import raw from "./entitlements.json";
import {
  ECOSYSTEM_APPS,
  APP_BY_ID,
  RAIL_ORDER,
  RAIL_GROUPS,
  AVAILABLE,
  SHOW_RAIL_WHEN_GTE,
  activeAppForShell,
  hrefForApp,
  resolveEntitledApps,
  reachableApps,
  shouldShowRail,
  type AppId,
} from "./entitlements";

const PRODUCTS: AppId[] = ["atlvs", "compvss", "gvteway", "legend"];
const EXTENSIONS: AppId[] = ["opvs", "cvrgo", "vault", "mvnifest", "gvlley", "social", "email"];

describe("entitlements catalog ⇄ JSON contract", () => {
  it("types every app in the contract, in rail order", () => {
    const jsonIds = (raw.apps as { id: string }[]).map((a) => a.id);
    expect(ECOSYSTEM_APPS.map((a) => a.id)).toEqual(jsonIds);
    expect(RAIL_ORDER).toEqual(raw.rules.railOrder);
    // Every rail id resolves to a catalog entry + an availability flag.
    for (const id of RAIL_ORDER) {
      expect(APP_BY_ID[id], `APP_BY_ID[${id}]`).toBeTruthy();
      expect(typeof AVAILABLE[id], `AVAILABLE[${id}]`).toBe("boolean");
    }
  });

  it("groups cover every app exactly once", () => {
    const grouped = RAIL_GROUPS.flatMap((g) => g.apps);
    expect([...grouped].sort()).toEqual([...RAIL_ORDER].sort());
    expect(new Set(grouped).size).toBe(grouped.length);
  });

  it("products are live; extensions are coming soon", () => {
    for (const id of PRODUCTS) expect(AVAILABLE[id], id).toBe(true);
    for (const id of EXTENSIONS) expect(AVAILABLE[id], id).toBe(false);
  });

  it("the gate threshold matches the contract", () => {
    expect(SHOW_RAIL_WHEN_GTE).toBe(raw.rules.showRailWhenEntitledAppsGTE);
  });
});

describe("addressing", () => {
  it("maps each Next shell to its product", () => {
    expect(activeAppForShell("platform")).toBe("atlvs");
    expect(activeAppForShell("mobile")).toBe("compvss");
    expect(activeAppForShell("portal")).toBe("gvteway");
    expect(activeAppForShell("legend")).toBe("legend");
    expect(activeAppForShell("marketing")).toBeNull();
  });

  it("products resolve an href; coming-soon extensions do not", () => {
    for (const id of PRODUCTS) expect(hrefForApp(id), id).toBeTruthy();
    for (const id of EXTENSIONS) expect(hrefForApp(id), id).toBeNull();
  });
});

describe("resolveEntitledApps", () => {
  it("gives a developer every product (full)", () => {
    const apps = resolveEntitledApps({ role: "member", persona: "member", isDeveloper: true, hasPortal: false });
    const reach = reachableApps(apps);
    expect(reach.map((a) => a.id).sort()).toEqual([...PRODUCTS].sort());
    expect(reach.every((a) => a.access === "full")).toBe(true);
    expect(shouldShowRail(apps)).toBe(true);
  });

  it("keeps an external client out of the operator + field consoles", () => {
    const apps = resolveEntitledApps({ role: null, persona: "client", isDeveloper: false, hasPortal: true });
    const byId = Object.fromEntries(apps.map((a) => [a.id, a]));
    expect(byId.atlvs!.access).toBeNull();
    expect(byId.compvss!.access).toBeNull();
    expect(byId.gvteway!.access).toBe("full"); // portal footing
  });

  it("always surfaces the extensions as coming soon (never reachable)", () => {
    const apps = resolveEntitledApps({ role: "owner", persona: "owner", isDeveloper: false, hasPortal: false });
    for (const id of EXTENSIONS) {
      const a = apps.find((x) => x.id === id)!;
      expect(a.comingSoon, id).toBe(true);
      expect(a.access, id).toBeNull();
    }
    // An owner reaches ≥ 2 products → the rail shows.
    expect(shouldShowRail(apps)).toBe(true);
  });

  it("hides the rail for a single-surface user", () => {
    // A learner with only LEG3ND read access → 1 reachable app → no rail.
    const apps = resolveEntitledApps({ role: null, persona: "community", isDeveloper: false, hasPortal: false });
    expect(reachableApps(apps).length).toBeLessThan(SHOW_RAIL_WHEN_GTE);
    expect(shouldShowRail(apps)).toBe(false);
  });
});
