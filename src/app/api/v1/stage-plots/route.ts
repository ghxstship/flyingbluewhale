import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiCreated, apiError, apiOk, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** /api/v1/stage-plots — Opportunity #11 (Stage plot editor state). */

const PostSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(120),
  widthFt: z.number().optional(),
  depthFt: z.number().optional(),
  elements: z.array(z.record(z.string(), z.unknown())).default([]),
  svgUrl: z.string().url().optional(),
  notes: z.string().max(4000).optional(),
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  return withAuth(async (session) => {
    const supabase = await createClient();
    let q = supabase
      .from("stage_plots")
      .select("id, project_id, name, width_ft, depth_ft, elements, svg_url, notes, updated_at")
      .is("deleted_at", null)
      .eq("org_id", session.orgId)
      .order("updated_at", { ascending: false });
    if (projectId) q = q.eq("project_id", projectId);
    const { data, error } = await q;
    if (error) return apiError("internal", error.message);
    return apiOk({ stagePlots: data ?? [] });
  });
}

export async function POST(req: NextRequest) {
  const input = await parseJson(req, PostSchema);
  if (input instanceof Response) return input;
  return withAuth(async (session) => {
    const denial = assertCapability(session, "projects:write");
    if (denial) return denial;
    const supabase = await createClient();
    const { data: project } = await supabase
      .from("projects").select("id").eq("id", input.projectId).eq("org_id", session.orgId).maybeSingle();
    if (!project) return apiError("not_found", "Project not found");
    const { data, error } = await supabase
      .from("stage_plots")
      .insert({
        org_id: session.orgId,
        project_id: input.projectId,
        name: input.name,
        width_ft: input.widthFt ?? null,
        depth_ft: input.depthFt ?? null,
        elements: input.elements as never,
        svg_url: input.svgUrl ?? null,
        notes: input.notes ?? null,
        created_by: session.userId,
      })
      .select("id")
      .single();
    if (error) return apiError("internal", error.message);
    return apiCreated({ stagePlot: data });
  });
}
