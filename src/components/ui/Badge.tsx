"use client";

import * as React from "react";
import { X } from "lucide-react";

/**
 * Kit-spec variants: default · success · warning · error · info · brand ·
 * brand-soft · muted (mirrors tokens.json#semantic + brand neutrals).
 *
 * Kit-extension aliases (house additions, kept for call-site readability):
 *   - `cyan`   → aliased to `info`  (paints with --p-info / brand soft)
 *   - `purple` → aliased to `brand` (paints with --p-accent)
 * Both share the same paint tokens as the underlying kit variant — they
 * exist for vocabulary fit, not new colors. No call site should pass a
 * raw hex/Tailwind palette for either; if you need a new color, add it
 * to tokens.json#semantic first.
 */
export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "brand"
  | "brand-soft"
  | "muted"
  | "cyan"
  | "purple";

export type BadgeShape = "default" | "dot" | "count";

/**
 * Canonical kit primitive — `.ps-badge--{ok,warn,danger,info,neutral,accent}`
 * (defined in theme/themes/atlvs-product.css). The retired `.badge-*`
 * vocabulary was stripped in the kit migration; this map is the rebind
 * (parity item 5 / audit A-1). Each modifier paints from a `--p-*` token.
 */
const PS_MOD: Record<BadgeVariant, string> = {
  default: "ps-badge--neutral",
  success: "ps-badge--ok",
  warning: "ps-badge--warn",
  error: "ps-badge--danger",
  info: "ps-badge--info",
  brand: "ps-badge--accent",
  "brand-soft": "ps-badge--accent",
  muted: "ps-badge--neutral",
  cyan: "ps-badge--info",
  purple: "ps-badge--accent",
};

// Every dot resolves to a token var — never a Tailwind palette literal.
// Off-token bg-emerald-500 / bg-amber-500 produced #10b981 / #f59e0b for
// the dot while the pill variant painted the kit-canonical #2fa968 /
// #c8841a via `badge-success` / `badge-warning`. Both shapes now bind
// to --p-success / --p-warning so they paint identically.
const DOT_BG: Record<BadgeVariant, string> = {
  default: "bg-[var(--p-text-2)]",
  success: "bg-[var(--p-success)]",
  warning: "bg-[var(--p-warning)]",
  error: "bg-[var(--p-danger)]",
  info: "bg-[var(--p-info)]",
  brand: "bg-[var(--p-accent)]",
  "brand-soft": "bg-[var(--p-accent)]",
  muted: "bg-[var(--p-text-2)]",
  cyan: "bg-[var(--p-info)]",
  purple: "bg-[var(--p-accent)]",
};

interface BadgeProps {
  variant?: BadgeVariant;
  shape?: BadgeShape;
  children?: React.ReactNode;
  className?: string;
  /** Optional leading icon (e.g. <CheckCircle size={10} />). */
  icon?: React.ReactNode;
  onDismiss?: () => void;
  "aria-label"?: string;
}

export function Badge({
  variant = "default",
  shape = "default",
  children,
  className = "",
  icon,
  onDismiss,
  "aria-label": ariaLabel,
}: BadgeProps) {
  if (shape === "dot") {
    return (
      <span
        aria-label={ariaLabel ?? (typeof children === "string" ? children : undefined)}
        className={`inline-flex items-center gap-1.5 text-xs text-[var(--p-text-2)] ${className}`}
      >
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT_BG[variant]}`} aria-hidden="true" />
        {children}
      </span>
    );
  }
  if (shape === "count") {
    // Color-only: the modifier classes set background+color standalone, so the
    // count keeps its own compact layout instead of the .ps-badge pill padding.
    return (
      <span
        aria-label={ariaLabel}
        className={`inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold tabular-nums ${PS_MOD[variant]} ${className}`}
      >
        {children}
      </span>
    );
  }
  return (
    <span className={`ps-badge ${PS_MOD[variant]} ${className}`}>
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      {children}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={ariaLabel ? `Dismiss ${ariaLabel}` : "Dismiss"}
          className="ms-1 rounded-full opacity-70 hover:opacity-100"
        >
          <X size={10} aria-hidden="true" />
        </button>
      )}
    </span>
  );
}
