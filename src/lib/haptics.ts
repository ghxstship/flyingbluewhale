/**
 * Haptic helpers — wraps navigator.vibrate with semantic intents.
 * Silently no-ops on unsupported devices (iOS Safari without web haptics).
 */

type Pattern = "tap" | "success" | "warning" | "error";

const PATTERNS: Record<Pattern, number | number[]> = {
  tap: 8,
  success: [10, 30, 10],
  warning: [20, 40, 20],
  error: [60, 40, 60],
};

export function haptic(pattern: Pattern) {
  if (typeof navigator === "undefined") return;
  const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
  if (typeof nav.vibrate !== "function") return;
  try {
    nav.vibrate(PATTERNS[pattern]);
  } catch {
    /* ignore */
  }
}
