import { z } from "zod";
import { apiOk, apiCreated, apiError, parseJson } from "@/lib/api";
import { withAuth, assertScope, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * /api/v1/projects/{projectId}/advance-packets (kit 27)
 *
 * GET  — the project's advance packet graph: packet, sections, audiences,
 *        and the section × audience assignment matrix. `advancing:read`.
 * POST — create the packet shell for the project (one live packet per
 *        project, versioned). `advancing:write`, manager+.
 */

export const dynamic = "force-dynamic";

const Uuid = z.string().uuid();

export async function GET(_req: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await ctx.params;
  if (!Uuid.safeParse(projectId).success) return apiError("bad_request", "Invalid project id");
  return withAuth(async (session) => {
    const denied = assertScope(session, "advancing:read");
    if (denied) return denied;
    const supabase = await createClient();
    const { data: packet } = await supabase
      .from("advance_packets")
      .select("id, project_id, job_id, version, voice, packet_state, created_at, updated_at")
      .eq("org_id", session.orgId)
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!packet) return apiOk({ packet: null, sections: [], audiences: [], assignments: [] });

    const [{ data: sections }, { data: audiences }] = await Promise.all([
      supabase
        .from("advance_packet_sections")
        .select("id, section_key, title, sort_order, deliverable_types, submission_schema_key")
        .eq("packet_id", packet.id)
        .is("deleted_at", null)
        .order("sort_order", { ascending: true })
        .limit(200),
      supabase
        .from("advance_audiences")
        .select("id, company, department, team, role, scope, contract_id, external_scheduler_url, contacts")
        .eq("packet_id", packet.id)
        .is("deleted_at", null)
        .limit(500),
    ]);
    const audienceIds = (audiences ?? []).map((a) => a.id);
    let assignments: unknown[] = [];
    if (audienceIds.length > 0) {
      const { data } = await supabase
        .from("advance_section_assignments")
        .select("id, audience_id, section_id, requirement, due_at, assigned_via")
        .in("audience_id", audienceIds)
        .is("deleted_at", null)
        .limit(2000);
      assignments = data ?? [];
    }
    return apiOk({ packet, sections: sections ?? [], audiences: audiences ?? [], assignments });
  }).catch(() => apiError("internal", "Failed to load advance packet"));
}

const CreateSchema = z.object({
  jobId: z.string().uuid().optional(),
  voice: z.enum(["neutral", "flair"]).optional(),
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await ctx.params;
  if (!Uuid.safeParse(projectId).success) return apiError("bad_request", "Invalid project id");
  return withAuth(async (session) => {
    const denied = assertScope(session, "advancing:write");
    if (denied) return denied;
    if (!isManagerPlus(session)) return apiError("forbidden", "Manager role required");
    const parsed = await parseJson(req, CreateSchema);
    if (parsed instanceof NextResponse) return parsed;

    const supabase = await createClient();
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!project) return apiError("not_found", "Project not found");

    const { data: existing } = await supabase
      .from("advance_packets")
      .select("id")
      .eq("org_id", session.orgId)
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .maybeSingle();
    if (existing) return apiError("conflict", "The project already has an advance packet");

    // soft-delete-exempt: insert returning the created row, not a read
    const { data: packet, error } = await supabase
      .from("advance_packets")
      .insert({
        org_id: session.orgId,
        project_id: projectId,
        job_id: parsed.jobId ?? null,
        voice: parsed.voice ?? "neutral",
        created_by: session.userId,
      } as never)
      .select("id, project_id, version, voice, packet_state")
      .single();
    if (error || !packet) return apiError("internal", error?.message ?? "Insert failed");
    return apiCreated({ packet });
  }).catch(() => apiError("internal", "Failed to create advance packet"));
}
