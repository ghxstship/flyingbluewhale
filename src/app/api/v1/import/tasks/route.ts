import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiCreated, apiError, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { parseAndValidateCsv } from "@/lib/import/csv";
import { TaskRowSchema, type TaskRow, dedupeKey } from "@/lib/import/transformers/tasks";
import { log } from "@/lib/log";

const PostSchema = z.object({
  projectId: z.string().uuid(),
  csv: z.string().min(1).max(5 * 1024 * 1024),
});

const MAX_SYNC_ROWS = 1000;

export async function POST(req: NextRequest) {
  const input = await parseJson(req, PostSchema);
  if (input instanceof Response) return input;

  return withAuth(async (session) => {
    const denial = assertCapability(session, "tasks:write");
    if (denial) return denial;
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");

    const supabase = await createClient();
    const { data: project } = await supabase.from("projects").select("id").eq("id", input.projectId).eq("org_id", session.orgId).maybeSingle();
    if (!project) return apiError("not_found", "Project not found");

    const result = parseAndValidateCsv<TaskRow>(input.csv, TaskRowSchema);
    if (result.rowCount > MAX_SYNC_ROWS) return apiError("bad_request", `Row count ${result.rowCount} exceeds sync cap ${MAX_SYNC_ROWS}`);

    const { data: existing } = await supabase.from("tasks").select("title, due_at").eq("project_id", project.id);
    const existingKeys = new Set((existing ?? []).map((r) => `${r.title}::${r.due_at ?? ""}`.toLowerCase()));

    const dedup = new Map<string, TaskRow>();
    for (const row of result.valid) {
      const key = dedupeKey(row);
      if (existingKeys.has(key)) continue;
      dedup.set(key, row);
    }
    const toInsert = Array.from(dedup.values());

    let insertedCount = 0;
    if (toInsert.length > 0) {
      const rowsForDb = toInsert.map((r) => ({
        org_id: session.orgId,
        project_id: project.id,
        title: r.title,
        description: r.description ?? null,
        status: r.status,
        priority: r.priority ?? 3,
        due_at: r.due_at ?? null,
        created_by: session.userId,
      }));
      const { error, data } = await supabase.from("tasks").insert(rowsForDb).select("id");
      if (error) {
        log.warn("import.tasks.insert_failed", { err: error.message, org_id: session.orgId });
        return apiError("internal", error.message);
      }
      insertedCount = data?.length ?? 0;
    }

    return apiCreated({
      rowCount: result.rowCount,
      validCount: result.valid.length,
      invalidCount: result.invalid.length,
      insertedCount,
      skippedCount: result.valid.length - insertedCount,
      invalid: result.invalid.slice(0, 50),
    });
  });
}
