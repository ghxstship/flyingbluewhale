import { type NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api";
import { assertScope, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** /api/v1/tasks/[taskId]/events — append-only task activity journal (read). */

export async function GET(_req: NextRequest, ctx: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await ctx.params;
  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const denied = assertScope(session, "tasks:read");
    if (denied) return denied;
    const supabase = await createClient();

    // Cross-tenant guard — the task must belong to the caller's org.
    const { data: task } = await supabase
      .from("tasks")
      .select("id")
      .eq("id", taskId)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (!task) return apiError("not_found", "Task not found in your organization");

    const { data, error } = await supabase
      .from("task_events")
      .select("id, task_id, event_kind, from_state, to_state, actor_id, body, created_at")
      .eq("org_id", session.orgId)
      .eq("task_id", taskId)
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) return apiError("internal", error.message);
    return apiOk({ events: data ?? [] });
  });
}
