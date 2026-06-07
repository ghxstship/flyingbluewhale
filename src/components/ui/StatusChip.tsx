import type { ReactNode } from "react";

/**
 * Runtime / state chip — renders a short uppercase label with tone-scoped
 * background and text color. Distinct from `<Badge>` (which carries
 * semantic meaning like success / warning / error / brand) and
 * `<StatusBadge>` (which maps domain-specific status enums). Use
 * `<StatusChip>` for transient runtime states like "running", "delivered",
 * "dead", "expiring", "pending".
 *
 * Palettes are intentionally a small, fixed set so the entire app speaks
 * the same color vocabulary for ambient state — no more
 * `bg-emerald-500/10 text-emerald-700` copy-paste per call site.
 */

export type StatusTone =
  | "neutral" // slate
  | "info" // sky
  | "success" // emerald
  | "warning" // amber
  | "danger" // rose
  | "muted"; // even lower contrast than neutral

const TONE_CLASS: Record<StatusTone, string> = {
  neutral: "bg-[color-mix(in_srgb,var(--p-text-3)_10%,transparent)] text-[var(--p-text-3)]",
  info: "bg-[color-mix(in_srgb,var(--p-info)_10%,transparent)] text-[var(--p-info)]",
  success: "bg-[color-mix(in_srgb,var(--p-success)_10%,transparent)] text-[var(--p-success)]",
  warning: "bg-[color-mix(in_srgb,var(--p-warning)_10%,transparent)] text-[var(--p-warning)]",
  danger: "bg-[color-mix(in_srgb,var(--p-danger)_10%,transparent)] text-[var(--p-danger)]",
  muted: "bg-[var(--p-surface-2)] text-[var(--p-text-2)]",
};

export function StatusChip({
  tone = "neutral",
  children,
  className = "",
  icon,
}: {
  tone?: StatusTone;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide capitalize ${TONE_CLASS[tone]} ${className}`.trim()}
    >
      {icon}
      {children}
    </span>
  );
}
