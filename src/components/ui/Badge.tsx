"use client";

import * as React from "react";
import { X } from "lucide-react";

/**
 * Kit-spec variants: default · success · warning · error · info · brand ·
 * brand-soft · muted (mirrors tokens.json#semantic + brand neutrals).
 *
 * Kit-extension aliases (house additions, kept for call-site readability):
 *   - `cyan`   → aliased to `info`  (paints with --color-info / brand soft)
 *   - `purple` → aliased to `brand` (paints with --org-primary)
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

const VARIANT: Record<BadgeVariant, string> = {
  default: "badge-default",
  success: "badge-success",
  warning: "badge-warning",
  error: "badge-error",
  info: "badge-info",
  brand: "badge-brand",
  "brand-soft": "badge-brand-soft",
  muted: "badge-muted",
  cyan: "badge-info",
  purple: "badge-brand",
};

// Every dot resolves to a token var — never a Tailwind palette literal.
// Off-token bg-emerald-500 / bg-amber-500 produced #10b981 / #f59e0b for
// the dot while the pill variant painted the kit-canonical #2fbf71 /
// #e9a23b via `badge-success` / `badge-warning`. Both shapes now bind
// to --color-success / --color-warning so they paint identically.
const DOT_BG: Record<BadgeVariant, string> = {
  default: "bg-[var(--text-muted)]",
  success: "bg-[var(--color-success)]",
  warning: "bg-[var(--color-warning)]",
  error: "bg-[var(--color-error)]",
  info: "bg-[var(--color-info)]",
  brand: "bg-[var(--org-primary)]",
  "brand-soft": "bg-[var(--org-primary)]",
  muted: "bg-[var(--text-muted)]",
  cyan: "bg-[var(--color-info)]",
  purple: "bg-[var(--org-primary)]",
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
        className={`inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] ${className}`}
      >
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT_BG[variant]}`} aria-hidden="true" />
        {children}
      </span>
    );
  }
  if (shape === "count") {
    return (
      <span
        aria-label={ariaLabel}
        className={`inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold tabular-nums ${VARIANT[variant]} ${className}`}
      >
        {children}
      </span>
    );
  }
  return (
    <span className={`badge inline-flex items-center gap-1 ${VARIANT[variant]} ${className}`}>
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
