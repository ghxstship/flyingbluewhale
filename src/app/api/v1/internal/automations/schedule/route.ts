import type { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api";
import { evaluateSchedules } from "@/lib/automations/schedule";

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
  if (provided !== expected) return apiError("forbidden", "Invalid worker token");

  const result = await evaluateSchedules();
  return apiOk(result);
}
