import type { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { sendPushTo } from "@/lib/push/send";
import { hasVapid } from "@/lib/push/vapid";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

/**
 * Send a test push to the calling user's registered devices (Phase 2.3).
 * Used by the `/me/notifications/push` "Send Test" button so users can
 * verify their browser actually receives notifications.
 */

export async function POST(req: NextRequest) {
  // Test-push endpoint can DoS the push provider quota — bound to the
  // write bucket (60/min) so the "send test" button can't spam beyond
  // a single user's reasonable click cadence.
  const rl = await ratelimit({
    key: keyFromRequest(req, "push:test"),
    ...RATE_BUDGETS.write,
  });
  if (!rl.ok) return apiError("rate_limited", "Push test rate limit reached");

  if (!hasVapid()) {
    return apiError("service_unavailable", "Web Push is not configured on the server.");
  }
  return withAuth(async (session) => {
    const result = await sendPushTo(session.userId, {
      title: "Hello from LYTEHAUS",
      body: "Push notifications are working on this device.",
      url: "/me/notifications/inbox",
      tag: "lytehaus-test",
      data: { event: "push.test" },
    });
    return apiOk(result);
  });
}
