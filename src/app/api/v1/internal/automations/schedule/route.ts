import type { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { apiError, apiOk } from "@/lib/api";
import { evaluateSchedules } from "@/lib/automations/schedule";
import { evaluateAdvanceDeadlines } from "@/lib/automations/advance-deadlines";
import { evaluateDeferredPushes } from "@/lib/push/flush";
import { evaluateSavedSearches } from "@/lib/automations/saved-searches";

function tokensMatch(provided: string, expected: string): boolean {
  // Constant-time — string `===` short-circuits on first mismatch
  // and leaks one character per request via response timing.
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

/**
 * Internal-only — evaluate `automation_schedules` and enqueue
 * `automation.run` jobs whose `next_run_at <= now()`. Phase 4.3 of the
 * SmartSuite parity roadmap.
 *
 * Same call pattern as `/api/v1/internal/automations/dispatch`: the
 * job-worker cron-pings this route every minute.
 */

async function runTick() {
  const result = await evaluateSchedules();
  // Kit 27 — the advance chase ladder rides the same worker tick: due
  // advance_deadline_events emit advance.deadline.* domain events, which
  // the dispatch drain fans out to the seeded chase automations.
  const advance = await evaluateAdvanceDeadlines();
  // T1-2 push discipline — drain due deferred/digest pushes on the same
  // tick (quiet-hours end + digest windows). No new cron.
  const pushFlush = await evaluateDeferredPushes();
  // Marketplace saved-search alerts — the alert_email/alert_push flags had
  // no evaluator until this rode the same tick.
  const savedSearches = await evaluateSavedSearches();
  return apiOk({ ...result, advance, pushFlush, savedSearches });
}

export async function POST(req: NextRequest) {
  const expected = process.env.JOB_WORKER_TOKEN;
  if (!expected) return apiError("service_unavailable", "JOB_WORKER_TOKEN not configured");
  const auth = req.headers.get("authorization") ?? "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : (req.headers.get("x-worker-token") ?? "");
  if (!tokensMatch(provided, expected)) return apiError("forbidden", "Invalid worker token");
  return runTick();
}

/**
 * Vercel-cron entry (comms audit follow-up: `vercel.json crons` was empty,
 * so nothing in-repo ever ticked this worker — the chase ladder and
 * saved-search alerts only ran if external infra pinged POST). Vercel crons
 * issue GET with `Authorization: Bearer ${CRON_SECRET}` when that env is
 * set; without CRON_SECRET the handler answers 503 and the cron is a no-op,
 * so an external POST pinger keeps working unchanged.
 */
export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return apiError("service_unavailable", "CRON_SECRET not configured");
  const auth = req.headers.get("authorization") ?? "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!tokensMatch(provided, expected)) return apiError("forbidden", "Invalid cron secret");
  return runTick();
}
