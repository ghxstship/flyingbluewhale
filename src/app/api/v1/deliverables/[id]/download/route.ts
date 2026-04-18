import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const IdSchema = z.string().uuid();

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const parsed = IdSchema.safeParse(id);
  if (!parsed.success) return apiError("bad_request", "Invalid deliverable id");
  return withAuth(async () => {
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("deliverables")
      .select("file_path")
      .eq("id", parsed.data)
      .maybeSingle();
    if (error || !row?.file_path) return apiError("not_found", "File not found");

    const { data: signed, error: signError } = await supabase.storage
      .from("advancing")
      .createSignedUrl(row.file_path, 60);
    if (signError || !signed) return apiError("internal", signError?.message ?? "Could not sign URL");

    return NextResponse.redirect(signed.signedUrl, { status: 303 });
  });
}
