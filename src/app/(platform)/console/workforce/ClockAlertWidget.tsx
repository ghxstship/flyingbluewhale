/**
 * ClockAlertWidget — shows crew members with open time_entries past the
 * org's grace period. Competitive parity: Connecteam "Need to clock out"
 * and "Late clock out" widgets (launched 2026).
 */

type OverdueEntry = {
  entry_id: string;
  user_id: string;
  started_at: string;
  hours_elapsed: number;
};

export function ClockAlertWidget({
  overdueCount,
  overdueList,
}: {
  overdueCount: number;
  overdueList: OverdueEntry[];
}) {
  const tone = overdueCount === 0 ? "ok" : overdueCount <= 3 ? "warn" : "crit";

  return (
    <div
      className={`surface p-4 ${
        tone === "crit"
          ? "border-l-4 border-[var(--color-error)]"
          : tone === "warn"
            ? "border-l-4 border-[var(--color-warning)]"
            : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Clock-Out Alerts
        </h3>
        <span
          className={`text-2xl font-bold tabular-nums ${
            tone === "crit"
              ? "text-[var(--color-error)]"
              : tone === "warn"
                ? "text-[var(--color-warning)]"
                : "text-[var(--color-success)]"
          }`}
        >
          {overdueCount}
        </span>
      </div>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        {overdueCount === 0
          ? "All crew clocked out on time."
          : `${overdueCount} member${overdueCount === 1 ? "" : "s"} need${overdueCount === 1 ? "s" : ""} to clock out.`}
      </p>

      {overdueList.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {overdueList.slice(0, 5).map((e) => (
            <li key={e.entry_id} className="flex items-center justify-between text-xs">
              <span className="font-mono text-[var(--text-secondary)]">
                {e.user_id.slice(0, 8)}…
              </span>
              <span
                className={`font-semibold tabular-nums ${
                  e.hours_elapsed >= 12
                    ? "text-[var(--color-error)]"
                    : e.hours_elapsed >= 8
                      ? "text-[var(--color-warning)]"
                      : "text-[var(--text-secondary)]"
                }`}
              >
                {e.hours_elapsed}h
              </span>
            </li>
          ))}
          {overdueList.length > 5 && (
            <li className="text-xs text-[var(--text-muted)]">
              +{overdueList.length - 5} more
            </li>
          )}
        </ul>
      )}

      <p className="mt-3 text-[10px] text-[var(--text-muted)]">
        Grace period configurable at Settings → Time-Clock Zones.
      </p>
    </div>
  );
}
