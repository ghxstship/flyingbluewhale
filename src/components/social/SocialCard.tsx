/**
 * SocialCard — the parametric building block for every kit share image.
 *
 * RENDERS VIA `next/og` `ImageResponse` (satori), NOT the browser DOM.
 * That has hard consequences this file is written around:
 *
 *   1. No CSS variables. satori cannot resolve `var(--p-accent)` or any
 *      token from `atlvs-product.css`. Every color MUST be a literal hex.
 *      All hexes are centralized in the `PALETTE` const below — a frozen
 *      mirror of `src/app/theme/tokens.json` (neutral ramp + surface) and
 *      `src/lib/brand.ts#PRODUCT_ACCENTS` (the four product accents, whose
 *      canonical owner is `brand.ts` — we re-export, never re-author them).
 *
 *   2. No external stylesheet / className styling — satori reads inline
 *      `style` only. Fonts are referenced by family name; the route that
 *      mounts the card is responsible for registering font data (Anton /
 *      Hanken Grotesk / Space Mono) on the `ImageResponse({ fonts })`
 *      call, exactly as the repo's existing OG routes do. Absent that,
 *      satori falls back to its bundled face — layout still holds.
 *
 *   3. Every element that contains children is given `display: "flex"`
 *      (satori requires an explicit display on multi-child nodes).
 *
 * The component returns plain JSX (a satori-compatible element tree). It is
 * a pure function of its props — no hooks, no client state — so it is safe
 * to call from a route handler / RSC.
 */
import type { CSSProperties, ReactNode } from "react";
import { PRODUCT_ACCENTS, type ProductAccentKey } from "@/lib/brand";
import { formatSize, type SocialFormat } from "./formats";

/**
 * PALETTE — the literal-hex SSOT for ImageResponse rendering.
 *
 * KEEP IN LOCKSTEP WITH `src/app/theme/tokens.json`:
 *   - `accent.*`  ← `src/lib/brand.ts#PRODUCT_ACCENTS` (which itself mirrors
 *                   tokens.json `products.*.accent`). Re-exported, not forked.
 *   - `ink` / `ink2` / `ink3` ← tokens.json `surface.light.text-{1,2,3}`.
 *   - `canvas` / `surface` / `border` ← tokens.json `surface.light.{bg,surface,border}`.
 *   - `house`     ← the GHXSTSHIP house/marketing default accent = ATLVS red.
 *   - `onAccent`  ← `surface.light.accent-contrast` (#FFFFFF).
 *
 * ImageResponse cannot read CSS vars, so these literals are the only way the
 * brand palette reaches the rendered PNG. This is the documented escape hatch.
 */
export const PALETTE = {
  accent: {
    atlvs: PRODUCT_ACCENTS.atlvs, // #E23414 volcanic red
    compvss: PRODUCT_ACCENTS.compvss, // #FFC400 signal yellow
    gvteway: PRODUCT_ACCENTS.gvteway, // #2563EB blue
    legend: PRODUCT_ACCENTS.legend, // #ED6A1E molten orange
  },
  /** House / non-product marketing default — ATLVS volcanic red. */
  house: PRODUCT_ACCENTS.atlvs,
  /** Neutral ramp (tokens.json surface.light). */
  ink: "#181B23", // text-1
  ink2: "#4A5563", // text-2
  ink3: "#656D7A", // text-3
  canvas: "#F7F8FA", // bg
  surface: "#FFFFFF", // surface
  border: "#E4E7EC", // border
  onAccent: "#FFFFFF", // accent-contrast
  /** Bright accents (yellow/orange) need an ink foreground for AA on-fill. */
  inkOnBright: "#181B23",
} as const;

/**
 * Bright accents read poorly with white text on top. When a card paints a
 * filled accent surface, pick the AA-safe foreground per accent.
 */
const BRIGHT_ACCENTS = new Set<string>([PALETTE.accent.compvss, PALETTE.accent.legend]);
function onAccentInk(accent: string): string {
  return BRIGHT_ACCENTS.has(accent) ? PALETTE.inkOnBright : PALETTE.onAccent;
}

/** Font family stacks — satori resolves the first registered family. */
const FONT = {
  display: "Anton, 'Arial Narrow', 'Hanken Grotesk', system-ui, sans-serif",
  body: "'Hanken Grotesk', system-ui, -apple-system, sans-serif",
  mono: "'Space Mono', ui-monospace, 'SF Mono', monospace",
} as const;

/** Per-format type scale + padding, tuned so each canvas reads at a glance. */
function scaleFor(format: SocialFormat) {
  switch (format) {
    case "story":
      return { pad: 96, eyebrow: 30, title: 132, subtitle: 40, footer: 26, rule: 12, gap: 28 };
    case "square":
      return { pad: 88, eyebrow: 28, title: 116, subtitle: 38, footer: 24, rule: 10, gap: 24 };
    case "wide":
      return { pad: 64, eyebrow: 22, title: 78, subtitle: 28, footer: 20, rule: 8, gap: 16 };
    case "og":
    default:
      return { pad: 80, eyebrow: 24, title: 92, subtitle: 34, footer: 22, rule: 8, gap: 20 };
  }
}

export interface SocialCardProps {
  /** Output dimensions — drives the type scale + padding. */
  format: SocialFormat;
  /** Product accent owner; omit / "house" → ATLVS-red house accent. */
  product?: ProductAccentKey | "house";
  /** Small tracked overline (Space Mono). Defaults to "ATLVS Technologies". */
  eyebrow?: string;
  /** The headline (Anton, all-caps). Required. */
  title: string;
  /** Optional supporting line (Hanken). */
  subtitle?: string;
  /** Optional footer string; defaults to the apex domain. */
  footer?: string;
  /** Override the resolved accent hex (escape hatch for one-offs). */
  accent?: string;
  /**
   * Paint style:
   *   - "canvas" (default) — neutral canvas, accent rule + accent eyebrow.
   *   - "accent" — full accent flood with AA-safe foreground (bold launches).
   */
  variant?: "canvas" | "accent";
  /** Optional extra node rendered in the body (e.g. a stat block). */
  children?: ReactNode;
}

/** Resolve the working accent hex from product / explicit override. */
export function resolveAccent(product: SocialCardProps["product"], explicit?: string): string {
  if (explicit) return explicit;
  if (!product || product === "house") return PALETTE.house;
  return PALETTE.accent[product];
}

/**
 * The spaced ATLVS brand mark. Literal spaces match the `A T L V S`
 * treatment; this is a visual lockup only (no aria in a raster image).
 */
const ATLVS_MARK = "A T L V S";

export function SocialCard(props: SocialCardProps) {
  const {
    format,
    product = "house",
    eyebrow = "ATLVS Technologies",
    title,
    subtitle,
    footer = "atlvs.pro",
    accent: accentOverride,
    variant = "canvas",
    children,
  } = props;

  const { w, h } = formatSize(format);
  const s = scaleFor(format);
  const accent = resolveAccent(product, accentOverride);
  const flooded = variant === "accent";

  const bg = flooded ? accent : PALETTE.canvas;
  const fg = flooded ? onAccentInk(accent) : PALETTE.ink;
  const muted = flooded ? onAccentInk(accent) : PALETTE.ink2;
  const eyebrowColor = flooded ? onAccentInk(accent) : accent;

  const root: CSSProperties = {
    width: w,
    height: h,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    background: bg,
    color: fg,
    padding: s.pad,
    position: "relative",
    fontFamily: FONT.body,
  };

  return (
    <div style={root}>
      {/* Top accent rule (canvas variant only — the flood IS the accent). */}
      {!flooded && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: s.rule,
            background: accent,
            display: "flex",
          }}
        />
      )}

      {/* Header: eyebrow */}
      <div style={{ display: "flex", flexDirection: "column", gap: s.gap }}>
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: s.eyebrow,
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: eyebrowColor,
            display: "flex",
          }}
        >
          {eyebrow}
        </div>
      </div>

      {/* Body: title + subtitle + optional children, centered in the slack space */}
      <div style={{ display: "flex", flexDirection: "column", gap: s.gap, maxWidth: w - s.pad * 2 }}>
        <div
          style={{
            fontFamily: FONT.display,
            fontSize: s.title,
            fontWeight: 400,
            lineHeight: 0.98,
            letterSpacing: "-0.01em",
            textTransform: "uppercase",
            color: fg,
            display: "flex",
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontFamily: FONT.body,
              fontSize: s.subtitle,
              fontWeight: 500,
              lineHeight: 1.3,
              color: muted,
              display: "flex",
            }}
          >
            {subtitle}
          </div>
        )}
        {children}
      </div>

      {/* Footer: spaced ATLVS mark + footer string */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            fontFamily: FONT.body,
            fontSize: s.footer * 1.2,
            fontWeight: 800,
            letterSpacing: "0.16em",
            color: fg,
            display: "flex",
          }}
        >
          {ATLVS_MARK}
        </div>
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: s.footer,
            fontWeight: 400,
            letterSpacing: "0.08em",
            color: flooded ? onAccentInk(accent) : accent,
            display: "flex",
          }}
        >
          {footer}
        </div>
      </div>
    </div>
  );
}
