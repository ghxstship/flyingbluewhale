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
 *
 * Vocabulary note (CN-8): `error` is accepted as an alias for `danger`
 * so StatusChip shares tone vocabulary with `<Badge>` and the canonical
 * maps in `src/lib/tones.ts`.
 */

export type StatusTone =
  | "neutral" // slate
  | "info" // sky
  | "success" // emerald
  | "warning" // amber
  | "danger" // rose
  | "error" // alias for danger — shared vocabulary with <Badge> / lib/tones (CN-8)
  | "muted"; // even lower contrast than neutral

// v7.0 — tint fill stays on the base semantic hue; TEXT rides the AA
// --p-{semantic}-text inks (the base hexes fail 4.5:1 as small chip text).
const TONE_CLASS: Record<Exclude<StatusTone, "error">, string> = {
  neutral: "bg-[color-mix(in_srgb,var(--p-text-3)_10%,transparent)] text-[var(--p-text-3)]",
  info: "bg-[color-mix(in_srgb,var(--p-info)_10%,transparent)] text-[var(--p-info-text)]",
  success: "bg-[color-mix(in_srgb,var(--p-success)_10%,transparent)] text-[var(--p-success-text)]",
  warning: "bg-[color-mix(in_srgb,var(--p-warning)_10%,transparent)] text-[var(--p-warning-text)]",
  danger: "bg-[color-mix(in_srgb,var(--p-danger)_10%,transparent)] text-[var(--p-danger-text)]",
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
  // `error` is a vocabulary alias (Badge / lib/tones say "error",
  // StatusChip historically said "danger") — same paint either way.
  const resolved = tone === "error" ? "danger" : tone;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold tracking-wide capitalize ${TONE_CLASS[resolved]} ${className}`.trim()}
    >
      {icon}
      {children}
    </span>
  );
}
