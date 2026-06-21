import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiCreated, apiError, apiOk, parseJson } from "@/lib/api";
import { assertScope, withAuth } from "@/lib/auth";
import { withIdempotency } from "@/lib/idempotency";
import { createClient } from "@/lib/supabase/server";

/** /api/v1/tasks/[taskId]/comments — task discussion thread + activity journal. */

const CreateSchema = z.object({
  body: z.string().min(1).max(8000),
  mentions: z.array(z.string().uuid()).max(50).optional(),
});

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
      .from("task_comments")
      .select("id, task_id, author_id, body, mentions, created_at, updated_at")
      .eq("org_id", session.orgId)
      .eq("task_id", taskId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) return apiError("internal", error.message);
    return apiOk({ comments: data ?? [] });
  });
}

// Wrapped with `withIdempotency` so client retries don't create duplicate
// comments. Client opt-in via Idempotency-Key header.
async function postHandler(req: NextRequest, ctx: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await ctx.params;
  const input = await parseJson(req, CreateSchema);
  if (input instanceof Response) return input;
  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const denied = assertScope(session, "tasks:write");
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
      .from("task_comments")
      .insert({
        org_id: session.orgId,
        task_id: taskId,
        author_id: session.userId,
        body: input.body,
        mentions: input.mentions ?? [],
      })
      .select("id, task_id, author_id, body, mentions, created_at")
      .single();
    if (error) return apiError("internal", error.message);

    // Append-only activity journal — mirror the comment into task_events.
    const { error: eventError } = await supabase.from("task_events").insert({
      org_id: session.orgId,
      task_id: taskId,
      event_kind: "comment",
      actor_id: session.userId,
      body: input.body,
    });
    if (eventError) {
      const { log } = await import("@/lib/log");
      log.warn("task_comments.event_failed", { err: eventError.message });
    }

    return apiCreated({ comment: data });
  });
}

// `withIdempotency` wraps a single-arg `(req)` handler, so recover the
// dynamic `taskId` from the request path rather than the route ctx.
export const POST = withIdempotency((req) => {
  const segments = new URL(req.url).pathname.split("/");
  const taskId = segments[segments.indexOf("tasks") + 1] ?? "";
  return postHandler(req, { params: Promise.resolve({ taskId }) });
});
