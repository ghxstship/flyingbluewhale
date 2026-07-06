/**
 * Unified-schedule guardrails (CP·4).
 *
 * Pure, DB-free predicates the schedule surface + its server actions run before
 * committing (or publishing) an activity. `error`-level violations block the
 * write; `warn`-level violations surface in-grid and in the right-rail digest and
 * need an explicit override reason. Keeping this a pure function over plain inputs
 * (no Supabase, no `next/*`) is what makes it unit-testable — the action fetches
 * the window of activities + credentials and hands them in.
 *
 * Rules (handoff §4):
 *   · expired_credential (error) — assignee's credential expired before start.
 *   · double_book        (error) — same resource overlapping on two locations.
 *   · min_rest           (warn)  — gap to the adjacent activity < org rest floor.
 *   · max_hours          (warn)  — resource's ISO-week total over the cap.
 */

export type GuardrailLevel = "error" | "warn";

export type GuardrailCode = "expired_credential" | "double_book" | "min_rest" | "max_hours";

export type GuardrailViolation = {
  code: GuardrailCode;
  level: GuardrailLevel;
  message: string;
  /** The candidate activity the violation is about. */
  activityId: string;
  /** The resource (crew/asset) implicated, when the rule is resource-scoped. */
  resourceRef?: string | null;
};

/** The minimal shape of a schedule activity the guardrails reason over. */
export type ScheduleActivityInput = {
  id: string;
  resourceRef: string | null;
  locationId: string | null;
  /** ISO-8601 timestamps. */
  startsAt: string;
  endsAt: string;
};

/** A credential the candidate's resource must hold, with its expiry (if any). */
export type CredentialInput = {
  resourceRef: string;
  /** ISO date/datetime, or null for "never expires". */
  expiresOn: string | null;
  label: string;
};

export type GuardrailOptions = {
  /** Minimum rest window between a resource's adjacent activities, hours. */
  restFloorHours?: number;
  /** Fair-workweek weekly hours cap per resource. */
  weeklyHoursCap?: number;
};

export const DEFAULT_REST_FLOOR_HOURS = 8;
export const DEFAULT_WEEKLY_HOURS_CAP = 60;

const MS_PER_HOUR = 3_600_000;

function ms(iso: string): number {
  return new Date(iso).getTime();
}

function hoursBetween(startIso: string, endIso: string): number {
  return Math.max(0, (ms(endIso) - ms(startIso)) / MS_PER_HOUR);
}

/** Two half-open intervals [aStart,aEnd) and [bStart,bEnd) overlap. */
function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return ms(aStart) < ms(bEnd) && ms(bStart) < ms(aEnd);
}

/** Monday-anchored ISO-week key (UTC) for grouping a resource's weekly load. */
export function isoWeekKey(iso: string): string {
  const d = new Date(iso);
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  // ISO weekday: Mon=1..Sun=7.
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() - day + 1); // back to Monday
  return utc.toISOString().slice(0, 10);
}

/**
 * Evaluate all guardrails for a candidate activity against the window of other
 * activities (for the same resource(s)) and the resource's credentials.
 * `existing` should exclude the candidate itself (matched by id if present).
 * Returns every violation, most-severe first (errors before warns).
 */
export function evaluateGuardrails(
  candidate: ScheduleActivityInput,
  existing: ReadonlyArray<ScheduleActivityInput>,
  credentials: ReadonlyArray<CredentialInput>,
  opts: GuardrailOptions = {},
): GuardrailViolation[] {
  const restFloor = opts.restFloorHours ?? DEFAULT_REST_FLOOR_HOURS;
  const weeklyCap = opts.weeklyHoursCap ?? DEFAULT_WEEKLY_HOURS_CAP;
  const errors: GuardrailViolation[] = [];
  const warns: GuardrailViolation[] = [];

  const peers = existing.filter((a) => a.id !== candidate.id);
  const sameResource = candidate.resourceRef
    ? peers.filter((a) => a.resourceRef && a.resourceRef === candidate.resourceRef)
    : [];

  // 1. Expired credential (error) — a required credential expired before start.
  if (candidate.resourceRef) {
    for (const c of credentials) {
      if (c.resourceRef !== candidate.resourceRef) continue;
      if (c.expiresOn && ms(c.expiresOn) < ms(candidate.startsAt)) {
        errors.push({
          code: "expired_credential",
          level: "error",
          message: `${c.label} expired ${c.expiresOn.slice(0, 10)} — before this activity starts`,
          activityId: candidate.id,
          resourceRef: candidate.resourceRef,
        });
      }
    }
  }

  // 2. Cross-location double-book (error) — same resource overlapping on a
  //    different location. Overlap on the SAME location is a stacking choice,
  //    not a physical impossibility, so only cross-location conflicts block.
  for (const a of sameResource) {
    if (!overlaps(candidate.startsAt, candidate.endsAt, a.startsAt, a.endsAt)) continue;
    if (candidate.locationId && a.locationId && candidate.locationId !== a.locationId) {
      errors.push({
        code: "double_book",
        level: "error",
        message: "Resource is already booked at another location during this window",
        activityId: candidate.id,
        resourceRef: candidate.resourceRef,
      });
      break; // one is enough to block
    }
  }

  // 3. Minimum rest window (warn) — the closest adjacent activity (before or
  //    after, non-overlapping) leaves less than the rest floor.
  let tightestRest = Infinity;
  for (const a of sameResource) {
    if (overlaps(candidate.startsAt, candidate.endsAt, a.startsAt, a.endsAt)) continue;
    const gap =
      ms(a.startsAt) >= ms(candidate.endsAt)
        ? hoursBetween(candidate.endsAt, a.startsAt) // a is after
        : hoursBetween(a.endsAt, candidate.startsAt); // a is before
    if (gap < tightestRest) tightestRest = gap;
  }
  if (tightestRest < restFloor) {
    warns.push({
      code: "min_rest",
      level: "warn",
      message: `Only ${tightestRest.toFixed(1)}h rest around this activity (floor ${restFloor}h)`,
      activityId: candidate.id,
      resourceRef: candidate.resourceRef,
    });
  }

  // 4. Fair-workweek cap (warn) — the resource's total scheduled hours in the
  //    candidate's ISO week (including this activity) exceed the cap.
  if (candidate.resourceRef) {
    const week = isoWeekKey(candidate.startsAt);
    let weekHours = hoursBetween(candidate.startsAt, candidate.endsAt);
    for (const a of sameResource) {
      if (isoWeekKey(a.startsAt) === week) weekHours += hoursBetween(a.startsAt, a.endsAt);
    }
    if (weekHours > weeklyCap) {
      warns.push({
        code: "max_hours",
        level: "warn",
        message: `${weekHours.toFixed(1)}h scheduled this week for the resource (cap ${weeklyCap}h)`,
        activityId: candidate.id,
        resourceRef: candidate.resourceRef,
      });
    }
  }

  return [...errors, ...warns];
}

/** True when any `error`-level violation is present (blocks publish/write). */
export function hasBlockingViolation(violations: ReadonlyArray<GuardrailViolation>): boolean {
  return violations.some((v) => v.level === "error");
}
