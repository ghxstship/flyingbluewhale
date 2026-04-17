import type { ReactNode } from "react";

export type BadgeVariant =
  | "default" | "success" | "warning" | "error" | "info"
  | "brand" | "muted" | "cyan" | "purple";

const VARIANT: Record<BadgeVariant, string> = {
  default: "badge-default",
  success: "badge-success",
  warning: "badge-warning",
  error:   "badge-error",
  info:    "badge-info",
  brand:   "badge-brand",
  muted:   "badge-muted",
  cyan:    "badge-info",
  purple:  "badge-brand",
};

export function Badge({
  variant = "default",
  children,
  className = "",
}: {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}) {
  return <span className={`badge ${VARIANT[variant]} ${className}`}>{children}</span>;
}
