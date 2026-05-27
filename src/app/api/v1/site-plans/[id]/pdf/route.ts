import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

/**
 * GET /api/v1/site-plans/[id]/pdf
 *
 * Mints a 60-second signed URL for the site_plans row's PDF in the
 * 'site-plans' storage bucket and 303-redirects. The PDF.js markup
 * renderer points its pdfUrl at this endpoint; pdf.js follows the
 * 303 transparently.
 */

const IdSchema = z.string().uuid();

export const dynamic = "force-dynamic";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const parsed = IdSchema.safeParse(id);
  if (!parsed.success) return apiError("bad_request", "Invalid site-plan id");
  return withAuth(async (session) => {
    const supabase = await createClient();
    const loose = supabase as unknown as LooseSupabase;
    const { data: row } = await loose
      .from("site_plans")
      .select("storage_path")
      .eq("id", parsed.data)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    type Row = { storage_path: string | null };
    const r = row as Row | null;
    if (!r?.storage_path) return apiError("not_found", "Sheet has no PDF attached");
    const { data: signed, error } = await supabase.storage.from("site-plans").createSignedUrl(r.storage_path, 60);
    if (error || !signed) return apiError("internal", error?.message ?? "signed URL failed");
    return NextResponse.redirect(signed.signedUrl, { status: 303 });
  });
}
