import type { ReactNode } from "react";
import { Lock, Trophy } from "lucide-react";
import { formatNumber } from "@/lib/i18n/format";

/**
 * <AchievementBadge> — one earned/locked achievement medallion.
 *
 * Part of the shared LEG3ND ⇄ COMPVSS gamification model: the same
 * achievement catalog (points + tone) renders here on the LEG3ND
 * community/leaderboard surfaces and in the COMPVSS field profile. Token
 * tones only — `tone` maps to the semantic ramp.
 */
export type AchievementTone = "accent" | "success" | "warning" | "info" | "neutral";

const TONE_FIELD: Record<AchievementTone, string> = {
  accent: "var(--p-accent)",
  success: "var(--p-success)",
  warning: "var(--p-warning)",
  info: "var(--p-info)",
  neutral: "var(--p-text-2)",
};

export function AchievementBadge({
  name,
  description,
  points,
  earned = false,
  tone = "accent",
  icon,
  size = "default",
}: {
  name: string;
  description?: string;
  points?: number;
  earned?: boolean;
  tone?: AchievementTone;
  icon?: ReactNode;
  size?: "default" | "compact";
}) {
  const field = TONE_FIELD[tone];
  const dim = size === "compact" ? 40 : 56;
  return (
    <div
      className="surface flex items-center gap-3 p-3"
      style={{ opacity: earned ? 1 : 0.55 }}
      title={earned ? `Earned — ${name}` : `Locked — ${name}`}
    >
      <span
        className="flex shrink-0 items-center justify-center rounded-full"
        aria-hidden="true"
        style={{
          width: dim,
          height: dim,
          background: earned ? `color-mix(in srgb, ${field} 16%, var(--p-surface))` : "var(--p-surface-inset, var(--p-surface))",
          border: `2px solid ${earned ? field : "var(--p-border)"}`,
          color: earned ? field : "var(--p-text-3)",
        }}
      >
        {earned ? (icon ?? <Trophy size={size === "compact" ? 18 : 24} />) : <Lock size={size === "compact" ? 16 : 20} />}
      </span>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-[var(--p-text-1)]">{name}</div>
        {description && <div className="truncate text-xs text-[var(--p-text-2)]">{description}</div>}
        {points != null && (
          <div className="mt-0.5 text-xs font-medium" style={{ color: earned ? field : "var(--p-text-3)" }}>
            {formatNumber(points)} pts
          </div>
        )}
      </div>
    </div>
  );
}
