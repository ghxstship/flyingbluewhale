/**
 * CHROMA BEACON theme registry.
 * Slugs are immutable — used verbatim in data-theme, localStorage, URLs.
 */

export type ThemeSlug =
  | "bermuda-triangle"
  | "glass"
  | "brutal"
  | "bento"
  | "kinetic"
  | "copilot"
  | "cyber"
  | "soft"
  | "earthy";

export type ThemeFamily = "light" | "dark" | "hybrid";

export interface ThemeRegistryEntry {
  slug: ThemeSlug;
  label: string;
  family: ThemeFamily;
  essence: string;
  /** Hex string for a swatch chip on the card (used when --accent is a gradient). */
  swatchColor: string;
}

export const THEMES: Record<ThemeSlug, ThemeRegistryEntry> = {
  "bermuda-triangle": {
    slug: "bermuda-triangle",
    label: "Bermuda Triangle",
    family: "light",
    essence: "Contemporary minimal pop art. Monochrome, structural, deliberate. Where competing aesthetics disappear.",
    swatchColor: "#0a0a0a",
  },
  glass: {
    slug: "glass",
    label: "Liquid Glass",
    family: "hybrid",
    essence: "Translucent, refractive, depth without weight.",
    swatchColor: "#b47cff",
  },
  brutal: {
    slug: "brutal",
    label: "Neo-Brutalism",
    family: "light",
    essence: "Thick borders, offset shadows, chunky pastels.",
    swatchColor: "#ff5ea1",
  },
  bento: {
    slug: "bento",
    label: "Bento Grid",
    family: "light",
    essence: "Modular rounded cards, clean hierarchy.",
    swatchColor: "#18a048",
  },
  kinetic: {
    slug: "kinetic",
    label: "Kinetic Type",
    family: "light",
    essence: "Editorial, serif-forward, type as protagonist.",
    swatchColor: "#cc3d10",
  },
  copilot: {
    slug: "copilot",
    label: "Copilot Quiet",
    family: "light",
    essence: "Editorial quiet, AI surfaces adjacent.",
    swatchColor: "#b47cff",
  },
  cyber: {
    slug: "cyber",
    label: "Cyber Neon",
    family: "dark",
    essence: "Deep blacks, electric neon, holographic.",
    swatchColor: "#ff0080",
  },
  soft: {
    slug: "soft",
    label: "Soft Tactile",
    family: "light",
    essence: "Pastel neumorphic, squishy, springy.",
    swatchColor: "#b490ff",
  },
  earthy: {
    slug: "earthy",
    label: "Earthy Organic",
    family: "light",
    essence: "Warm cream, forest, terracotta, sage.",
    swatchColor: "#4a6b3a",
  },
};

export const THEME_SLUGS = Object.keys(THEMES) as ThemeSlug[];

export function isValidThemeSlug(s: unknown): s is ThemeSlug {
  return typeof s === "string" && (THEME_SLUGS as string[]).includes(s);
}

/** Color scheme for `color-scheme` CSS property — used by native form controls + scrollbars.
 *  Defensive against unknown slugs (e.g., a stale cookie from a renamed
 *  theme like the old iron-atelier → bermuda-triangle migration). Falls
 *  back to the registry of the default theme. */
export function colorSchemeFor(slug: ThemeSlug): "light" | "dark" {
  const entry = THEMES[slug];
  if (!entry) return "light"; // unknown / stale slug — safe default
  if (entry.family === "dark") return "dark";
  if (slug === "glass") return "dark"; // glass is hybrid but tilts dark
  return "light";
}
