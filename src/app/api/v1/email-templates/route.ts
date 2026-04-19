import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiCreated, apiError, apiOk, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** /api/v1/email-templates — Opportunity #21. */

const PostSchema = z.object({
  slug: z.string().min(1).max(120).regex(/^[a-z0-9._-]+$/),
  name: z.string().min(1).max(120),
  subject: z.string().min(1).max(200),
  bodyHtml: z.string().min(1).max(100_000),
  bodyText: z.string().max(100_000).optional(),
  mergeTags: z.array(z.string().max(64)).default([]),
  isActive: z.boolean().default(true),
});

export async function GET() {
  return withAuth(async (session) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("email_templates")
      .select("id, slug, name, subject, body_html, body_text, merge_tags, is_active, updated_at")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("slug", { ascending: true });
    if (error) return apiError("internal", error.message);
    return apiOk({ templates: data ?? [] });
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
      .from("email_templates")
      .insert({
        org_id: session.orgId,
        slug: input.slug,
        name: input.name,
        subject: input.subject,
        body_html: input.bodyHtml,
        body_text: input.bodyText ?? null,
        merge_tags: input.mergeTags as never,
        is_active: input.isActive,
        created_by: session.userId,
      })
      .select("id, slug, name, subject, is_active, updated_at")
      .single();
    if (error) {
      if (/duplicate key/i.test(error.message)) return apiError("conflict", "Template slug already exists");
      return apiError("internal", error.message);
    }
    return apiCreated({ template: data });
  });
}
