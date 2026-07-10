import { ProgressBar } from "./ProgressBar";
import { formatNumber } from "@/lib/i18n/format";

/**
 * <LoyaltyTier> — the viewer's standing in the shared LEG3ND ⇄ COMPVSS
 * points model: current tier, points, and progress toward the next tier.
 * Tiers are named (e.g. Bronze/Silver/Gold/Platinum) and carry a tone.
 * Token-only colors.
 */
export type LoyaltyTierTone = "bronze" | "silver" | "gold" | "platinum";

const TONE_COLOR: Record<LoyaltyTierTone, string> = {
  // Mapped onto the semantic ramp — no bespoke metal hexes (token canon).
  bronze: "var(--p-warning)",
  silver: "var(--p-text-2)",
  gold: "var(--p-accent)",
  platinum: "var(--p-info)",
};

export function LoyaltyTier({
  tier,
  tone = "bronze",
  points,
  nextTier,
  nextThreshold,
  className,
}: {
  tier: string;
  tone?: LoyaltyTierTone;
  points: number;
  /** name of the next tier, omitted when already at the top. */
  nextTier?: string | null;
  /** points required to reach `nextTier`. */
  nextThreshold?: number | null;
  className?: string;
}) {
  const color = TONE_COLOR[tone];
  const hasNext = nextTier != null && nextThreshold != null && nextThreshold > points;
  const pct = hasNext ? Math.min(100, Math.round((points / nextThreshold!) * 100)) : 100;
  return (
    <div className={["surface p-4", className ?? ""].join(" ")}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="h-3 w-3 rounded-full"
            style={{ background: color, boxShadow: `0 0 0 3px color-mix(in srgb, ${color} 25%, transparent)` }}
          />
          <span className="text-sm font-semibold uppercase tracking-wide text-[var(--p-text-1)]">{tier}</span>
        </div>
        <span className="text-sm font-semibold tabular-nums text-[var(--p-text-1)]">
          {formatNumber(points)} <span className="text-xs font-normal text-[var(--p-text-2)]">pts</span>
        </span>
      </div>
      <div className="mt-3">
        <ProgressBar value={pct} aria-label={`Progress to ${nextTier ?? "max tier"}`} />
        <div className="mt-1 text-xs text-[var(--p-text-2)]">
          {hasNext
            ? `${formatNumber(nextThreshold! - points)} pts to ${nextTier}`
            : "Top tier reached"}
        </div>
      </div>
    </div>
  );
}
