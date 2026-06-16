/**
 * Reports registry guard (kit v6.3). Pins the metric/report registry shape and
 * — critically — that every report references only real metric ids (a dangling
 * ref would render blank tiles), and every metric format is one the engine
 * formatter handles.
 */
import { describe, it, expect } from "vitest";
import {
  METRICS,
  REPORTS,
  REPORTS_LIST,
  METRIC_IDS,
  getReport,
  getMetric,
  formatMetricValue,
  type MetricFormat,
} from "./registry";

const FORMATS: MetricFormat[] = ["currency", "days", "float", "int", "pct", "ratio", "score"];

describe("reports registry", () => {
  it("loads 77 metrics and 43 reports", () => {
    expect(METRIC_IDS).toHaveLength(77);
    expect(REPORTS_LIST).toHaveLength(43);
  });

  it("every report references only real metric ids (no dangling)", () => {
    const dangling: string[] = [];
    for (const r of REPORTS_LIST) {
      expect(r.metrics.length, `${r.id} has metrics`).toBeGreaterThan(0);
      for (const m of r.metrics) if (!METRICS[m]) dangling.push(`${r.id} → ${m}`);
    }
    expect(dangling, `dangling metric refs: ${dangling.join(", ")}`).toEqual([]);
  });

  it("every metric has a known format + a label", () => {
    for (const [id, def] of Object.entries(METRICS)) {
      expect(FORMATS, `${id} format`).toContain(def.format);
      expect(def.label.length, `${id} label`).toBeGreaterThan(0);
    }
  });

  it("report ids round-trip + carry their id", () => {
    for (const [id, r] of Object.entries(REPORTS)) {
      expect(r.id).toBe(id);
      expect(getReport(id)).toBe(r);
    }
    expect(getReport("nope")).toBeUndefined();
    expect(getMetric("nope")).toBeUndefined();
  });

  it("8 turnkey templates + 35 preconfigured", () => {
    expect(REPORTS_LIST.filter((r) => r.status === "template")).toHaveLength(8);
    expect(REPORTS_LIST.filter((r) => r.status === "preconfigured")).toHaveLength(35);
  });

  it("formats values per type, and renders — for null", () => {
    expect(formatMetricValue(null, { format: "pct", unit: "%" })).toBe("—");
    expect(formatMetricValue(95, { format: "pct", unit: "%" })).toBe("95%");
    expect(formatMetricValue(1_500_000, { format: "currency", unit: "$" })).toBe("$1.5M");
    expect(formatMetricValue(12500, { format: "currency", unit: "$" })).toBe("$12.5K");
    expect(formatMetricValue(3.2, { format: "days", unit: "d" })).toBe("3.2d");
    expect(formatMetricValue(1.8, { format: "ratio", unit: "×" })).toBe("1.80×");
    expect(formatMetricValue(42, { format: "int", unit: "" })).toBe("42");
  });
});
