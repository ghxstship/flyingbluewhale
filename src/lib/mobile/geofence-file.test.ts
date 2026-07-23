import { describe, expect, it } from "vitest";
import {
  candidateProjects,
  matchGeofences,
  MAX_ACCURACY_SLOP_M,
  resolveCapture,
  type CaptureFence,
} from "./geofence-file";

/**
 * Pure-math tests for the venue-geofence capture resolver (T1-5).
 * Distances ride the shared `metersBetween` haversine (workforce.ts), so
 * these fixtures use real coordinates with known separations: at the
 * equator, 0.001° of latitude ≈ 111.3 m.
 */

const fence = (over: Partial<CaptureFence>): CaptureFence => ({
  id: "f1",
  label: "Main Gate",
  locationId: "loc-1",
  centerLat: 0,
  centerLng: 0,
  radiusM: 250,
  projects: [{ id: "p1", name: "MMW26" }],
  ...over,
});

describe("matchGeofences", () => {
  it("matches a fix inside the radius and reports the distance", () => {
    const matches = matchGeofences({ lat: 0.001, lng: 0 }, [fence({})]);
    expect(matches).toHaveLength(1);
    expect(matches[0]?.fence.id).toBe("f1");
    expect(matches[0]?.distanceM).toBeGreaterThan(105);
    expect(matches[0]?.distanceM).toBeLessThan(118);
  });

  it("rejects a fix outside the radius", () => {
    // ~333 m out on a 250 m circle.
    expect(matchGeofences({ lat: 0.003, lng: 0 }, [fence({})])).toHaveLength(0);
  });

  it("sorts multiple containing fences nearest-first", () => {
    const near = fence({ id: "near", centerLat: 0.0005, radiusM: 500 });
    const far = fence({ id: "far", centerLat: 0.002, radiusM: 500 });
    const matches = matchGeofences({ lat: 0, lng: 0 }, [far, near]);
    expect(matches.map((m) => m.fence.id)).toEqual(["near", "far"]);
  });

  it("extends containment by the fix accuracy (a plausible-inside fix matches)", () => {
    // ~333 m from centre, 250 m circle: outside dry, inside with a 100 m fix.
    const pos = { lat: 0.003, lng: 0 };
    expect(matchGeofences(pos, [fence({})])).toHaveLength(0);
    expect(matchGeofences({ ...pos, accuracyM: 100 }, [fence({})])).toHaveLength(1);
  });

  it("caps accuracy slop so a tower-triangulated fix cannot match the whole city", () => {
    // ~1.1 km out; a claimed 5 km accuracy must NOT pull it inside.
    const pos = { lat: 0.01, lng: 0, accuracyM: 5000 };
    expect(MAX_ACCURACY_SLOP_M).toBeLessThan(1000);
    expect(matchGeofences(pos, [fence({})])).toHaveLength(0);
  });

  it("returns no matches for a null position or negative accuracy junk", () => {
    expect(matchGeofences(null, [fence({})])).toEqual([]);
    const matches = matchGeofences({ lat: 0.003, lng: 0, accuracyM: -50 }, [fence({})]);
    expect(matches).toHaveLength(0);
  });
});

describe("candidateProjects", () => {
  it("dedupes the same project across overlapping fences, keeping nearest-first order", () => {
    const a = fence({ id: "a", projects: [{ id: "p1", name: "MMW26" }] });
    const b = fence({
      id: "b",
      centerLat: 0.0005,
      projects: [
        { id: "p1", name: "MMW26" },
        { id: "p2", name: "EDCLV26" },
      ],
    });
    const matches = matchGeofences({ lat: 0, lng: 0 }, [b, a]);
    expect(candidateProjects(matches).map((p) => p.id)).toEqual(["p1", "p2"]);
  });
});

describe("resolveCapture", () => {
  it("auto-files on exactly one candidate project", () => {
    const r = resolveCapture({ lat: 0, lng: 0 }, [fence({})]);
    expect(r.kind).toBe("auto");
    if (r.kind === "auto") {
      expect(r.project.id).toBe("p1");
      expect(r.locationId).toBe("loc-1");
      expect(r.fence.id).toBe("f1");
    }
  });

  it("auto-files when two fences agree on the project", () => {
    const a = fence({ id: "a" });
    const b = fence({ id: "b", centerLat: 0.0005 });
    const r = resolveCapture({ lat: 0, lng: 0 }, [a, b]);
    expect(r.kind).toBe("auto");
  });

  it("goes ambiguous on two distinct candidate projects", () => {
    const a = fence({ id: "a", projects: [{ id: "p1", name: "MMW26" }] });
    const b = fence({ id: "b", locationId: "loc-2", projects: [{ id: "p2", name: "EDCLV26" }] });
    const r = resolveCapture({ lat: 0, lng: 0 }, [a, b]);
    expect(r.kind).toBe("ambiguous");
    if (r.kind === "ambiguous") expect(r.projects.map((p) => p.id)).toEqual(["p1", "p2"]);
  });

  it("resolves the winning fence for the chip when the nearest fence has no project", () => {
    // Nearest circle is a bare fence (no linked project); the project comes
    // from the second circle — the chip must name THAT fence, not the bare one.
    const bare = fence({ id: "bare", centerLat: 0.0001, projects: [] });
    const linked = fence({ id: "linked", locationId: "loc-9", centerLat: 0.0008 });
    const r = resolveCapture({ lat: 0, lng: 0 }, [bare, linked]);
    expect(r.kind).toBe("auto");
    if (r.kind === "auto") {
      expect(r.fence.id).toBe("linked");
      expect(r.locationId).toBe("loc-9");
    }
  });

  it("falls back to manual on no fix, no fences, or projectless fences", () => {
    expect(resolveCapture(null, [fence({})]).kind).toBe("none");
    expect(resolveCapture({ lat: 0, lng: 0 }, []).kind).toBe("none");
    expect(resolveCapture({ lat: 0, lng: 0 }, [fence({ projects: [] })]).kind).toBe("none");
  });
});
