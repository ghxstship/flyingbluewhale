import type { PushKind } from "./send";

/**
 * Push discipline engine — sender-side tiering (T1-2, ratified in
 * docs/compvss/MOBILE_BEST_PRACTICES_2026-07.md Rank 2).
 *
 * Every push carries a TIER, inherited from its `PushKind` via
 * `PUSH_KIND_TIER` (the SSOT beside the kind taxonomy) so existing
 * `sendPushTo`/`sendPushBulk` call sites need zero churn. The gate math
 * here is PURE — no I/O — so the tier × quiet-hours × show-day matrix is
 * table-testable; `src/lib/push/send.ts` feeds it the per-user inputs.
 *
 * Tiers:
 *  - `interrupt` — safety / crisis / gate-blocking. Delivers always,
 *    including during quiet hours.
 *  - `ambient`   — normal operational updates. Delivers now, EXCEPT during
 *    the user's quiet hours, when it defers to `push_deferred` and flushes
 *    at quiet-hours end.
 *  - `digest`    — ambient noise (feed posts, recognition, learning).
 *    Never buzzes individually: accrues in `push_deferred` and flushes as
 *    ONE summarized push per window (quiet-hours end + a midday window).
 *
 * Show-day override: when the org is in show-day mode, `ambient` behaves
 * as `interrupt` for the OPERATIONAL kinds in `SHOW_DAY_PROMOTED`
 * (assignment/state/scan/schedule) — the event-native posture flip.
 * Digest stays digest; the feed can wait even on show day.
 *
 * The per-kind opt-out still wins: a muted kind sends nothing on any
 * tier, including interrupt — EXCEPT the kinds `UNSILENCEABLE_KINDS`
 * (send.ts) marks exempt (crisis), which ignore the matrix entirely.
 */

export type PushTier = "interrupt" | "ambient" | "digest";

/**
 * SSOT: kind → tier. `Record<PushKind, PushTier>` is the compile-level
 * completeness guard — adding a `PushKind` without classifying it here
 * fails the build.
 */
export const PUSH_KIND_TIER: Record<PushKind, PushTier> = {
  // interrupt — safety-critical or blocking someone at a gate/clock.
  crisis: "interrupt",
  incident: "interrupt",
  // ambient — normal operational flow.
  chat: "ambient",
  assignment: "ambient",
  assignment_state: "ambient",
  assignment_scan: "ambient",
  shift: "ambient",
  shift_swap: "ambient",
  time_off: "ambient",
  approval: "ambient",
  timesheet: "ambient",
  payroll: "ambient",
  time_correction: "ambient",
  // A decision on a recert request you filed — request/decision parity with
  // time_off and approval, not learning-feed noise like `course`.
  certification: "ambient",
  // A decision on an application/submission/offer you filed, or a doc
  // reminder addressed to you — request/decision parity with time_off.
  marketplace: "ambient",
  onboarding: "ambient",
  // digest — feed noise; bundled, never buzzes one-by-one.
  announcement: "digest",
  kudos: "digest",
  badge: "digest",
  course: "digest",
};

/**
 * Kinds whose `ambient` tier is promoted to `interrupt` while the org is
 * in show-day mode: assignment / state / scan / schedule. Explicit set —
 * chat and time & pay stay ambient even on show day.
 */
export const SHOW_DAY_PROMOTED: ReadonlySet<PushKind> = new Set<PushKind>([
  "assignment",
  "assignment_state",
  "assignment_scan",
  "shift",
  "shift_swap",
]);

/**
 * Per-user quiet hours, stored in `notification_preferences.quiet_hours`
 * (jsonb — the column has existed since the baseline, unused until now;
 * the shape is canonized by migration 20260723150000_push_discipline).
 * Minutes are wall-clock minutes since midnight in `tz` (IANA name).
 * Windows may wrap midnight (start 1320 / end 420 = 22:00 → 07:00).
 */
export type QuietHours = {
  enabled: boolean;
  start_min: number;
  end_min: number;
  tz: string;
};

/** Parse the stored jsonb into a QuietHours, or null when absent/invalid. */
export function parseQuietHours(json: unknown): QuietHours | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  const start = o.start_min;
  const end = o.end_min;
  if (typeof start !== "number" || typeof end !== "number") return null;
  if (start < 0 || start > 1439 || end < 0 || end > 1439) return null;
  return {
    enabled: o.enabled === true,
    start_min: Math.floor(start),
    end_min: Math.floor(end),
    tz: typeof o.tz === "string" && o.tz.length > 0 ? o.tz : "UTC",
  };
}

// ---------------------------------------------------------------------------
// Timezone math — Intl-based, no external tz library (same two-pass
// fixed-point approach as src/lib/scheduler/slots.ts; helpers there are
// module-private, so the compact versions live here).
// ---------------------------------------------------------------------------

/** Minutes to ADD to UTC to get wall-clock time in `timeZone` at `date`.
 *  Invalid tz names fall back to UTC rather than throwing mid-send. */
function tzOffsetMinutes(date: Date, timeZone: string): number {
  let dtf: Intl.DateTimeFormat;
  try {
    dtf = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return 0;
  }
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) parts[p.type] = p.value;
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  );
  return (asUtc - date.getTime()) / 60000;
}

/** Wall-clock minute-of-day (0–1439) of `date` in `timeZone`. */
export function minuteOfDayIn(date: Date, timeZone: string): number {
  const offset = tzOffsetMinutes(date, timeZone);
  const shifted = new Date(date.getTime() + offset * 60000);
  return shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
}

/** The UTC instant of the NEXT occurrence (strictly after `now`) of
 *  wall-clock `minute` in `timeZone`. Two-pass fixed point absorbs DST. */
export function nextWallMinute(now: Date, minute: number, timeZone: string): Date {
  const offset = tzOffsetMinutes(now, timeZone);
  const local = new Date(now.getTime() + offset * 60000);
  let y = local.getUTCFullYear();
  let m = local.getUTCMonth();
  let d = local.getUTCDate();
  for (let dayHop = 0; dayHop < 3; dayHop++) {
    let utc = Date.UTC(y, m, d, 0, minute);
    for (let i = 0; i < 2; i++) {
      const off = tzOffsetMinutes(new Date(utc), timeZone);
      utc = Date.UTC(y, m, d, 0, minute) - off * 60000;
    }
    if (utc > now.getTime()) return new Date(utc);
    // Candidate already passed today — roll to the next calendar day.
    const next = new Date(Date.UTC(y, m, d + 1));
    y = next.getUTCFullYear();
    m = next.getUTCMonth();
    d = next.getUTCDate();
  }
  // Unreachable in practice; fail-safe to +24h so a defer never lands in
  // the past and loops.
  return new Date(now.getTime() + 24 * 60 * 60000);
}

/** True when `nowMin` falls inside the [start, end) quiet window,
 *  handling midnight wraparound. A zero-length window is never quiet. */
export function inQuietWindow(nowMin: number, startMin: number, endMin: number): boolean {
  if (startMin === endMin) return false;
  if (startMin < endMin) return nowMin >= startMin && nowMin < endMin;
  return nowMin >= startMin || nowMin < endMin;
}

/** Digest flush windows (wall-clock minutes): quiet-hours end when the
 *  user has quiet hours enabled, otherwise a morning default — plus a
 *  midday window for everyone. */
export const DIGEST_MORNING_MIN = 8 * 60; // 08:00
export const DIGEST_MIDDAY_MIN = 12 * 60; // 12:00

/** The UTC instant of the next digest flush window for this user. */
export function nextDigestWindow(now: Date, quiet: QuietHours | null): Date {
  const tz = quiet?.tz ?? "UTC";
  const windows = quiet?.enabled ? [quiet.end_min, DIGEST_MIDDAY_MIN] : [DIGEST_MORNING_MIN, DIGEST_MIDDAY_MIN];
  let best: Date | null = null;
  for (const w of windows) {
    const at = nextWallMinute(now, w, tz);
    if (!best || at.getTime() < best.getTime()) best = at;
  }
  return best ?? new Date(now.getTime() + 24 * 60 * 60000);
}

// ---------------------------------------------------------------------------
// The gate.
// ---------------------------------------------------------------------------

export type GateInput = {
  /** Kind on the payload. Kindless system pings bypass discipline. */
  kind?: PushKind;
  /** Per-call tier override for edge cases (PushSendOptions.tier). */
  tierOverride?: PushTier;
  /** matrix[kind].push === false for this user (already false for
   *  unsilenceable kinds when computed via pushExcludedFrom). */
  optedOut: boolean;
  /** UNSILENCEABLE_KINDS.has(kind) — the catalog's opt-out exemption. */
  unsilenceable: boolean;
  /** Org-level show-day posture (src/lib/push/show-day.ts). */
  showDay: boolean;
  /** The user's quiet hours, or null when unset. */
  quiet: QuietHours | null;
  now: Date;
};

export type GateDecision =
  | { action: "drop" }
  | { action: "send"; tier: PushTier }
  | { action: "defer"; tier: "ambient" | "digest"; deferUntil: Date };

/** The tier a (kind, override, show-day) combination resolves to. */
export function effectiveTier(kind: PushKind, tierOverride: PushTier | undefined, showDay: boolean): PushTier {
  const base = tierOverride ?? PUSH_KIND_TIER[kind];
  if (showDay && base === "ambient" && SHOW_DAY_PROMOTED.has(kind)) return "interrupt";
  return base;
}

/**
 * Decide delivery for one (user, payload). Pure — every branch of the
 * tier × quiet-hours × show-day × opt-out matrix lives here and only here.
 *
 * Order of precedence:
 *  1. No kind → send (system pings predate the discipline layer and are
 *     deliberately exempt, mirroring the opt-out matrix's behavior).
 *  2. Opt-out beats EVERY tier including interrupt — except unsilenceable
 *     kinds, which ignore the matrix (existing contract, preserved).
 *  3. Show-day promotes ambient → interrupt for SHOW_DAY_PROMOTED kinds.
 *  4. digest → always accrues to the next digest window.
 *  5. interrupt → sends, quiet hours notwithstanding.
 *  6. ambient → defers during quiet hours (flush at quiet end), else sends.
 */
export function gatePush(input: GateInput): GateDecision {
  const { kind, tierOverride, optedOut, unsilenceable, showDay, quiet, now } = input;
  if (!kind) return { action: "send", tier: "interrupt" };
  if (optedOut && !unsilenceable) return { action: "drop" };
  const tier = effectiveTier(kind, tierOverride, showDay);
  if (tier === "digest") {
    return { action: "defer", tier: "digest", deferUntil: nextDigestWindow(now, quiet) };
  }
  if (tier === "interrupt") return { action: "send", tier };
  // ambient
  if (quiet?.enabled && inQuietWindow(minuteOfDayIn(now, quiet.tz), quiet.start_min, quiet.end_min)) {
    return { action: "defer", tier: "ambient", deferUntil: nextWallMinute(now, quiet.end_min, quiet.tz) };
  }
  return { action: "send", tier };
}
