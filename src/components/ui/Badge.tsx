"use client";

import * as React from "react";
import { X } from "lucide-react";

export type BadgeVariant =
  | "default" | "success" | "warning" | "error" | "info"
  | "brand" | "brand-soft" | "muted" | "cyan" | "purple";

export type BadgeShape = "default" | "dot" | "count";

const VARIANT: Record<BadgeVariant, string> = {
  default: "badge-default",
  success: "badge-success",
  warning: "badge-warning",
  error:   "badge-error",
  info:    "badge-info",
  brand:   "badge-brand",
  "brand-soft": "badge-brand-soft",
  muted:   "badge-muted",
  cyan:    "badge-info",
  purple:  "badge-brand",
};

const DOT_BG: Record<BadgeVariant, string> = {
  default: "bg-[var(--text-muted)]",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  error:   "bg-[var(--color-error)]",
  info:    "bg-[var(--org-primary)]",
  brand:   "bg-[var(--org-primary)]",
  "brand-soft": "bg-[var(--org-primary)]",
  muted:   "bg-[var(--text-muted)]",
  cyan:    "bg-[var(--org-primary)]",
  purple:  "bg-[var(--org-primary)]",
};

interface BadgeProps {
  variant?: BadgeVariant;
  shape?: BadgeShape;
  children?: React.ReactNode;
  className?: string;
  onDismiss?: () => void;
  "aria-label"?: string;
}

export function Badge({
  variant = "default",
  shape = "default",
  children,
  className = "",
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
    <span className={`badge ${VARIANT[variant]} ${className}`}>
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
