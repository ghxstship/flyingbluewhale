import { describe, it, expect, vi } from "vitest";

// The Operations/Logistics metrics now read the real org-scoped field_* ledgers
// via the resolver — mock it so the aggregation logic unit-tests without a DB.
vi.mock("./ops-ledgers", () => ({
  listFieldReports: vi.fn(async () => [{ status: "Open" }, { status: "Filed" }]),
  listFieldInspections: vi.fn(async () => [{ status: "Flagged" }, { status: "Passed" }]),
  listFieldPermits: vi.fn(async () => [{ status: "Expiring" }]),
  listFieldShipments: vi.fn(async () => [
    { status: "En Route", dir: "in" },
    { status: "Delayed", dir: "out" },
    { status: "Arrived", dir: "in" },
  ]),
}));

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
    // With the flag off these must resolve to [] WITHOUT touching the resolver
    // or Supabase (so the test needs no DB/cookies).
    for (const hub of ["operations", "logistics", "projects", "equipment", "workforce", "unknown"]) {
      expect(await hubLandingMetrics(hub, session)).toEqual([]);
    }
  });

  it("operationsMetrics summarizes the real ledgers into 3 well-formed cells", async () => {
    const m = await operationsMetrics("org-1");
    expect(m).toHaveLength(3);
    // 1 Open report, 1 in-progress/flagged inspection, 1 expiring permit.
    expect(m.map((c) => c.v)).toEqual([1, 1, 1]);
    for (const cell of m) {
      expect(typeof cell.short).toBe("string");
      expect(typeof cell.v).toBe("number");
      expect(cell.v as number).toBeGreaterThanOrEqual(0);
      expect(TONES).toContain(cell.tone);
    }
  });

  it("logisticsMetrics summarizes the real shipments ledger into 3 well-formed cells", async () => {
    const m = await logisticsMetrics("org-1");
    expect(m.map((c) => c.short)).toEqual(["En Route", "Delayed", "Inbound"]);
    // 1 En Route, 1 Delayed, 2 Inbound.
    expect(m.map((c) => c.v)).toEqual([1, 1, 2]);
    for (const cell of m) {
      expect(typeof cell.v).toBe("number");
      expect(TONES).toContain(cell.tone);
    }
  });
});
