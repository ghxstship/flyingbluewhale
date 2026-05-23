import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Notifications index — feeds the <NotificationsBell> in the glass nav
 * + the full /me/notifications/inbox surface.
 *
 * GET   — 50 most recent for the session user + unread count. Scope is
 *         `user_id = session.userId`; RLS enforces org boundary.
 * PATCH — bulk state transitions on caller's own rows. Supports:
 *           • `{ ids: [...] }`                      → mark read
 *           • `{ readAll: true }`                   → mark all unread read
 *           • `{ ids: [...], done: true }`          → mark done
 *           • `{ ids: [...], snoozedUntil: ISO }`   → snooze
 *           • `{ ids: [...], undo: true }`          → clear read/done/snooze
 */

const PatchSchema = z.object({
  ids: z.array(z.string().uuid()).max(500).optional(),
  readAll: z.boolean().optional(),
  done: z.boolean().optional(),
  snoozedUntil: z.string().datetime().nullable().optional(),
  undo: z.boolean().optional(),
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

    // Build the update payload from the input variant. `undo` clears
    // all three discipline columns; otherwise the named field is set.
    const patch: Record<string, string | null> = {};
    if (input.undo) {
      patch.read_at = null;
      patch.done_at = null;
      patch.snoozed_until = null;
    } else if (input.done) {
      patch.done_at = now;
      // Done implies read.
      patch.read_at = now;
    } else if (input.snoozedUntil !== undefined) {
      patch.snoozed_until = input.snoozedUntil;
    } else {
      // Default = mark-read flavor (readAll / ids-read).
      patch.read_at = now;
    }

    let q = supabase
      .from("notifications")
      .update(patch as never)
      .eq("user_id", session.userId);
    if (input.ids && input.ids.length > 0) {
      q = q.in("id", input.ids);
    } else if (input.readAll) {
      q = q.is("read_at", null);
    } else {
      return apiError("bad_request", "Pass ids[] or readAll=true");
    }
    const { error, data } = await q.select("id");
    if (error) return apiError("internal", error.message);
    return apiOk({ updated: data?.length ?? 0 });
  });
}
