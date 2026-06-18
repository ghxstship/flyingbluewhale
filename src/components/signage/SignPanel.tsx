import type { CSSProperties } from "react";
import { SignIcon } from "./SignIcon";

/**
 * SignPanel — a complete wayfinding sign built to airport standards
 * (ACRP 52 / FAA AC 150/5360-12F / AIGA-DOT / ISO 7010). A function-coded
 * colored field carries a pictogram, a legend, and an optional directional
 * arrow, proportioned to cap height H: clear-space 1H, pictogram 1.4H, arrow
 * 1H, gap 0.6H — the SEGD/AIGA anatomy. All colors resolve from the
 * `--sign-*` token layer (src/app/theme/kit-signage.css).
 */
export type SignTone =
  | "directional"
  | "identification"
  | "information"
  | "info"
  | "safety"
  | "mandatory"
  | "prohibition"
  | "danger"
  | "caution"
  | "ink"
  | "accent"
  | "white";

export type SignSize = "sm" | "md" | "lg" | "xl";

const SIGN_TONES: Record<SignTone, { bg: string; fg: string; keyline?: string }> = {
  directional: { bg: "var(--sign-directional-field)", fg: "var(--sign-directional-legend)" },
  identification: {
    bg: "var(--sign-identification-field)",
    fg: "var(--sign-identification-legend)",
    keyline: "var(--sign-identification-keyline)",
  },
  information: { bg: "var(--sign-information-field)", fg: "var(--sign-information-legend)" },
  info: { bg: "var(--sign-information-field)", fg: "var(--sign-information-legend)" },
  safety: { bg: "var(--sign-safety-field)", fg: "var(--sign-safety-legend)" },
  mandatory: { bg: "var(--sign-mandatory-field)", fg: "var(--sign-mandatory-legend)" },
  prohibition: { bg: "var(--sign-prohibition-field)", fg: "var(--sign-prohibition-legend)" },
  danger: { bg: "var(--sign-prohibition-field)", fg: "var(--sign-prohibition-legend)" },
  caution: { bg: "var(--sign-caution-field)", fg: "var(--sign-caution-legend)" },
  ink: { bg: "var(--sign-ink-field)", fg: "var(--sign-ink-legend)" },
  accent: { bg: "var(--sign-accent-field)", fg: "var(--sign-accent-legend)" },
  white: { bg: "#ffffff", fg: "#141414" },
};

/* Cap height H (px) per tier; the rest derive from the anatomy ratios. */
const SIGN_CAP: Record<SignSize, number> = { sm: 16, md: 24, lg: 34, xl: 48 };

export function SignPanel({
  icon,
  label,
  arrow,
  tone = "ink",
  size = "md",
  arrowSide,
  radius = 14,
  className,
  style,
  ...rest
}: {
  /** Pictogram sprite id, e.g. `aiga-toilets`. */
  icon?: string;
  label?: string;
  /** Arrow pictogram id, e.g. `aiga-arrow-up`; auto-placed by direction. */
  arrow?: string;
  tone?: SignTone;
  size?: SignSize;
  arrowSide?: "start" | "end";
  radius?: number;
  className?: string;
  style?: CSSProperties;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "style">) {
  const t = SIGN_TONES[tone] ?? SIGN_TONES.ink;
  const H = SIGN_CAP[size] ?? SIGN_CAP.md;
  const pad = H; // clear-space ≥ 1 cap height
  const gap = Math.round(H * 0.6);
  const iconSize = Math.round(H * 1.4); // pictogram ≈ 1.4 cap heights
  const arrowSize = H; // arrow ≈ cap height
  const side = arrowSide ?? (arrow && /left$/.test(arrow) ? "start" : "end");

  const arrowEl = arrow ? <SignIcon name={arrow} size={arrowSize} style={{ flex: "none" }} /> : null;

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        boxSizing: "border-box",
        alignItems: "center",
        gap,
        padding: pad,
        background: t.bg,
        color: t.fg,
        border: t.keyline ? `${Math.max(2, Math.round(H * 0.15))}px solid ${t.keyline}` : undefined,
        borderRadius: radius,
        fontFamily: "var(--sign-font)",
        lineHeight: 1,
        ...style,
      }}
      {...rest}
    >
      {side === "start" && arrowEl}
      {icon ? <SignIcon name={icon} size={iconSize} style={{ flex: "none" }} /> : null}
      {label ? (
        <span
          style={{
            fontSize: H,
            fontWeight: 600,
            letterSpacing: size === "sm" ? "var(--sign-legend-tracking-sm)" : "var(--sign-legend-tracking)",
            textTransform: "none",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      ) : null}
      {side === "end" && arrowEl}
    </div>
  );
}
