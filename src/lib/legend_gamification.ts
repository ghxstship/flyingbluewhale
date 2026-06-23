/**
 * Shared gamification model — the achievement / points / tier vocabulary
 * read by BOTH LEG3ND (learning) and COMPVSS (field). Mirrors the
 * `src/lib/legend_resources.ts` shape: enum tuples `as const` → derived
 * types → label maps + pure helpers. Backed by migration
 * 20260623150000_legend_gamification (achievements, achievement_awards,
 * points_ledger, loyalty_tiers).
 */
import type { AchievementTone } from "@/components/ui/AchievementBadge";
import type { LoyaltyTierTone } from "@/components/ui/LoyaltyTier";

export const ACHIEVEMENT_TONES = ["accent", "success", "warning", "info", "neutral"] as const;
export const ACHIEVEMENT_STATES = ["active", "archived"] as const;
export type AchievementState = (typeof ACHIEVEMENT_STATES)[number];

export const POINTS_SOURCES = ["legend", "compvss", "manual"] as const;
export type PointsSource = (typeof POINTS_SOURCES)[number];

export const LOYALTY_TONES = ["bronze", "silver", "gold", "platinum"] as const;

export type Achievement = {
  id: string;
  org_id: string;
  code: string;
  name: string;
  description: string | null;
  tone: AchievementTone;
  points: number;
  icon_key: string | null;
  achievement_state: AchievementState;
};

export type LoyaltyTierRow = {
  id: string;
  org_id: string;
  name: string;
  tone: LoyaltyTierTone;
  threshold: number;
  sort_order: number;
};

export type LeaderboardEntry = {
  user_id: string;
  name: string;
  avatar_url: string | null;
  points: number;
};

/**
 * Default tier ladder used when an org hasn't configured `loyalty_tiers`.
 * Thresholds in points; tone maps onto the semantic ramp via <LoyaltyTier>.
 */
export const DEFAULT_TIERS: ReadonlyArray<{ name: string; tone: LoyaltyTierTone; threshold: number }> = [
  { name: "Bronze", tone: "bronze", threshold: 0 },
  { name: "Silver", tone: "silver", threshold: 500 },
  { name: "Gold", tone: "gold", threshold: 2000 },
  { name: "Platinum", tone: "platinum", threshold: 5000 },
];

/**
 * Resolve a points total into the current tier + the next rung. Tiers are
 * sorted ascending by threshold; the current tier is the highest whose
 * threshold the learner has met.
 */
export function resolveTier(
  points: number,
  tiers: ReadonlyArray<{ name: string; tone: LoyaltyTierTone; threshold: number }> = DEFAULT_TIERS,
): { tier: string; tone: LoyaltyTierTone; nextTier: string | null; nextThreshold: number | null } {
  const sorted = [...tiers].sort((a, b) => a.threshold - b.threshold);
  let current = sorted[0] ?? { name: "—", tone: "bronze" as LoyaltyTierTone, threshold: 0 };
  let next: { name: string; threshold: number } | null = null;
  for (let i = 0; i < sorted.length; i++) {
    if (points >= sorted[i]!.threshold) {
      current = sorted[i]!;
      next = sorted[i + 1] ? { name: sorted[i + 1]!.name, threshold: sorted[i + 1]!.threshold } : null;
    }
  }
  return { tier: current.name, tone: current.tone, nextTier: next?.name ?? null, nextThreshold: next?.threshold ?? null };
}
