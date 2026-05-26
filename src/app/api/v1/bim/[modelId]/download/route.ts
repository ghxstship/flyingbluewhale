import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

/**
 * GET /api/v1/bim/[modelId]/download
 *
 * Mints a 60-second signed URL for the underlying IFC / RVT / NWD file in
 * the 'bim' bucket and 303-redirects. Defense-in-depth: pins org_id on the
 * SELECT in addition to RLS so a policy regression can't leak another
 * org's storage path. The bim bucket is service-role-write-only at the
 * storage policy level; this route is read-only.
 */

const IdSchema = z.string().uuid();

export async function GET(_: Request, ctx: { params: Promise<{ modelId: string }> }) {
  const { modelId } = await ctx.params;
  const parsed = IdSchema.safeParse(modelId);
  if (!parsed.success) return apiError("bad_request", "Invalid bim model id");

  return withAuth(async (session) => {
    const supabase = await createClient();
    // Cast only for the new-table SELECT; reuse the typed client's storage API.
    const loose = supabase as unknown as LooseSupabase;

    const { data: row } = await loose
      .from("bim_models")
      .select("storage_path, name, source_type")
      .eq("id", parsed.data)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();

    type ModelRow = { storage_path: string; name: string; source_type: string };
    const model = row as ModelRow | null;
    if (!model?.storage_path) return apiError("not_found", "BIM model not found");

    const filename = `${model.name.replace(/[^a-z0-9.-]+/gi, "_")}.${model.source_type}`;

    const { data: signed, error: signError } = await supabase.storage
      .from("bim")
      .createSignedUrl(model.storage_path, 60, { download: filename });
    if (signError || !signed) return apiError("internal", signError?.message ?? "Could not sign URL");

    return NextResponse.redirect(signed.signedUrl, { status: 303 });
  });
}
