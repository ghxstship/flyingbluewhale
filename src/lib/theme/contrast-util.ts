/**
 * WCAG 1.4.3 contrast utilities for the ThemeStudio white-label editor (v7.7).
 *
 * Pure + isomorphic (no DOM / no server-only) so the live contrast guard runs in
 * the brand editor and the same `contrastRatio` can back a future CI guard on
 * org-authored palettes. Mirrors the math in `src/lib/theme/contrast.test.ts`.
 */

/** Parse "#RGB" or "#RRGGBB" → [r,g,b] 0–255, or null if malformed. */
export function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  const g = m?.[1];
  if (!g) return null;
  // Expand shorthand ("abc" → "aabbcc") without char indexing (strict index access).
  const full = g.length === 3 ? g.replace(/(.)/g, "$1$1") : g;
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}

/** sRGB → relative luminance per WCAG 2.x. */
export function relativeLuminance([r, g, b]: [number, number, number]): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Contrast ratio between two hex colors (1–21), or null if either is malformed. */
export function contrastRatio(a: string, b: string): number | null {
  const ca = parseHex(a);
  const cb = parseHex(b);
  if (!ca || !cb) return null;
  const la = relativeLuminance(ca);
  const lb = relativeLuminance(cb);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Black or white — whichever has the higher contrast against `bg`. */
export function bestInk(bg: string): "#000000" | "#FFFFFF" {
  const onBlack = contrastRatio(bg, "#000000") ?? 0;
  const onWhite = contrastRatio(bg, "#FFFFFF") ?? 0;
  return onWhite >= onBlack ? "#FFFFFF" : "#000000";
}

export type WcagLevel = "AAA" | "AA" | "AA Large" | "Fail";

/** Grade a ratio against the WCAG 1.4.3 thresholds (large text relaxes them). */
export function wcagLevel(ratio: number | null, large = false): WcagLevel {
  if (ratio == null) return "Fail";
  if (large) {
    if (ratio >= 4.5) return "AAA";
    if (ratio >= 3) return "AA";
    return "Fail";
  }
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA Large";
  return "Fail";
}
