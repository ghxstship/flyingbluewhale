/**
 * resolveThemeColor — bridge between the CSS custom-property theme layer and
 * canvas-painting consumers that cannot evaluate `var()` at paint time
 * (maplibre-gl `line-color`, canvas 2D fills). Call it from client code at
 * paint/init time (inside an effect); the returned color is a concrete sRGB
 * string that tracks the live theme/mode at the moment of resolution.
 *
 * Resolution path:
 *   1. A probe element attached to <html> inherits the document's theme
 *      scope (`data-mode`, `data-product`, `color-scheme`), so `var()`,
 *      `light-dark()` and OKLCH values all resolve exactly as the UI does.
 *   2. The computed color is normalized through a 1×1 canvas so wide-gamut
 *      OKLCH serializations become plain `rgb()`/`rgba()` strings that any
 *      canvas consumer (maplibre's color parser included) accepts.
 *
 * GH-1 sanction (design-system.test.ts ALLOW roster): the literal fallbacks
 * below are the ONLY raw hexes this layer may carry. They cover SSR and the
 * pre-hydration/failure frame only, and mirror tokens.json#color.semantic +
 * surface (sRGB reference mirror) — update them ONLY when tokens.json moves.
 */

const TOKEN_FALLBACKS: Record<string, string> = {
  "--p-info": "#2596C4",
  "--p-success": "#2FA968",
  "--p-warning": "#C8841A",
  "--p-danger": "#E5484D",
  "--p-accent": "#E23414",
  "--p-text-2": "#4A5563",
};

/** Last-resort neutral (tokens.json#color.neutral.light.500). */
const NEUTRAL_FALLBACK = "#8B94A3";

/** Extract the first custom-property name from a `var(--x)` expression. */
function tokenNameOf(cssColor: string): string | null {
  const m = /var\(\s*(--[\w-]+)/.exec(cssColor);
  return m ? m[1]! : null;
}

function literalFallback(cssColor: string, fallback?: string): string {
  if (fallback) return fallback;
  const token = tokenNameOf(cssColor);
  if (token) return TOKEN_FALLBACKS[token] ?? NEUTRAL_FALLBACK;
  // Input was already a concrete color — hand it back untouched.
  return cssColor;
}

let sharedCtx: CanvasRenderingContext2D | null | undefined;

/**
 * Normalize any computed CSS color serialization (`oklch(…)`, `color(…)`,
 * `rgb(…)`) to a legacy `rgb()`/`rgba()` string via a 1×1 canvas readback.
 */
function normalizeToRgb(css: string): string | null {
  if (css.startsWith("rgb")) return css;
  if (sharedCtx === undefined) {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    sharedCtx = canvas.getContext("2d", { willReadFrequently: true });
  }
  const ctx = sharedCtx;
  if (!ctx) return null;
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = css;
  ctx.fillRect(0, 0, 1, 1);
  const px = ctx.getImageData(0, 0, 1, 1).data;
  const r = px[0] ?? 0;
  const g = px[1] ?? 0;
  const b = px[2] ?? 0;
  const a = px[3] ?? 0;
  if (a === 0) return null; // parse failure — nothing was painted
  return a >= 255 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${(a / 255).toFixed(3)})`;
}

/**
 * Resolve a CSS color expression (typically `var(--p-*)`) to a concrete
 * `rgb()`/`rgba()` string under the CURRENT document theme. Safe to call
 * during SSR — returns the annotated literal fallback there.
 */
export function resolveThemeColor(cssColor: string, fallback?: string): string {
  if (typeof document === "undefined" || typeof getComputedStyle === "undefined") {
    return literalFallback(cssColor, fallback);
  }
  try {
    const probe = document.createElement("span");
    probe.style.display = "none";
    probe.style.color = cssColor;
    document.documentElement.appendChild(probe);
    const computed = getComputedStyle(probe).color;
    probe.remove();
    if (!computed) return literalFallback(cssColor, fallback);
    return normalizeToRgb(computed) ?? literalFallback(cssColor, fallback);
  } catch {
    return literalFallback(cssColor, fallback);
  }
}
