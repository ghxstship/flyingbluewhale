import { describe, expect, it } from "vitest";
import { geoKeyFor, normalisePhotoRefs, parsePhotoFixes, type PhotoFix } from "./photo-geo";

/**
 * Geotag contract guard.
 *
 * Every failure mode in this file is SILENT — a geotag never throws, it just
 * ends up attached to the wrong photo or quietly absent. On a safety record
 * that is worse than an error, because a coordinate on an incident report
 * gets believed. These tests pin the two properties that keep it honest:
 * fixes stay index-aligned with their files, and anything malformed degrades
 * to "no fix" rather than to a plausible-looking wrong one.
 */

const fix = (lat: number, lng: number): PhotoFix => ({
  lat,
  lng,
  accuracyM: 8,
  capturedAt: "2026-07-15T12:00:00.000Z",
});

describe("parsePhotoFixes", () => {
  it("round-trips what FileField serialises", () => {
    const fixes = [fix(25.79, -80.19), null, fix(25.8, -80.2)];
    expect(parsePhotoFixes(JSON.stringify(fixes), 3)).toEqual(fixes);
  });

  it("normalises to one entry per file, padding a short array", () => {
    // A short array is the dangerous case: without padding, index 2 would
    // read `undefined` and a caller could silently shift coordinates.
    const parsed = parsePhotoFixes(JSON.stringify([fix(1, 2)]), 3);
    expect(parsed).toHaveLength(3);
    expect(parsed[0]).toEqual(fix(1, 2));
    expect(parsed[1]).toBeNull();
    expect(parsed[2]).toBeNull();
  });

  it("truncates a long array rather than over-running the files", () => {
    const parsed = parsePhotoFixes(JSON.stringify([fix(1, 2), fix(3, 4), fix(5, 6)]), 2);
    expect(parsed).toHaveLength(2);
    expect(parsed[1]).toEqual(fix(3, 4));
  });

  it.each([
    ["absent", null],
    ["empty", ""],
    ["not json", "{{{"],
    ["not an array", JSON.stringify({ lat: 1, lng: 2 })],
  ])("degrades to no-fix when the payload is %s", (_label, raw) => {
    expect(parsePhotoFixes(raw, 2)).toEqual([null, null]);
  });

  it("rejects out-of-range coordinates instead of storing them", () => {
    // A swapped lat/lng (lng into lat) is the classic client bug. Storing it
    // renders a confident pin in the wrong hemisphere.
    expect(parsePhotoFixes(JSON.stringify([{ ...fix(0, 0), lat: 191 }]), 1)).toEqual([null]);
    expect(parsePhotoFixes(JSON.stringify([{ ...fix(0, 0), lng: -900 }]), 1)).toEqual([null]);
  });

  it("keeps a fix whose accuracy is missing rather than dropping the location", () => {
    const parsed = parsePhotoFixes(JSON.stringify([{ lat: 10, lng: 20, capturedAt: fix(0, 0).capturedAt }]), 1);
    expect(parsed[0]).toMatchObject({ lat: 10, lng: 20, accuracyM: null });
  });

  it("names the sibling key the FileField and the actions agree on", () => {
    expect(geoKeyFor("photo")).toBe("photo__geo");
  });
});

describe("normalisePhotoRefs", () => {
  it("reads the legacy bare-path shape the mobile actions used to write", () => {
    expect(normalisePhotoRefs(["org/user/a.jpg"])).toEqual([
      { path: "org/user/a.jpg", lat: null, lng: null, accuracyM: null, capturedAt: null },
    ]);
  });

  it("reads the {path, caption} shape the incidents API writes", () => {
    expect(normalisePhotoRefs([{ path: "p.jpg", caption: "Wet floor" }])).toEqual([
      { path: "p.jpg", lat: null, lng: null, accuracyM: null, capturedAt: null, caption: "Wet floor" },
    ]);
  });

  it("reads the current geotagged shape", () => {
    const ref = { path: "p.jpg", lat: 25.79, lng: -80.19, accuracyM: 8, capturedAt: "2026-07-15T12:00:00.000Z" };
    expect(normalisePhotoRefs([ref])).toEqual([ref]);
  });

  it("drops junk rather than rendering a broken tile", () => {
    expect(normalisePhotoRefs([null, 42, {}, { path: "" }, "ok.jpg"])).toEqual([
      { path: "ok.jpg", lat: null, lng: null, accuracyM: null, capturedAt: null },
    ]);
  });

  it("returns empty for a non-array column", () => {
    expect(normalisePhotoRefs(null)).toEqual([]);
    expect(normalisePhotoRefs({ path: "x" })).toEqual([]);
  });
});
