import { describe, it, expect } from "vitest";
import {
  HUB_LANDING_METRICS_ENABLED,
  hubLandingMetrics,
  operationsMetrics,
  logisticsMetrics,
} from "./hub-metrics";

const TONES = ["success", "warning", "danger", "info", "text-3", "accent"];

describe("hub-metrics", () => {
  it("ships OFF by default (hub landings stay clean routers)", () => {
    expect(HUB_LANDING_METRICS_ENABLED).toBe(false);
  });

  it("returns no metrics for any hub while disabled — short-circuits before any read", async () => {
    const session = { orgId: "org-1", userId: "user-1" };
    // Includes the live-read hubs: with the flag off these must resolve to []
    // WITHOUT touching Supabase (so the test needs no DB/cookies).
    for (const hub of ["operations", "logistics", "projects", "equipment", "workforce", "unknown"]) {
      expect(await hubLandingMetrics(hub, session)).toEqual([]);
    }
  });

  it("operationsMetrics summarizes ops-seed into 3 well-formed cells", () => {
    const m = operationsMetrics();
    expect(m).toHaveLength(3);
    for (const cell of m) {
      expect(typeof cell.short).toBe("string");
      expect(typeof cell.v).toBe("number");
      expect(cell.v as number).toBeGreaterThanOrEqual(0);
      expect(TONES).toContain(cell.tone);
    }
  });

  it("logisticsMetrics summarizes ops-seed into 3 well-formed cells", () => {
    const m = logisticsMetrics();
    expect(m.map((c) => c.short)).toEqual(["En Route", "Delayed", "Inbound"]);
    for (const cell of m) {
      expect(typeof cell.v).toBe("number");
      expect(TONES).toContain(cell.tone);
    }
  });
});
