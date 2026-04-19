import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiCreated, apiError, apiOk, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * /api/v1/deliverable-templates — Opportunity #12 (Rider template catalog).
 * GET  — list templates visible to the caller (org's + globals).
 * POST — create a new org-scoped template.
 */

const DELIVERABLE_TYPES = [
  "technical_rider","hospitality_rider","input_list","stage_plot","crew_list","guest_list",
  "equipment_pull_list","power_plan","rigging_plan","site_plan","build_schedule","vendor_package",
  "safety_compliance","comms_plan","signage_grid","custom",
] as const;

const PostSchema = z.object({
  type: z.enum(DELIVERABLE_TYPES),
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  data: z.record(z.string(), z.unknown()).default({}),
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const typeFilter = url.searchParams.get("type");
  return withAuth(async (session) => {
    const supabase = await createClient();
    let q = supabase
      .from("deliverable_templates")
      .select("id, type, name, description, data, is_global, updated_at")
      .is("deleted_at", null)
      .order("name", { ascending: true });
    if (typeFilter) q = q.eq("type", typeFilter as never);
    const { data, error } = await q;
    if (error) return apiError("internal", error.message);
    return apiOk({ templates: data ?? [], orgId: session.orgId });
  });
}

export async function POST(req: NextRequest) {
  const input = await parseJson(req, PostSchema);
  if (input instanceof Response) return input;

  return withAuth(async (session) => {
    const denial = assertCapability(session, "projects:write");
    if (denial) return denial;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("deliverable_templates")
      .insert({
        org_id: session.orgId,
        type: input.type,
        name: input.name,
        description: input.description ?? null,
        data: input.data as never,
        created_by: session.userId,
      })
      .select("id, type, name, description, data, is_global, updated_at")
      .single();
    if (error) return apiError("internal", error.message);
    return apiCreated({ template: data });
  });
}
