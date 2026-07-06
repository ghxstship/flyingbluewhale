import { describe, expect, it } from "vitest";
import { statSync } from "node:fs";
import { join } from "node:path";

/**
 * Brand-asset + governance-doc presence guard (REPO_PARITY_HANDOFF_2 §3).
 *
 * The kit ⇄ repo mirror is bidirectional. `src/lib/theme/kit-mirror.test.ts`
 * pins the drifting *token values* (repo → kit direction). The 2026-07-06
 * re-audit found the drift had flipped: the kit was missing the repo's brand
 * visual library + governance docs. This guard closes the loop from the other
 * side — it fails CI if any canonical brand artifact or governance doc is
 * removed or emptied, symmetric with the token guard. Both sides now carry the
 * same set, so parity is verifiable from either end.
 */
const ROOT = process.cwd();

/** Every path here must exist and be non-empty. Repo-relative. */
const CANONICAL_ARTIFACTS = [
  // Brand visual library — tiling patterns.
  "public/brand/patterns/grid.svg",
  "public/brand/patterns/dots.svg",
  "public/brand/patterns/diagonal.svg",
  // Brand visual library — geometric spot art.
  "public/brand/spot/waypoint.svg",
  "public/brand/spot/signal.svg",
  "public/brand/spot/build.svg",
  // Brand-asset index.
  "public/brand/README.md",
  // Governance docs — cross-product brand guidance (docs/brand).
  "docs/brand/voice.md",
  "docs/brand/GLOSSARY.md",
  "docs/brand/MICROCOPY.md",
  "docs/brand/PHOTOGRAPHY.md",
  "docs/brand/CLEARSPACE.md",
  // Governance docs — design-system home.
  "docs/design-system/DO-DONT.md",
  "docs/design-system/INVENTORY.md",
] as const;

describe("brand-asset + governance-doc presence (kit ⇄ repo reverse-gap guard)", () => {
  it.each(CANONICAL_ARTIFACTS)("%s exists and is non-empty", (rel) => {
    let stat;
    try {
      stat = statSync(join(ROOT, rel));
    } catch {
      throw new Error(`Canonical brand artifact missing: ${rel}`);
    }
    expect(stat.isFile(), `${rel} is not a file`).toBe(true);
    expect(stat.size, `${rel} is empty`).toBeGreaterThan(0);
  });
});
