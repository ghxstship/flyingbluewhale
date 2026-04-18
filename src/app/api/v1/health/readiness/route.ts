import { apiError, apiOk } from "@/lib/api";
import { env, hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Readiness probe. Returns 200 iff the instance is able to serve real
 * traffic: database reachable under a short timeout, required env vars
 * populated. Orchestrators use this to decide whether to route traffic
 * to the instance — never auto-restart on a failing readiness.
 *
 * Per-check timeouts are intentionally short (1.5s) so a slow dep never
 * wedges the probe itself.
 */
const DB_TIMEOUT_MS = 1500;

type Check = { name: string; ok: boolean; duration_ms: number; detail?: string };

async function timedCheck(name: string, fn: () => Promise<void>): Promise<Check> {
  const start = performance.now();
  try {
    await fn();
    return { name, ok: true, duration_ms: Math.round((performance.now() - start) * 10) / 10 };
  } catch (err) {
    return {
      name,
      ok: false,
      duration_ms: Math.round((performance.now() - start) * 10) / 10,
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

async function checkEnv(): Promise<Check> {
  // Don't leak secret values, just assert required keys are present.
  const missing: string[] = [];
  if (!env.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return {
    name: "env",
    ok: missing.length === 0,
    duration_ms: 0,
    detail: missing.length ? `missing: ${missing.join(",")}` : undefined,
  };
}

async function checkDatabase(): Promise<Check> {
  if (!hasSupabase) {
    return { name: "database", ok: false, duration_ms: 0, detail: "supabase not configured" };
  }
  return timedCheck("database", async () => {
    const supabase = await createClient();
    // Tiny query against a table RLS will reject anonymously but still
    // confirms the connection is alive. `count: "exact"` + head avoids row
    // transfer. AbortSignal gives us a hard ceiling.
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), DB_TIMEOUT_MS);
    try {
      const { error } = await supabase
        .from("orgs")
        .select("id", { count: "exact", head: true })
        .abortSignal(ac.signal);
      // "permission denied" / "JWT expired" are fine — they prove the DB replied.
      // Only network-level / abort errors fail readiness.
      if (error && /abort|network|connection|timeout/i.test(error.message)) {
        throw new Error(error.message);
      }
    } finally {
      clearTimeout(timer);
    }
  });
}

export async function GET() {
  const [envCheck, dbCheck] = await Promise.all([checkEnv(), checkDatabase()]);
  const checks = [envCheck, dbCheck];
  const ok = checks.every((c) => c.ok);
  const body = { probe: "readiness", checks };
  if (!ok) return apiError("internal", "One or more readiness checks failed", { checks });
  return apiOk(body);
}
