/**
 * T1-4 kiosk mode — device-scoped PIN attempt / lockout math.
 *
 * Pure functions (no I/O) so the policy is unit-testable in isolation and
 * identical wherever it runs. The DEVICE is the lockout unit: a failed PIN
 * matches no worker row, so there is no worker to attribute the failure to —
 * only the tablet it was typed on (see the kiosk migration header).
 *
 * Policy: the first `KIOSK_PIN_MAX_ATTEMPTS - 1` consecutive failures are
 * free (fat fingers on a gate tablet are normal). From the threshold on,
 * every further failure locks the device's PIN pad for an escalating window:
 * 30s, 1m, 2m, 4m, … capped at 15 minutes. A successful entry resets the
 * counter. Honest messaging: the caller surfaces the remaining seconds, not
 * a vague "try again later".
 */

/** Consecutive failures at which the first lockout engages. */
export const KIOSK_PIN_MAX_ATTEMPTS = 5;

/** First lockout window (ms). Doubles per further failure. */
export const KIOSK_LOCKOUT_BASE_MS = 30_000;

/** Escalation ceiling (ms) — 15 minutes. */
export const KIOSK_LOCKOUT_CAP_MS = 15 * 60_000;

/**
 * Lockout duration earned by the Nth consecutive failure. Zero below the
 * threshold; from the threshold, 30s doubling per failure, capped at 15m.
 */
export function lockoutMsFor(failedAttempts: number): number {
  if (!Number.isFinite(failedAttempts) || failedAttempts < KIOSK_PIN_MAX_ATTEMPTS) return 0;
  const exponent = failedAttempts - KIOSK_PIN_MAX_ATTEMPTS;
  // Beyond 2^30 the cap has long since engaged; clamp the exponent so the
  // math can't overflow into Infinity on a pathological counter.
  const ms = KIOSK_LOCKOUT_BASE_MS * 2 ** Math.min(exponent, 30);
  return Math.min(ms, KIOSK_LOCKOUT_CAP_MS);
}

/**
 * The device state after one more failed PIN entry.
 * Returns the new counter and the lock expiry (null while under threshold).
 */
export function registerPinFailure(
  previousFailedAttempts: number,
  now: Date,
): { failedAttempts: number; lockedUntil: Date | null } {
  const failedAttempts = Math.max(0, Math.floor(previousFailedAttempts)) + 1;
  const ms = lockoutMsFor(failedAttempts);
  return {
    failedAttempts,
    lockedUntil: ms > 0 ? new Date(now.getTime() + ms) : null,
  };
}

/** True while a stored lock expiry is still in the future. */
export function isLockedOut(lockedUntil: string | Date | null | undefined, now: Date): boolean {
  if (!lockedUntil) return false;
  const until = typeof lockedUntil === "string" ? new Date(lockedUntil) : lockedUntil;
  const t = until.getTime();
  return Number.isFinite(t) && t > now.getTime();
}

/** Whole seconds remaining on a lock (0 when unlocked) — for honest UI copy. */
export function lockoutRemainingS(lockedUntil: string | Date | null | undefined, now: Date): number {
  if (!isLockedOut(lockedUntil, now)) return 0;
  const until = typeof lockedUntil === "string" ? new Date(lockedUntil as string) : (lockedUntil as Date);
  return Math.max(1, Math.ceil((until.getTime() - now.getTime()) / 1000));
}
