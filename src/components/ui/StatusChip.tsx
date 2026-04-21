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
  | "neutral"   // slate
  | "info"      // sky
  | "success"   // emerald
  | "warning"   // amber
  | "danger"    // rose
  | "muted";    // even lower contrast than neutral

const TONE_CLASS: Record<StatusTone, string> = {
  neutral: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  info: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  danger: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  muted: "bg-[var(--surface-inset)] text-[var(--text-muted)]",
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
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${TONE_CLASS[tone]} ${className}`.trim()}
    >
      {icon}
      {children}
    </span>
  );
}
