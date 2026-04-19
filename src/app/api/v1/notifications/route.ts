import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Notifications index — feeds the <NotificationsBell> in the glass nav.
 *
 * GET  — returns the 50 most recent notifications for the session user,
 *        plus an `unread` count. Scope is `user_id = session.userId`;
 *        RLS on the table already enforces org boundary.
 * PATCH — marks a list of notifications as read by id. Zero-arg form
 *        marks every unread row read (inbox-zero convenience).
 */

const PatchSchema = z.object({
  ids: z.array(z.string().uuid()).max(500).optional(),
  readAll: z.boolean().optional(),
});

export async function GET() {
  return withAuth(async (session) => {
    const supabase = await createClient();
    const [{ data: rows, error }, { count }] = await Promise.all([
      supabase
        .from("notifications")
        .select("id, title, body, href, read_at, created_at")
        .eq("user_id", session.userId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", session.userId)
        .is("deleted_at", null)
        .is("read_at", null),
    ]);
    if (error) return apiError("internal", error.message);
    return apiOk({ notifications: rows ?? [], unread: count ?? 0 });
  });
}

export async function PATCH(req: NextRequest) {
  const input = await parseJson(req, PatchSchema);
  if (input instanceof Response) return input;
  return withAuth(async (session) => {
    const supabase = await createClient();
    const now = new Date().toISOString();
    let q = supabase
      .from("notifications")
      .update({ read_at: now })
      .eq("user_id", session.userId)
      .is("read_at", null);
    if (input.ids && input.ids.length > 0) {
      q = q.in("id", input.ids);
    } else if (!input.readAll) {
      return apiError("bad_request", "Pass ids[] or readAll=true");
    }
    const { error, data } = await q.select("id");
    if (error) return apiError("internal", error.message);
    return apiOk({ updated: data?.length ?? 0 });
  });
}
