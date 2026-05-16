import type { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { apiError, apiOk } from "@/lib/api";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { sendPushTo } from "@/lib/push/send";

function tokensMatch(provided: string, expected: string): boolean {
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

/**
 * Internal cron: sweep all orgs for open time_entries past their grace period
 * and fan-out push notifications to affected users.
 * Competitive parity: Connecteam "Late clock out" alert (2026).
 *
 * Call pattern: POST with `Authorization: Bearer <JOB_WORKER_TOKEN>`.
 * Recommended cron frequency: every 15 minutes.
 */
export async function POST(req: NextRequest) {
  const expected = process.env.JOB_WORKER_TOKEN;
  if (!expected) return apiError("service_unavailable", "JOB_WORKER_TOKEN not configured");
  const auth = req.headers.get("authorization") ?? "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : (req.headers.get("x-worker-token") ?? "");
  if (!tokensMatch(provided, expected)) return apiError("forbidden", "Invalid worker token");

  if (!isServiceClientAvailable()) return apiError("service_unavailable", "Supabase not configured");
  const supabase = createServiceClient();

  // Fetch all orgs with clock alerts enabled
  const { data: alertOrgs } = await supabase
    .from("clock_alert_settings")
    .select("org_id, grace_minutes")
    .eq("enabled", true);

  if (!alertOrgs || alertOrgs.length === 0) return apiOk({ swept: 0, notified: 0 });

  let notified = 0;
  for (const { org_id } of alertOrgs as Array<{ org_id: string; grace_minutes: number }>) {
    const { data: overdue } = await supabase
      .rpc("get_overdue_clock_ins", { p_org_id: org_id })
      .limit(100);

    if (!overdue || overdue.length === 0) continue;

    for (const entry of overdue as Array<{ user_id: string; hours_elapsed: number }>) {
      await sendPushTo(entry.user_id, {
        title: "Don't forget to clock out",
        body: `You've been clocked in for ${entry.hours_elapsed}h. Tap to review your time.`,
        url: "/m/clock",
        kind: "clock_alert",
      });
      notified++;
    }
  }

  return apiOk({ swept: alertOrgs.length, notified });
}
