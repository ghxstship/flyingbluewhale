import { Avatar } from "./Avatar";
import { formatNumber } from "@/lib/i18n/format";

/**
 * <LeaderboardRow> — one ranked contributor on a LEG3ND / COMPVSS
 * leaderboard. Reads the shared points model. `highlight` flags the
 * viewer's own row. Token tones only.
 */
export function LeaderboardRow({
  rank,
  name,
  avatarUrl,
  points,
  subtitle,
  delta,
  highlight = false,
}: {
  rank: number;
  name: string;
  avatarUrl?: string | null;
  points: number;
  subtitle?: string;
  /** position change vs. the prior period; positive = climbed. */
  delta?: number;
  highlight?: boolean;
}) {
  const medal = rank <= 3;
  const rankColor = rank === 1 ? "var(--p-warning)" : rank === 2 ? "var(--p-text-2)" : rank === 3 ? "var(--p-accent)" : "var(--p-text-3)";
  return (
    <div
      className="flex items-center gap-3 rounded-[var(--p-r-md)] px-3 py-2"
      style={{
        background: highlight ? "color-mix(in srgb, var(--p-accent) 10%, var(--p-surface))" : "transparent",
        border: highlight ? "1px solid color-mix(in srgb, var(--p-accent) 35%, transparent)" : "1px solid transparent",
      }}
    >
      <span
        className="w-7 shrink-0 text-center text-sm font-bold tabular-nums"
        style={{ color: rankColor, fontWeight: medal ? 800 : 600 }}
      >
        {rank}
      </span>
      <Avatar size="sm" name={name} src={avatarUrl ?? undefined} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-[var(--p-text-1)]">{name}</div>
        {subtitle && <div className="truncate text-xs text-[var(--p-text-2)]">{subtitle}</div>}
      </div>
      {delta != null && delta !== 0 && (
        <span
          className="text-xs font-medium tabular-nums"
          style={{ color: delta > 0 ? "var(--p-success)" : "var(--p-danger)" }}
        >
          {delta > 0 ? "▲" : "▼"} {Math.abs(delta)}
        </span>
      )}
      <span className="shrink-0 text-sm font-semibold tabular-nums text-[var(--p-text-1)]">
        {formatNumber(points)}
      </span>
    </div>
  );
}
