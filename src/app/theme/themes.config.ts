/**
 * ATLVS Technologies — theme registry.
 *
 * One canonical skin: the ATLVS SaaS kit (design_handoff_atlvs_kit). The
 * pre-kit cosmic GHXSTSHIP skin and the earlier CHROMA exploration set
 * (bermuda-triangle, glass, brutal, bento, kinetic, copilot, cyber, soft,
 * earthy) were retired in this refactor — the kit's neutral light/dark
 * surfaces + per-product accent (atlvs/compvss/gvteway) now drive every
 * shell across the platform.
 *
 * Slug is immutable — used verbatim in `data-theme`, localStorage, URLs,
 * and the `user_preferences_theme_check` Postgres CHECK constraint.
 */

export type ThemeSlug = "atlvs-product";

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
  "atlvs-product": {
    slug: "atlvs-product",
    label: "ATLVS",
    family: "light",
    essence:
      "Neutral SaaS skin for ATLVS · COMPVSS · GVTEWAY. Clean light/dark canvas, soft elevation, per-product accent (pink/amber/cyan). Title Case, Space Grotesk, Asana/Linear-adjacent ergonomic register.",
    swatchColor: "#ff2e88",
  },
};

export const THEME_SLUGS = Object.keys(THEMES) as ThemeSlug[];

export function isValidThemeSlug(s: unknown): s is ThemeSlug {
  return typeof s === "string" && (THEME_SLUGS as string[]).includes(s);
}

/** Color scheme for `color-scheme` CSS property — used by native form controls + scrollbars.
 *  Defensive against unknown slugs (e.g., a stale cookie from a purged theme).
 *  Falls back to the kit's light default. */
export function colorSchemeFor(slug: ThemeSlug): "light" | "dark" {
  const entry = THEMES[slug];
  if (!entry) return "light";
  return entry.family;
}
