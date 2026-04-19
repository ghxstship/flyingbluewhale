import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** /api/v1/email-templates/[id] — update + soft-delete. */

const PatchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  subject: z.string().min(1).max(200).optional(),
  bodyHtml: z.string().min(1).max(100_000).optional(),
  bodyText: z.string().max(100_000).optional(),
  mergeTags: z.array(z.string().max(64)).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const input = await parseJson(req, PatchSchema);
  if (input instanceof Response) return input;
  return withAuth(async (session) => {
    const denial = assertCapability(session, "projects:write");
    if (denial) return denial;
    const supabase = await createClient();
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.subject !== undefined) patch.subject = input.subject;
    if (input.bodyHtml !== undefined) patch.body_html = input.bodyHtml;
    if (input.bodyText !== undefined) patch.body_text = input.bodyText;
    if (input.mergeTags !== undefined) patch.merge_tags = input.mergeTags;
    if (input.isActive !== undefined) patch.is_active = input.isActive;
    const { data, error } = await (supabase.from("email_templates") as never as {
      update: (p: Record<string, unknown>) => ReturnType<typeof supabase.from>;
    })
      .update(patch)
      .eq("id", id)
      .eq("org_id", session.orgId)
      .select("id, slug, name, subject, body_html, body_text, merge_tags, is_active, updated_at")
      .maybeSingle();
    if (error) return apiError("internal", error.message);
    if (!data) return apiError("not_found", "Template not found");
    return apiOk({ template: data });
  });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return withAuth(async (session) => {
    const denial = assertCapability(session, "projects:write");
    if (denial) return denial;
    const supabase = await createClient();
    const { error } = await (supabase.from("email_templates") as never as {
      update: (p: Record<string, unknown>) => ReturnType<typeof supabase.from>;
    })
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("org_id", session.orgId);
    if (error) return apiError("internal", error.message);
    return apiOk({ ok: true });
  });
}
