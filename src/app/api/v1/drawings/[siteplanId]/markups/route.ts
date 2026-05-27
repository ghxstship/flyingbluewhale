import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

/**
 * GET /api/v1/drawings/[siteplanId]/markups — list all visible markups
 *   on a sheet, returned in their layer's color when one is set.
 * POST /api/v1/drawings/[siteplanId]/markups — create a markup.
 *
 * The renderer is the next engineering pass; this endpoint is the
 * canonical persistence layer the client islands will call into.
 */

const ParamsSchema = z.object({ siteplanId: z.string().uuid() });

const MarkupKind = z.enum([
  "rectangle",
  "ellipse",
  "polygon",
  "polyline",
  "freehand",
  "cloud",
  "text",
  "callout",
  "dimension",
  "highlight",
  "measure_count",
]);

const PostBodySchema = z.object({
  kind: MarkupKind,
  geometry: z.record(z.string(), z.unknown()),
  layer_id: z.string().uuid().optional(),
  color: z.string().max(16).optional(),
  fill_color: z.string().max(16).optional(),
  fill_opacity: z.number().min(0).max(1).optional(),
  stroke_width: z.number().min(0).max(20).optional(),
  text_content: z.string().max(1000).optional(),
  text_size: z.number().min(4).max(96).optional(),
  link_type: z
    .enum(["rfi", "submittal", "punch_item", "spec_section", "detail_callout", "bim_model", "transmittal"])
    .optional(),
  link_id: z.string().uuid().optional(),
});

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ siteplanId: string }> }) {
  const { siteplanId } = await ctx.params;
  const parsed = ParamsSchema.safeParse({ siteplanId });
  if (!parsed.success) return apiError("bad_request", "Invalid sheet id");
  return withAuth(async (session) => {
    const supabase = (await createClient()) as unknown as LooseSupabase;

    const [{ data: markups }, { data: layers }] = await Promise.all([
      supabase
        .from("drawing_markups")
        .select(
          "id, layer_id, kind, geometry, color, fill_color, fill_opacity, stroke_width, text_content, text_size, link_type, link_id, created_at",
        )
        .eq("site_plan_id", parsed.data.siteplanId)
        .eq("org_id", session.orgId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true }),
      supabase
        .from("drawing_markup_layers")
        .select("id, name, color, is_visible, ordinal")
        .eq("site_plan_id", parsed.data.siteplanId)
        .eq("org_id", session.orgId)
        .order("ordinal", { ascending: true }),
    ]);

    return apiOk({ markups: markups ?? [], layers: layers ?? [] });
  });
}

export async function POST(req: Request, ctx: { params: Promise<{ siteplanId: string }> }) {
  const { siteplanId } = await ctx.params;
  const params = ParamsSchema.safeParse({ siteplanId });
  if (!params.success) return apiError("bad_request", "Invalid sheet id");

  return withAuth(async (session) => {
    const body = await parseJson(req, PostBodySchema);
    if (body instanceof Response) return body;
    const supabase = (await createClient()) as unknown as LooseSupabase;

    // Cross-tenant guard on the parent sheet.
    const { data: sheet } = await supabase
      .from("site_plans")
      .select("id")
      .eq("id", params.data.siteplanId)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (!sheet) return apiError("not_found", "Sheet not found");

    const { data: row, error } = await supabase
      .from("drawing_markups")
      .insert({
        org_id: session.orgId,
        site_plan_id: params.data.siteplanId,
        layer_id: body.layer_id ?? null,
        kind: body.kind,
        geometry: body.geometry,
        color: body.color ?? "#EF4444",
        fill_color: body.fill_color ?? null,
        fill_opacity: body.fill_opacity ?? null,
        stroke_width: body.stroke_width ?? 1.5,
        text_content: body.text_content ?? null,
        text_size: body.text_size ?? null,
        link_type: body.link_type ?? null,
        link_id: body.link_id ?? null,
        created_by: session.userId,
      })
      .select("id")
      .single();
    if (error) return apiError("internal", error.message);
    return apiOk({ id: (row as { id: string }).id });
  });
}
