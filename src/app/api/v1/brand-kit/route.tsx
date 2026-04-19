import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { resolvePdfBrand } from "@/lib/pdf/branding";
import { compileAndStore } from "@/lib/pdf/render";
import { BrandKitPdf } from "@/lib/pdf/brand-kit";
import { log } from "@/lib/log";

/** GET /api/v1/brand-kit — Opportunity #20. */

const dynamic = "force-dynamic";
export { dynamic };

export async function GET() {
  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  const supabase = await createClient();
  const { data: org } = await supabase
    .from("orgs")
    .select("name, name_override, logo_url, branding")
    .eq("id", session.orgId)
    .maybeSingle();
  if (!org) return apiError("internal", "Missing organization row");

  const brand = resolvePdfBrand({ org, client: null });
  try {
    const { signedUrl } = await compileAndStore({
      doc: <BrandKitPdf brand={brand} />,
      bucket: "branding",
      path: `${session.orgId}/brand-kit.pdf`,
      signedUrlTtlSeconds: 60,
      contentDisposition: "attachment",
      filenameForAttachment: `${brand.producerName.toLowerCase().replace(/\s+/g, "-")}-brand-kit.pdf`,
    });
    return NextResponse.redirect(signedUrl, 302);
  } catch (e) {
    log.error("brand_kit.compile_failed", { err: e instanceof Error ? e.message : String(e) });
    return apiError("internal", "Failed to render brand kit");
  }
}
