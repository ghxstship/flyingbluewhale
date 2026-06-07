import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { resolvePdfBrand } from "@/lib/pdf/branding";
import { compileAndStore } from "@/lib/pdf/render";
import { TaskReportPdf } from "@/lib/pdf/reports";
import { getRequestT } from "@/lib/i18n/request";
import { log } from "@/lib/log";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

const ParamsSchema = z.object({ projectId: z.string().uuid() });

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ projectId: string }> }) {
  const rl = await ratelimit({ key: keyFromRequest(req, "task-report"), ...RATE_BUDGETS.export });
  if (!rl.ok) return apiError("rate_limited", "Task report rate limit reached");
  const { projectId } = await ctx.params;
  const p = ParamsSchema.safeParse({ projectId });
  if (!p.success) return apiError("bad_request", "Invalid project id");

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;
  const denial = assertCapability(session, "tasks:read");
  if (denial) return denial;

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", p.data.projectId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) return apiError("not_found", "Project not found");

  const [{ data: tasks }, { data: org }] = await Promise.all([
    supabase
      .from("tasks")
      .select("title, status, priority, assigned_to, due_at")
      .eq("project_id", project.id)
      .order("due_at", { ascending: true })
      .limit(1000),
    supabase.from("orgs").select("name, name_override, logo_url, branding").eq("id", session.orgId).maybeSingle(),
  ]);
  if (!org) return apiError("internal", "Missing organization row");

  const brand = resolvePdfBrand({ org, client: null });
  const { t: tr } = await getRequestT();
  try {
    const { signedUrl } = await compileAndStore({
      doc: (
        <TaskReportPdf
          brand={brand}
          t={tr}
          project={{ name: project.name }}
          tasks={(tasks ?? []).map((t) => ({
            title: t.title,
            status: (t.status as string | null) ?? null,
            priority: t.priority != null ? String(t.priority) : null,
            assignee_name: null,
            due_at: t.due_at ?? null,
          }))}
        />
      ),
      bucket: "exports",
      path: `${session.orgId}/tasks-${project.id}.pdf`,
      signedUrlTtlSeconds: 60,
      contentDisposition: "attachment",
      filenameForAttachment: `${project.name.toLowerCase().replace(/\s+/g, "-")}-tasks.pdf`,
    });
    return NextResponse.redirect(signedUrl, 302);
  } catch (e) {
    log.error("task_report.compile_failed", {
      project_id: project.id,
      err: e instanceof Error ? e.message : String(e),
    });
    return apiError("internal", "Failed to render task report");
  }
}
