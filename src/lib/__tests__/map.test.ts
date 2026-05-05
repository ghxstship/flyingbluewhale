import { describe, it, expect } from "vitest";
import { bounds, clusterMarkers, markerColor } from "../views/map";

describe("bounds", () => {
  it("returns a sensible default for an empty list", () => {
    const b = bounds([]);
    expect(b).toEqual([
      [-180, -85],
      [180, 85],
    ]);
  });

  it("returns the same point on both corners for a single marker", () => {
    const b = bounds([{ lat: 40.7128, lng: -74.006 }]);
    expect(b).toEqual([
      [-74.006, 40.7128],
      [-74.006, 40.7128],
    ]);
  });

  it("envelopes multiple markers", () => {
    const b = bounds([
      { lat: 40.7128, lng: -74.006 }, // NYC
      { lat: 25.7617, lng: -80.1918 }, // Miami
      { lat: 34.0522, lng: -118.2437 }, // LA
    ]);
    expect(b).toEqual([
      [-118.2437, 25.7617],
      [-74.006, 40.7128],
    ]);
  });

  it("ignores non-finite coordinates", () => {
    const b = bounds([
      { lat: Number.NaN, lng: Number.NaN },
      { lat: 1, lng: 2 },
    ]);
    expect(b).toEqual([
      [2, 1],
      [2, 1],
    ]);
  });
});

describe("clusterMarkers", () => {
  it("returns an empty list for no markers", () => {
    expect(clusterMarkers([], 0.5)).toEqual([]);
  });

  it("collapses two close markers into one cluster of count 2", () => {
    const clusters = clusterMarkers(
      [
        { id: "a", lat: 40.7128, lng: -74.006 },
        { id: "b", lat: 40.7129, lng: -74.0061 },
      ],
      0.5,
    );
    expect(clusters).toHaveLength(1);
    expect(clusters[0]?.count).toBe(2);
    expect(clusters[0]?.ids.sort()).toEqual(["a", "b"]);
  });

  it("keeps two far-apart markers as two singleton clusters", () => {
    const clusters = clusterMarkers(
      [
        { id: "a", lat: 40.7128, lng: -74.006 }, // NYC
        { id: "b", lat: 34.0522, lng: -118.2437 }, // LA
      ],
      0.5,
    );
    expect(clusters).toHaveLength(2);
    expect(clusters.every((c) => c.count === 1)).toBe(true);
  });

  it("groups three markers into two buckets when one is far away", () => {
    const clusters = clusterMarkers(
      [
        { id: "a", lat: 40.7128, lng: -74.006 },
        { id: "b", lat: 40.7138, lng: -74.0065 },
        { id: "c", lat: 34.0522, lng: -118.2437 },
      ],
      0.5,
    );
    expect(clusters).toHaveLength(2);
    const counts = clusters.map((c) => c.count).sort();
    expect(counts).toEqual([1, 2]);
  });

  it("uses a fallback grid size when threshold is 0 or negative", () => {
    const clusters = clusterMarkers(
      [
        { id: "a", lat: 40.7128, lng: -74.006 },
        { id: "b", lat: 40.7129, lng: -74.0061 },
      ],
      0,
    );
    expect(clusters).toHaveLength(1);
    expect(clusters[0]?.count).toBe(2);
  });

  it("centroid is the mean of clustered points", () => {
    const clusters = clusterMarkers(
      [
        { id: "a", lat: 40.1, lng: -74.1 },
        { id: "b", lat: 40.3, lng: -74.3 },
      ],
      1,
    );
    expect(clusters).toHaveLength(1);
    expect(clusters[0]?.lat).toBeCloseTo(40.2, 5);
    expect(clusters[0]?.lng).toBeCloseTo(-74.2, 5);
  });
});

describe("markerColor", () => {
  it("maps known tones to CSS variable references", () => {
    expect(markerColor("info")).toBe("var(--color-info)");
    expect(markerColor("warn")).toBe("var(--color-warning)");
    expect(markerColor("error")).toBe("var(--color-error)");
    expect(markerColor("success")).toBe("var(--color-success)");
    expect(markerColor("accent")).toBe("var(--accent)");
    expect(markerColor("neutral")).toBe("var(--text-muted)");
  });

  it("falls back to the org primary for unknown / undefined tones", () => {
    expect(markerColor(undefined)).toContain("--org-primary");
    expect(markerColor("zoinks")).toContain("--org-primary");
  });
});
