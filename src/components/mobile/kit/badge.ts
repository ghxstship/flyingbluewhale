/**
 * toneToBadge — the ONE tone-name → `.ps-badge--*` class mapping for the
 * COMPVSS kit. Accepts both the kit tone vocab (ok/warn/info/danger/accent/
 * neutral) and the prototype/semantic aliases ("success" → ok, "warning" →
 * warn, "text-3" → neutral) so callers can pass either without hand-rolling
 * the ternary that used to be copy-pasted per surface.
 *
 * Returns the full class string ("ps-badge ps-badge--ok").
 */
export function toneToBadge(tone?: string): string {
  switch (tone) {
    case "ok":
    case "success":
      return "ps-badge ps-badge--ok";
    case "warn":
    case "warning":
      return "ps-badge ps-badge--warn";
    case "info":
      return "ps-badge ps-badge--info";
    case "danger":
      return "ps-badge ps-badge--danger";
    case "accent":
      return "ps-badge ps-badge--accent";
    default:
      return "ps-badge ps-badge--neutral";
  }
}
