/**
 * H2-09 / IK-057 — feature flag hygiene guard.
 *
 * Every flag declared in `FLAG_DEFAULTS` MUST appear in `FLAG_REGISTRY` with:
 *   - a non-empty `owner`
 *   - a non-empty `description`
 *   - an `expiresAt` ISO date that parses and is in the future
 *
 * A flag that trips any of these rules fails the build — forcing either a
 * removal or an explicit extension on every push. Prevents the usual
 * zombie-flag problem where code branches linger for years after a rollout.
 */
import { describe, it, expect } from "vitest";
import { FLAG_DEFAULTS, FLAG_REGISTRY } from "./flags";

describe("flag registry hygiene", () => {
  it("every flag in FLAG_DEFAULTS has a registry entry", () => {
    const missing = (Object.keys(FLAG_DEFAULTS) as Array<keyof typeof FLAG_DEFAULTS>).filter(
      (key) => !FLAG_REGISTRY[key],
    );
    expect(missing, `Flags missing metadata: ${missing.join(", ")}`).toEqual([]);
  });

  it("every registry entry has owner + description + expiresAt", () => {
    const incomplete: string[] = [];
    for (const [key, meta] of Object.entries(FLAG_REGISTRY)) {
      if (!meta.owner || !meta.description || !meta.expiresAt) {
        incomplete.push(key);
      }
    }
    expect(incomplete).toEqual([]);
  });

  it("every expiresAt is a valid future ISO date", () => {
    const now = Date.now();
    const expired: string[] = [];
    const invalid: string[] = [];
    for (const [key, meta] of Object.entries(FLAG_REGISTRY)) {
      const t = Date.parse(meta.expiresAt);
      if (Number.isNaN(t)) {
        invalid.push(key);
        continue;
      }
      if (t < now) expired.push(`${key} (${meta.expiresAt})`);
    }
    expect(invalid, `Invalid expiresAt on: ${invalid.join(", ")}`).toEqual([]);
    expect(
      expired,
      `Past-due flags — remove or extend: ${expired.join(", ")}`,
    ).toEqual([]);
  });

  it("registry has no orphans (entry without a corresponding default)", () => {
    const knownKeys = new Set(Object.keys(FLAG_DEFAULTS));
    const orphans = Object.keys(FLAG_REGISTRY).filter((k) => !knownKeys.has(k));
    expect(orphans, `Registry orphans: ${orphans.join(", ")}`).toEqual([]);
  });
});
