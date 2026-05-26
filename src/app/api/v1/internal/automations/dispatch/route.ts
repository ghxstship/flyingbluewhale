import type { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { apiError, apiOk } from "@/lib/api";
import { env } from "@/lib/env";
import { drainPending } from "@/lib/automations/dispatch";

function tokensMatch(provided: string, expected: string): boolean {
  // Constant-time — string `===` short-circuits on first mismatch
  // and leaks one character per request via response timing.
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

/**
 * Internal-only — drain `domain_events` and enqueue `automation.run` jobs
 * for matching subscriptions. Phase 4.3 of the SmartSuite parity roadmap.
 *
 * The job-worker (Edge Function, Deno runtime) cannot import `src/lib/*`
 * directly, so it tick-loops by hitting this Next.js route on a 1-min cron.
 * Auth: shared `JOB_WORKER_TOKEN` via `x-worker-token` header — same
 * pattern as the existing `automation.run` callback.
 */

export async function POST(req: NextRequest) {
  const expected = env.JOB_WORKER_TOKEN;
  if (!expected) return apiError("service_unavailable", "JOB_WORKER_TOKEN not configured");
  const auth = req.headers.get("authorization") ?? "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : (req.headers.get("x-worker-token") ?? "");
  if (!tokensMatch(provided, expected)) return apiError("forbidden", "Invalid worker token");

  const result = await drainPending({ batchSize: 100 });
  return apiOk(result);
}
