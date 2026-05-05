import { describe, it, expect } from "vitest";
import {
  computeGridBounds,
  findOpenSlot,
  findOverlap,
  isDashboardLayout,
  snapToGrid,
  snapWidget,
  type DashboardWidget,
} from "../dashboards/types";

// ──────────────────────────────────────────────────────────────────────
// snapToGrid — coords always snap to non-negative integers.
// ──────────────────────────────────────────────────────────────────────

describe("snapToGrid", () => {
  it("rounds fractional coords to the nearest integer", () => {
    expect(snapToGrid(2.4)).toBe(2);
    expect(snapToGrid(2.6)).toBe(3);
    expect(snapToGrid(2.5)).toBe(3);
  });

  it("clamps negatives to zero", () => {
    expect(snapToGrid(-1)).toBe(0);
    expect(snapToGrid(-0.4)).toBe(0);
  });

  it("returns zero for non-finite input", () => {
    expect(snapToGrid(NaN)).toBe(0);
    expect(snapToGrid(Infinity)).toBe(0);
    expect(snapToGrid(-Infinity)).toBe(0);
  });
});

// ──────────────────────────────────────────────────────────────────────
// snapWidget — clamps size to the type's minimum and the grid's column count.
// ──────────────────────────────────────────────────────────────────────

describe("snapWidget", () => {
  it("snaps fractional coords on the entire footprint", () => {
    const w: DashboardWidget = {
      id: "a",
      type: "kpi",
      x: 1.4,
      y: 2.6,
      w: 3.5,
      h: 2.2,
      label: "RFIs",
      value: 0,
    };
    const snapped = snapWidget(w);
    expect(snapped.x).toBe(1);
    expect(snapped.y).toBe(3);
    expect(snapped.w).toBe(4); // 3.5 → 4
    expect(snapped.h).toBe(2);
  });

  it("clamps width to the type-specific minimum", () => {
    // chart minimum is 3×3
    const w: DashboardWidget = {
      id: "c",
      type: "chart",
      x: 0,
      y: 0,
      w: 1,
      h: 1,
      chartConfig: { type: "bar", x: { field: "x" }, series: [{ field: "y" }] },
      dataQuery: { table: "rfis" },
    };
    const snapped = snapWidget(w);
    expect(snapped.w).toBeGreaterThanOrEqual(3);
    expect(snapped.h).toBeGreaterThanOrEqual(3);
  });

  it("clamps x so the widget never extends past the right edge", () => {
    const w: DashboardWidget = {
      id: "m",
      type: "markdown",
      x: 11,
      y: 0,
      w: 6,
      h: 3,
      content: "hi",
    };
    const snapped = snapWidget(w, 12);
    expect(snapped.x + snapped.w).toBeLessThanOrEqual(12);
  });
});

// ──────────────────────────────────────────────────────────────────────
// computeGridBounds — bounding box of every widget.
// ──────────────────────────────────────────────────────────────────────

describe("computeGridBounds", () => {
  it("returns 0×0 for an empty layout", () => {
    expect(computeGridBounds([])).toEqual({ rows: 0, cols: 0 });
  });

  it("returns the max extent across both axes", () => {
    const widgets: DashboardWidget[] = [
      { id: "a", type: "kpi", x: 0, y: 0, w: 3, h: 2, label: "A", value: 1 },
      { id: "b", type: "kpi", x: 6, y: 4, w: 3, h: 2, label: "B", value: 2 },
      { id: "c", type: "kpi", x: 9, y: 1, w: 2, h: 2, label: "C", value: 3 },
    ];
    expect(computeGridBounds(widgets)).toEqual({ rows: 6, cols: 11 });
  });
});

// ──────────────────────────────────────────────────────────────────────
// findOverlap — detects rectangle intersections in widget arrays.
// ──────────────────────────────────────────────────────────────────────

describe("findOverlap", () => {
  it("returns null for non-overlapping widgets", () => {
    const widgets: DashboardWidget[] = [
      { id: "a", type: "kpi", x: 0, y: 0, w: 3, h: 2, label: "A", value: 1 },
      { id: "b", type: "kpi", x: 3, y: 0, w: 3, h: 2, label: "B", value: 2 },
      { id: "c", type: "kpi", x: 0, y: 2, w: 6, h: 2, label: "C", value: 3 },
    ];
    expect(findOverlap(widgets)).toBeNull();
  });

  it("flags overlapping widgets and returns the offending pair", () => {
    const widgets: DashboardWidget[] = [
      { id: "a", type: "kpi", x: 0, y: 0, w: 4, h: 3, label: "A", value: 1 },
      { id: "b", type: "kpi", x: 2, y: 1, w: 4, h: 3, label: "B", value: 2 },
    ];
    const hit = findOverlap(widgets);
    expect(hit).not.toBeNull();
    if (hit) {
      const ids = [hit[0].id, hit[1].id].sort();
      expect(ids).toEqual(["a", "b"]);
    }
  });

  it("treats edge-touching widgets as non-overlapping", () => {
    const widgets: DashboardWidget[] = [
      { id: "a", type: "kpi", x: 0, y: 0, w: 3, h: 2, label: "A", value: 1 },
      { id: "b", type: "kpi", x: 3, y: 0, w: 3, h: 2, label: "B", value: 2 },
    ];
    expect(findOverlap(widgets)).toBeNull();
  });
});

// ──────────────────────────────────────────────────────────────────────
// findOpenSlot — picks an empty (x,y) for new widgets.
// ──────────────────────────────────────────────────────────────────────

describe("findOpenSlot", () => {
  it("returns (0,0) on an empty canvas", () => {
    expect(findOpenSlot([], { w: 3, h: 2 }, 12)).toEqual({ x: 0, y: 0 });
  });

  it("places a new widget to the right of an existing one when space allows", () => {
    const widgets: DashboardWidget[] = [{ id: "a", type: "kpi", x: 0, y: 0, w: 3, h: 2, label: "A", value: 1 }];
    const slot = findOpenSlot(widgets, { w: 3, h: 2 }, 12);
    expect(slot).toEqual({ x: 3, y: 0 });
  });

  it("respects the column count and wraps to a new row", () => {
    const widgets: DashboardWidget[] = [{ id: "a", type: "kpi", x: 0, y: 0, w: 12, h: 2, label: "A", value: 1 }];
    const slot = findOpenSlot(widgets, { w: 3, h: 2 }, 12);
    expect(slot.y).toBeGreaterThanOrEqual(2);
    expect(slot.x).toBe(0);
  });
});

// ──────────────────────────────────────────────────────────────────────
// isDashboardLayout — type guard for JSONB blobs loaded from the DB.
// ──────────────────────────────────────────────────────────────────────

describe("isDashboardLayout", () => {
  it("accepts a well-shaped layout", () => {
    expect(isDashboardLayout({ cols: 12, gap: 16, widgets: [] })).toBe(true);
  });

  it("rejects null, primitives, and arrays", () => {
    expect(isDashboardLayout(null)).toBe(false);
    expect(isDashboardLayout("layout")).toBe(false);
    expect(isDashboardLayout([])).toBe(false);
    expect(isDashboardLayout(42)).toBe(false);
  });

  it("rejects partial / wrong-typed shapes", () => {
    expect(isDashboardLayout({ cols: 12, gap: 16 })).toBe(false);
    expect(isDashboardLayout({ cols: "12", gap: 16, widgets: [] })).toBe(false);
    expect(isDashboardLayout({ cols: 12, gap: 16, widgets: "no" })).toBe(false);
  });
});
