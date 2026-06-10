import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiCreated, apiError, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { toZapierTask } from "@/lib/integrations/zapier/payloads";
import { createClient } from "@/lib/supabase/server";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

/**
 * Zapier action — creates a task. `project_id` is optional (org-level
 * tasks exist), but if supplied it MUST resolve to a project in the
 * caller's org — RLS would block it anyway, but we 404 early for a
 * better Zapier UX.
 */
export const dynamic = "force-dynamic";

const Schema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  project_id: z.string().uuid().optional(),
  task_state: z.enum(["todo", "in_progress", "blocked", "review", "done"]).optional(),
  priority: z.number().int().min(1).max(5).optional(),
  due_at: z.string().datetime({ offset: true }).optional(),
  assigned_to: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  // Zapier-side actions can fire from a misconfigured Zap and create
  // hundreds of tasks in seconds. Bind to the write bucket (60/min).
  const rl = await ratelimit({
    key: keyFromRequest(req, "zapier:create-task"),
    ...RATE_BUDGETS.write,
  });
  if (!rl.ok) return apiError("rate_limited", "Zapier task-create rate limit reached");

  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const denial = assertCapability(session, "tasks:write");
    if (denial) return denial;

    const supabase = await createClient();

    if (input.project_id) {
      const { data: project } = await supabase
        .from("projects")
        .select("id")
        .eq("id", input.project_id)
        .eq("org_id", session.orgId)
        .is("deleted_at", null)
        .maybeSingle();
      if (!project) return apiError("not_found", "Project not found in your organization");
    }

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        org_id: session.orgId,
        project_id: input.project_id ?? null,
        title: input.title,
        description: input.description ?? null,
        task_state: input.task_state ?? "todo",
        priority: input.priority ?? 3,
        due_at: input.due_at ?? null,
        assigned_to: input.assigned_to ?? null,
        created_by: session.userId,
      })
      .select("id, title, description, task_state, priority, project_id, assigned_to, due_at, created_at, updated_at")
      .single();
    if (error) return apiError("internal", error.message);
    return apiCreated(toZapierTask(data));
  });
}
