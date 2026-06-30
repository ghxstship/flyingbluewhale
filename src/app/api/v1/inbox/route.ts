import { apiOk } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { listInbox } from "@/lib/db/inbox";

/**
 * GET /api/v1/inbox — the calling user's unified triage queue (unread
 * notifications + their own not-done tasks), newest / most-overdue first.
 * Self-scoped to the session user via the v_inbox_items view.
 */
export async function GET() {
  return withAuth(async (session) => {
    const items = await listInbox(session.orgId);
    return apiOk({ items, count: items.length });
  });
}
