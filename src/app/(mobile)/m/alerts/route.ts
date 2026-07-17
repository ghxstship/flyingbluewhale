import { NextResponse } from "next/server";

/**
 * /m/alerts → /m/notifications.
 *
 * The feed used to live here while /m/notifications held the preference
 * matrix — the bell's route and the settings surface had swapped clothes
 * (kit 28: the bell IS Notifications, the matrix belongs under Settings).
 * The route survives as a redirect because delivered push payloads carry
 * `url: "/m/alerts"` as their tap target, and a notification that 404s on
 * tap is worse than the bug that was fixed.
 */
export function GET(request: Request) {
  return NextResponse.redirect(new URL("/m/notifications", request.url), 308);
}
