// Structured JSON logger. One line per event, correlatable by request_id.
// In development we pretty-print for local legibility; in production we emit
// compact JSON so Vercel/Datadog/etc. can index the fields without a parser.
//
// Sentry integration: `error` entries also go to Sentry.captureException when
// an Error instance is supplied, so Sentry stays the source of truth for
// alerts while logs stay the source of truth for context.

import * as Sentry from "@sentry/nextjs";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogFields = {
  /** RFC-4122 request id propagated through the x-request-id header. */
  request_id?: string;
  /** Authenticated user id, when available. Never include email / PII. */
  user_id?: string;
  /** Active org id, when the request is org-scoped. */
  org_id?: string;
  /** HTTP method. */
  method?: string;
  /** Route pattern (`/api/v1/tickets/[id]`), NOT the interpolated path. */
  route?: string;
  /** Response status code. */
  status?: number;
  /** Handler duration in ms (rounded to 1 decimal). */
  duration_ms?: number;
  /** Stable event name — dotted, e.g. `auth.webauthn.verified`. */
  event?: string;
  [k: string]: unknown;
};

const LEVEL_WEIGHT: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const MIN_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel | undefined) ?? "info";
const IS_PROD = process.env.NODE_ENV === "production";

function emit(level: LogLevel, message: string, fields: LogFields = {}, err?: unknown): void {
  if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[MIN_LEVEL]) return;
  const record = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    ...fields,
    ...(err instanceof Error ? { err_name: err.name, err_msg: err.message, stack: err.stack } : {}),
  };
  const line = IS_PROD ? JSON.stringify(record) : prettyLine(record);
  const writer = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  writer(line);
  if (level === "error" && err instanceof Error) {
    Sentry.captureException(err, { extra: fields as Record<string, unknown> });
  } else if (level === "error") {
    Sentry.captureMessage(message, { level: "error", extra: fields as Record<string, unknown> });
  }
}

function prettyLine(record: Record<string, unknown>): string {
  const { ts, level, msg, ...rest } = record as { ts: string; level: string; msg: string } & Record<string, unknown>;
  const tag = level.toUpperCase().padEnd(5);
  const ctx = Object.keys(rest).length ? " " + JSON.stringify(rest) : "";
  return `${ts} ${tag} ${msg}${ctx}`;
}

export const log = {
  debug: (msg: string, fields?: LogFields) => emit("debug", msg, fields),
  info: (msg: string, fields?: LogFields) => emit("info", msg, fields),
  warn: (msg: string, fields?: LogFields, err?: unknown) => emit("warn", msg, fields, err),
  error: (msg: string, fields?: LogFields, err?: unknown) => emit("error", msg, fields, err),
};

/**
 * Time an async handler and emit one `request.completed` log line with the
 * duration + status. Also returns the duration so the caller can add a
 * `Server-Timing` response header for browser DevTools correlation.
 */
export async function timed<T>(
  ctx: { route: string; method: string; request_id?: string; user_id?: string; org_id?: string },
  fn: () => Promise<T>,
): Promise<{ result: T; duration_ms: number }> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration_ms = Math.round((performance.now() - start) * 10) / 10;
    log.info("request.completed", { ...ctx, duration_ms });
    return { result, duration_ms };
  } catch (err) {
    const duration_ms = Math.round((performance.now() - start) * 10) / 10;
    log.error("request.failed", { ...ctx, duration_ms }, err);
    throw err;
  }
}

/** Build a Server-Timing value so browsers can surface handler latency. */
export function serverTiming(duration_ms: number, label = "app"): string {
  return `${label};dur=${duration_ms}`;
}
