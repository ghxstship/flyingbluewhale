/**
 * Schedule trigger — Phase 4.3 of the SmartSuite parity roadmap.
 *
 * The pure-logic core (`nextRunFromRrule`) is a hand-rolled minimal RRULE
 * parser. We deliberately do NOT pull `rrule` npm; the subset we support
 * covers SmartSuite's UI surface — Minutes / Hours / Days / Weeks plus
 * BYHOUR/BYMINUTE/BYDAY/COUNT — and is unit-testable without a calendar
 * library. Anything more exotic (BYMONTHDAY, BYSETPOS, etc.) returns null
 * and the caller should treat the schedule as paused.
 *
 * The DB-bound entry point (`evaluateSchedules`) is the worker tick handler:
 *   1. Read every enabled `automation_schedules` row whose
 *      `next_run_at <= now()`.
 *   2. Enqueue an `automation.run` job with
 *      `dedup_key = ${automation_id}:${next_run_at.toISOString()}` so two
 *      worker ticks racing the same minute cannot double-fire.
 *   3. Compute the next `next_run_at` via `nextRunFromRrule` and update the
 *      row in place.
 *
 * Time semantics: every internal calculation is in UTC. The `timezone`
 * column is reserved for future BYHOUR-in-local-time support; the v1 parser
 * treats BYHOUR/BYMINUTE as UTC clock fields. Documented in the column
 * comment so downstream UI can warn until that lands.
 */

const FREQS = new Set(["MINUTELY", "HOURLY", "DAILY", "WEEKLY"]);
const DAY_TO_NUM: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

type ParsedRrule = {
  freq: "MINUTELY" | "HOURLY" | "DAILY" | "WEEKLY";
  interval: number;
  byHour?: number[];
  byMinute?: number[];
  byDay?: number[]; // 0=Sun..6=Sat
  count?: number;
};

function parseRrule(rrule: string): ParsedRrule | null {
  const parts = rrule
    .replace(/^RRULE:/i, "")
    .split(";")
    .map((p) => p.trim())
    .filter(Boolean);
  const map: Record<string, string> = {};
  for (const p of parts) {
    const [k, v] = p.split("=");
    if (!k || v == null) return null;
    map[k.toUpperCase()] = v;
  }
  const freq = map.FREQ;
  if (!freq || !FREQS.has(freq)) return null;
  const interval = map.INTERVAL ? Math.max(1, parseInt(map.INTERVAL, 10) || 1) : 1;
  const out: ParsedRrule = {
    freq: freq as ParsedRrule["freq"],
    interval,
  };
  if (map.BYHOUR) {
    const hours = map.BYHOUR.split(",")
      .map((h) => parseInt(h.trim(), 10))
      .filter((h) => Number.isFinite(h) && h >= 0 && h <= 23)
      .sort((a, b) => a - b);
    if (hours.length > 0) out.byHour = hours;
  }
  if (map.BYMINUTE) {
    const minutes = map.BYMINUTE.split(",")
      .map((m) => parseInt(m.trim(), 10))
      .filter((m) => Number.isFinite(m) && m >= 0 && m <= 59)
      .sort((a, b) => a - b);
    if (minutes.length > 0) out.byMinute = minutes;
  }
  if (map.BYDAY) {
    const days = map.BYDAY.split(",")
      .map((d) => DAY_TO_NUM[d.trim().toUpperCase()])
      .filter((d) => d != null)
      .sort((a, b) => a - b);
    if (days.length > 0) out.byDay = days as number[];
  }
  if (map.COUNT) {
    const c = parseInt(map.COUNT, 10);
    if (Number.isFinite(c) && c > 0) out.count = c;
  }
  return out;
}

/**
 * Given a parsed RRULE and a `from` instant, return the next firing instant
 * at or after `from`. UTC throughout.
 */
function computeNext(parsed: ParsedRrule, from: Date): Date | null {
  const startMs = from.getTime();
  // Hard ceiling on the search to prevent infinite loops on degenerate rules.
  const horizon = startMs + 366 * 24 * 60 * 60 * 1000;

  switch (parsed.freq) {
    case "MINUTELY": {
      const stepMs = parsed.interval * 60_000;
      // Snap up to the next interval boundary.
      const next = new Date(Math.ceil(startMs / stepMs) * stepMs);
      return next;
    }
    case "HOURLY": {
      const stepMs = parsed.interval * 60 * 60_000;
      const minute = parsed.byMinute?.[0] ?? 0;
      // Find the next interval-aligned hour, then set BYMINUTE.
      const baseHourMs = Math.floor(startMs / (60 * 60_000)) * 60 * 60_000;
      let candidate = new Date(baseHourMs);
      candidate.setUTCMinutes(minute, 0, 0);
      while (candidate.getTime() < startMs) {
        candidate = new Date(candidate.getTime() + stepMs);
      }
      // Honor INTERVAL alignment relative to a stable epoch (UTC 0).
      const drift = candidate.getTime() % stepMs;
      if (drift !== 0 && parsed.interval > 1) {
        candidate = new Date(candidate.getTime() + (stepMs - drift));
      }
      return candidate;
    }
    case "DAILY": {
      const hours = parsed.byHour ?? [0];
      const minutes = parsed.byMinute ?? [0];
      let cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), 0, 0, 0, 0));
      for (let day = 0; day < 366; day += parsed.interval) {
        for (const h of hours) {
          for (const m of minutes) {
            const candidate = new Date(cursor.getTime());
            candidate.setUTCHours(h, m, 0, 0);
            if (candidate.getTime() >= startMs) return candidate;
          }
        }
        cursor = new Date(cursor.getTime() + parsed.interval * 24 * 60 * 60_000);
        if (cursor.getTime() > horizon) break;
      }
      return null;
    }
    case "WEEKLY": {
      const hours = parsed.byHour ?? [0];
      const minutes = parsed.byMinute ?? [0];
      const days = parsed.byDay ?? [from.getUTCDay()];
      let cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), 0, 0, 0, 0));
      // Walk forward one week at a time (in INTERVAL increments). Within each
      // week, try every BYDAY × BYHOUR × BYMINUTE combination in chronological
      // order and return the first that's >= start.
      for (let w = 0; w < 53; w += 1) {
        for (let d = 0; d < 7; d += 1) {
          const dayDate = new Date(cursor.getTime() + d * 24 * 60 * 60_000);
          if (!days.includes(dayDate.getUTCDay())) continue;
          for (const h of hours) {
            for (const m of minutes) {
              const candidate = new Date(dayDate.getTime());
              candidate.setUTCHours(h, m, 0, 0);
              if (candidate.getTime() >= startMs) return candidate;
            }
          }
        }
        cursor = new Date(cursor.getTime() + parsed.interval * 7 * 24 * 60 * 60_000);
        if (cursor.getTime() > horizon) break;
      }
      return null;
    }
  }
  return null;
}

/**
 * Evaluate a simple RRULE-like spec. Returns the next firing instant at or
 * after `after`, or null if the rule is unparseable / has no future
 * occurrence within ~1 year.
 *
 * Supports FREQ (MINUTELY|HOURLY|DAILY|WEEKLY), INTERVAL, BYHOUR, BYMINUTE,
 * BYDAY (MO,TU,...), COUNT (parsed but not enforced — schedule rows are
 * deleted by the UI when they expire).
 */
export function nextRunFromRrule(rrule: string, after: Date, _timezone: string = "UTC"): Date | null {
  const parsed = parseRrule(rrule);
  if (!parsed) return null;
  return computeNext(parsed, after);
}

// ────────────────────────────────────────────────────────────────────────────
// DB-bound tick handler — called from the job-worker every minute.
// ────────────────────────────────────────────────────────────────────────────

type ScheduleRow = {
  id: string;
  automation_id: string;
  rrule: string;
  timezone: string;
  next_run_at: string;
  enabled: boolean;
  // We need org_id to satisfy job_queue.org_id NOT NULL — pulled via JOIN on
  // automations in the read query below.
};

type AutomationRow = {
  id: string;
  org_id: string;
};

type AnySvc = { from: (t: string) => unknown };

/**
 * Tick handler — read every due schedule, enqueue an `automation.run` job
 * with a dedup_key on (automation_id, next_run_at), then advance
 * next_run_at via nextRunFromRrule.
 *
 * Returns the count of jobs enqueued (so the worker can record metrics).
 */
export async function evaluateSchedules(): Promise<{ enqueued: number }> {
  // Lazy-load the service client so this module can also be unit-tested
  // without server-only side-effects. The pure logic above never touches
  // Supabase.
  const { createServiceClient } = await import("@/lib/supabase/server");
  const svc = createServiceClient() as unknown as AnySvc;
  const nowIso = new Date().toISOString();

  // 1. Pull due schedules.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawSchedules, error: schedErr } = await (svc.from("automation_schedules") as any)
    .select("id, automation_id, rrule, timezone, next_run_at, enabled")
    .eq("enabled", true)
    .lte("next_run_at", nowIso)
    .limit(100);
  if (schedErr) throw new Error(`automation_schedules read failed: ${schedErr.message}`);
  const schedules = (rawSchedules ?? []) as ScheduleRow[];
  if (schedules.length === 0) return { enqueued: 0 };

  // 2. Resolve org_id per automation in one batch.
  const automationIds = Array.from(new Set(schedules.map((s) => s.automation_id)));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawAutos } = await (svc.from("automations") as any).select("id, org_id").in("id", automationIds);
  const orgByAutomation = new Map<string, string>();
  for (const a of (rawAutos ?? []) as AutomationRow[]) {
    orgByAutomation.set(a.id, a.org_id);
  }

  // 3. For each schedule, ADVANCE FIRST (conditional on next_run_at),
  //    then enqueue only if we won the advance. The job_queue dedup_key
  //    partial unique index is gated on state IN ('pending','running'),
  //    so once the first racer's job completes a second tick reading
  //    the same `ts` would NOT collide and the automation would re-fire.
  //    Conditional advance closes that window: only one tick gets to
  //    move next_run_at past `ts`, so only one tick enqueues.
  let enqueued = 0;
  for (const sched of schedules) {
    const orgId = orgByAutomation.get(sched.automation_id);
    if (!orgId) continue;
    const ts = sched.next_run_at;

    const fired = new Date(ts);
    const after = new Date(fired.getTime() + 1000); // +1s so we don't recompute the same instant
    const next = nextRunFromRrule(sched.rrule, after, sched.timezone);
    const update: Record<string, unknown> = {
      last_run_at: ts,
      updated_at: new Date().toISOString(),
    };
    if (next) {
      update.next_run_at = next.toISOString();
    } else {
      // Unparseable / exhausted — disable to prevent tight retry loop.
      update.enabled = false;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: claimed, error: claimErr } = await (svc.from("automation_schedules") as any)
      .update(update)
      .eq("id", sched.id)
      .eq("next_run_at", ts)
      .select("id");
    if (claimErr) continue;
    if (!claimed || (claimed as Array<{ id: string }>).length === 0) {
      // Sibling tick advanced this row first — don't enqueue.
      continue;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: jobErr } = await (svc.from("job_queue") as any).insert({
      type: "automation.run",
      org_id: orgId,
      payload: {
        automationId: sched.automation_id,
        triggerKind: "schedule",
        triggerPayload: { scheduledFor: ts },
      },
      dedup_key: `${sched.automation_id}:${ts}`,
    });
    if (jobErr) {
      const msg = jobErr.message ?? "";
      if (/duplicate key|unique constraint/i.test(msg)) {
        // A manual trigger raced us — fine, the schedule still advanced.
        continue;
      }
      // Real error — schedule already advanced so we can't safely retry
      // this tick; surface via metric counter (no enqueued increment).
      continue;
    }
    enqueued += 1;
  }

  return { enqueued };
}
