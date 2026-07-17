/**
 * Shared crisis-surface constants — imported by /m/emergency (the muster
 * card) and /m/alerts (the crisis alert log, kit 29) so the two field
 * surfaces cannot disagree about what "active" means or which semantic
 * tone a severity resolves to.
 */

/**
 * How long a declared crisis counts as ACTIVE on the field surfaces.
 * `crisis_alerts` has no stand-down lifecycle column (see migration
 * 20260717130103's header) — recency is the honest proxy: the fan-out fires
 * the moment the console declares, and a code from last week is history, not
 * an instruction. When a real `alert_state` lands console-side, this window
 * dies and the queries filter on it instead.
 */
export const CRISIS_ACTIVE_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Severity → semantic tone token (kit token rule: no literal colors).
 * `crisis_alerts.severity` is free text console-side; critical/warn are the
 * two the declare form writes, anything else reads as informational.
 */
export function crisisSeverityTone(severity: string): string {
  return severity === "critical"
    ? "var(--p-danger)"
    : severity === "warn"
      ? "var(--p-warning)"
      : "var(--p-info)";
}
