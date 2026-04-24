import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { buildProjectArchive } from "@/lib/export/strategies/project_archive";
import { log } from "@/lib/log";

/**
 * GET /api/v1/projects/{projectId}/archive — Opportunity #9.
 * Returns a 302 to a signed URL on the `exports` bucket holding the ZIP.
 */

const ParamsSchema = z.object({ projectId: z.string().uuid() });

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await ctx.params;
  const p = ParamsSchema.safeParse({ projectId });
  if (!p.success) return apiError("bad_request", "Invalid project id");

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;
  const denial = assertCapability(session, "projects:read");
  if (denial) return denial;

  const supabase = await createClient();
  const [{ data: project }, { data: org }] = await Promise.all([
    supabase.from("projects").select("id, name").eq("id", p.data.projectId).eq("org_id", session.orgId).maybeSingle(),
    supabase.from("orgs").select("name").eq("id", session.orgId).maybeSingle(),
  ]);
  if (!project) return apiError("not_found", "Project not found");
  if (!org) return apiError("internal", "Missing organization row");

  try {
    const buf = await buildProjectArchive({
      supabase,
      orgId: session.orgId,
      orgName: org.name ?? "Organization",
      projectId: project.id,
      projectName: project.name,
    });

      if (!isServiceClientAvailable()) {

        return apiError(

          "service_unavailable",

          "This endpoint requires SUPABASE_SERVICE_ROLE_KEY in the runtime environment.",

        );

      }

    const svc = createServiceClient();
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const path = `${session.orgId}/archives/${project.id}-${stamp}.zip`;
    const { error: upErr } = await svc.storage.from("exports").upload(path, buf, {
      contentType: "application/zip",
      upsert: true,
    });
    if (upErr) return apiError("internal", upErr.message);

    const { data: url } = await svc.storage.from("exports").createSignedUrl(path, 300, {
      download: `${project.name.toLowerCase().replace(/\s+/g, "-")}-archive.zip`,
    });
    if (!url) return apiError("internal", "Failed to sign archive URL");
    return NextResponse.redirect(url.signedUrl, 302);
  } catch (e) {
    log.error("project_archive.failed", { project_id: project.id, err: e instanceof Error ? e.message : String(e) });
    return apiError("internal", "Failed to build project archive");
  }
}
