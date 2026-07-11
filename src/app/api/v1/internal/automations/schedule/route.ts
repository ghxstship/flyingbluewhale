import type { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { apiError, apiOk } from "@/lib/api";
import { evaluateSchedules } from "@/lib/automations/schedule";
import { evaluateAdvanceDeadlines } from "@/lib/automations/advance-deadlines";

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

export async function POST(req: NextRequest) {
  const expected = process.env.JOB_WORKER_TOKEN;
  if (!expected) return apiError("service_unavailable", "JOB_WORKER_TOKEN not configured");
  const auth = req.headers.get("authorization") ?? "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : (req.headers.get("x-worker-token") ?? "");
  if (!tokensMatch(provided, expected)) return apiError("forbidden", "Invalid worker token");

  const result = await evaluateSchedules();
  // Kit 27 — the advance chase ladder rides the same worker tick: due
  // advance_deadline_events emit advance.deadline.* domain events, which
  // the dispatch drain fans out to the seeded chase automations.
  const advance = await evaluateAdvanceDeadlines();
  return apiOk({ ...result, advance });
}
