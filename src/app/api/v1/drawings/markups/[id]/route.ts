import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

const IdSchema = z.object({ id: z.string().uuid() });

const PatchSchema = z.object({
  geometry: z.record(z.string(), z.unknown()).optional(),
  color: z.string().max(16).optional(),
  fill_color: z.string().max(16).nullable().optional(),
  fill_opacity: z.number().min(0).max(1).nullable().optional(),
  stroke_width: z.number().min(0).max(20).optional(),
  text_content: z.string().max(1000).nullable().optional(),
  text_size: z.number().min(4).max(96).nullable().optional(),
  layer_id: z.string().uuid().nullable().optional(),
});

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const parsed = IdSchema.safeParse({ id });
  if (!parsed.success) return apiError("bad_request", "Invalid markup id");
  return withAuth(async (session) => {
    const body = await parseJson(req, PatchSchema);
    if (body instanceof Response) return body;
    // All fields optional — an empty patch would reach PostgREST as
    // `update({})`, which it rejects as a 400 we'd surface as 500.
    if (Object.keys(body).length === 0) return apiError("bad_request", "No fields to update");
    const supabase = (await createClient()) as unknown as LooseSupabase;
    const { error } = await supabase
      .from("drawing_markups")
      .update(body)
      .eq("id", parsed.data.id)
      .eq("org_id", session.orgId);
    if (error) return apiError("internal", error.message);
    return apiOk({ ok: true });
  });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const parsed = IdSchema.safeParse({ id });
  if (!parsed.success) return apiError("bad_request", "Invalid markup id");
  return withAuth(async (session) => {
    const supabase = (await createClient()) as unknown as LooseSupabase;
    const { error } = await supabase
      .from("drawing_markups")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", parsed.data.id)
      .eq("org_id", session.orgId);
    if (error) return apiError("internal", error.message);
    return apiOk({ ok: true });
  });
}
