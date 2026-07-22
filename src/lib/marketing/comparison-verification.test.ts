import { describe, expect, it } from "vitest";
import { COMPARE_LIST, compareCategory } from "@/lib/compare";

/**
 * Comparison-page honesty guard (marketing rebuild plan §6).
 *
 * The comparison program is "unbiased by construction": every claim about a
 * competitor derives from their public pages, and every page says when it was
 * last checked. This guard makes that mechanical:
 *
 *  1. Any entry carrying `lastVerified` must have been verified within 180
 *     days — stale pages fail CI rather than quietly rotting into libel.
 *  2. Every entry in a NEW category (anything except the legacy production
 *     roster) must carry BOTH `lastVerified` and at least one source URL.
 *  3. The legacy production roster predates the discipline and backfills in
 *     P4 — its count is pinned here so new entries can't hide in the
 *     grandfather clause. Shrink the pin as entries are backfilled; never
 *     grow it.
 */
const STALE_DAYS = 180;
const LEGACY_UNVERIFIED_PIN = 24;

describe("comparison verification discipline", () => {
  const dated = COMPARE_LIST.filter((c) => c.lastVerified);

  it("every lastVerified entry has been checked within 180 days", () => {
    const now = Date.now();
    const stale = dated.filter(
      (c) => now - new Date(`${c.lastVerified}T00:00:00Z`).getTime() > STALE_DAYS * 24 * 60 * 60 * 1000,
    );
    expect(
      stale.map((c) => `${c.slug} (${c.lastVerified})`),
      "Re-verify these comparison pages against the competitor's public docs and bump lastVerified",
    ).toEqual([]);
  });

  it("every dated entry carries at least one public source URL", () => {
    const missing = dated.filter((c) => !c.sources || c.sources.length === 0);
    expect(missing.map((c) => c.slug)).toEqual([]);
  });

  it("every non-legacy-category entry carries the full discipline", () => {
    const undisciplined = COMPARE_LIST.filter(
      (c) => compareCategory(c) !== "production" && (!c.lastVerified || !c.sources?.length),
    );
    expect(
      undisciplined.map((c) => c.slug),
      "New-category comparison entries must ship with lastVerified + sources",
    ).toEqual([]);
  });

  it("sources are https URLs on the competitor's own or a public domain", () => {
    for (const c of dated) {
      for (const src of c.sources ?? []) {
        expect(src, `${c.slug} source "${src}" must be an https URL`).toMatch(/^https:\/\//);
      }
    }
  });

  it("the unverified legacy roster only shrinks (P4 backfills it)", () => {
    const unverified = COMPARE_LIST.filter((c) => !c.lastVerified);
    expect(
      unverified.length,
      `Unverified entries grew past the pinned legacy count (${LEGACY_UNVERIFIED_PIN}). ` +
        "New comparison entries must ship with lastVerified + sources; if you backfilled " +
        "a legacy entry, shrink the pin.",
    ).toBeLessThanOrEqual(LEGACY_UNVERIFIED_PIN);
  });
});
