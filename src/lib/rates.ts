/**
 * Canonical rate / commission bounds — the single authoring site for the
 * marketplace take-rate and agency-commission cap. Both are basis points
 * (1 bps = 0.01%); the shared ceiling is 50% (5000 bps).
 */

/** Maximum take-rate / commission, in basis points (50%). */
export const MAX_RATE_BPS = 5000;

/** Clamp an arbitrary numeric input to a valid bps rate in [0, MAX_RATE_BPS]. */
export function clampRateBps(value: unknown): number {
  return Math.min(MAX_RATE_BPS, Math.max(0, Math.round(Number(value))));
}
