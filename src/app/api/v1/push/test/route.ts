import { apiError, apiOk } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { sendPushTo } from "@/lib/push/send";
import { hasVapid } from "@/lib/push/vapid";

/**
 * Send a test push to the calling user's registered devices (Phase 2.3).
 * Used by the `/me/notifications/push` "Send Test" button so users can
 * verify their browser actually receives notifications.
 */

export async function POST() {
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
