// Env-gated Sentry shim. Swap for @sentry/nextjs when you wire it.
import { env, hasSentry } from "./env";

type SentryLevel = "fatal" | "error" | "warning" | "info" | "debug";

export function captureException(err: unknown, extras?: Record<string, unknown>) {
  if (!hasSentry) {
    // local dev: just console.error
    console.error("[error]", err, extras);
    return;
  }
  // Lazy-load to avoid bundling when unused.
  // Consumer should install @sentry/nextjs and replace this with the real init.
  // Kept as a shim so callers can opt into reporting without forcing the dep.
  try {
    fetch(`${env.NEXT_PUBLIC_SENTRY_DSN}`, {
      method: "POST",
      body: JSON.stringify({ level: "error", message: String(err), extras, at: new Date().toISOString() }),
    }).catch(() => {});
  } catch {
    // silent
  }
}

export function captureMessage(msg: string, level: SentryLevel = "info", extras?: Record<string, unknown>) {
  if (!hasSentry) return;
  try {
    fetch(`${env.NEXT_PUBLIC_SENTRY_DSN}`, {
      method: "POST",
      body: JSON.stringify({ level, message: msg, extras, at: new Date().toISOString() }),
    }).catch(() => {});
  } catch {
    // silent
  }
}
