import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/database.types";

type StagePlotUpdate = Database["public"]["Tables"]["stage_plots"]["Update"];

/** /api/v1/stage-plots/[id] — detail + PATCH from the canvas editor. */

const PatchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  widthFt: z.number().optional(),
  depthFt: z.number().optional(),
  elements: z.array(z.record(z.string(), z.unknown())).optional(),
  notes: z.string().max(4000).optional(),
});

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return withAuth(async (session) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("stage_plots")
      .select("id, project_id, name, width_ft, depth_ft, elements, svg_url, notes, updated_at")
      .eq("id", id)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) return apiError("internal", error.message);
    if (!data) return apiError("not_found", "Stage plot not found");
    return apiOk({ stagePlot: data });
  });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const input = await parseJson(req, PatchSchema);
  if (input instanceof Response) return input;
  return withAuth(async (session) => {
    const denial = assertCapability(session, "projects:write");
    if (denial) return denial;
    const supabase = await createClient();
    const patch: StagePlotUpdate = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.widthFt !== undefined) patch.width_ft = input.widthFt;
    if (input.depthFt !== undefined) patch.depth_ft = input.depthFt;
    if (input.elements !== undefined) patch.elements = input.elements as Json;
    if (input.notes !== undefined) patch.notes = input.notes;
    const { data, error } = await supabase
      .from("stage_plots")
      .update(patch)
      .eq("id", id)
      .eq("org_id", session.orgId)
      .select("id, updated_at")
      .maybeSingle();
    if (error) return apiError("internal", error.message);
    if (!data) return apiError("not_found", "Stage plot not found");
    return apiOk({ stagePlot: data });
  });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return withAuth(async (session) => {
    const denial = assertCapability(session, "projects:write");
    if (denial) return denial;
    const supabase = await createClient();
    // .select + .is(deleted_at, null) — surface 404 on wrong/foreign id
    // and refuse to re-stamp deleted_at on an already-deleted row.
    const { data, error } = await supabase
      .from("stage_plots")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();
    if (error) return apiError("internal", error.message);
    if (!data) return apiError("not_found", "Stage plot not found or already deleted");
    return apiOk({ ok: true });
  });
}
