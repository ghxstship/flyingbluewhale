/**
 * CHROMA BEACON theme registry.
 *
 * Per the v3 GHXSTSHIP design handoff (design_handoff/README.md
 * "Two kits — same logo, two skins"), the canonical brand carries
 * exactly two theme slugs:
 *
 *   - `ghxstship`     — cosmic pop-art, marketing only
 *   - `atlvs-product` — neutral SaaS, light/dark + per-product accent
 *
 * The legacy CHROMA exploration set (bermuda-triangle, glass, brutal,
 * bento, kinetic, copilot, cyber, soft, earthy) was purged in the v3
 * sweep — those skins are not part of the production brand canon.
 *
 * Slugs are immutable — used verbatim in data-theme, localStorage,
 * URLs, and the user_preferences_theme_check Postgres CHECK constraint.
 */

export type ThemeSlug = "ghxstship" | "atlvs-product";

export type ThemeFamily = "light" | "dark";

export interface ThemeRegistryEntry {
  slug: ThemeSlug;
  label: string;
  family: ThemeFamily;
  essence: string;
  /** Hex string for a swatch chip on the card (used when --accent is a gradient). */
  swatchColor: string;
}

export const THEMES: Record<ThemeSlug, ThemeRegistryEntry> = {
  ghxstship: {
    slug: "ghxstship",
    label: "Deep Space Voyage",
    family: "dark",
    essence:
      "Retro-futurist nautical pop art. Cosmic ink ground, brass doubloon accent, nebula + plasma signals, halftone dots, hard-offset shadows. Marketing surfaces only.",
    swatchColor: "#e9a23b",
  },
  "atlvs-product": {
    slug: "atlvs-product",
    label: "ATLVS Product",
    family: "light",
    essence:
      "Neutral SaaS skin for the ATLVS · COMPVSS · GVTEWAY apps. Clean light/dark canvas, soft shadows, per-product accent (pink/amber/cyan). Asana/ClickUp ergonomic register — distinct from the cosmic marketing brand.",
    swatchColor: "#ff2e88",
  },
};

export const THEME_SLUGS = Object.keys(THEMES) as ThemeSlug[];

export function isValidThemeSlug(s: unknown): s is ThemeSlug {
  return typeof s === "string" && (THEME_SLUGS as string[]).includes(s);
}

/** Color scheme for `color-scheme` CSS property — used by native form controls + scrollbars.
 *  Defensive against unknown slugs (e.g., a stale cookie from a purged theme like the
 *  pre-v3 bermuda-triangle/cyber/glass set). Falls back to the dark default. */
export function colorSchemeFor(slug: ThemeSlug): "light" | "dark" {
  const entry = THEMES[slug];
  if (!entry) return "dark"; // unknown / stale slug — safe default (ghxstship is dark)
  return entry.family;
}
