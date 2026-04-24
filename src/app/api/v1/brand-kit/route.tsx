import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { resolvePdfBrand } from "@/lib/pdf/branding";
import { compileAndStore } from "@/lib/pdf/render";
import { BrandKitPdf } from "@/lib/pdf/brand-kit";
import { log } from "@/lib/log";

/** GET /api/v1/brand-kit — Opportunity #20. */

export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  // Brand-kit upload requires the service client (writes to the branding
  // storage bucket). Surface a clear 503 when the deploy is missing the
  // service-role key rather than letting the throw bubble to a 500.
  if (!isServiceClientAvailable()) {
    return apiError(
      "service_unavailable",
      "Brand kit PDF rendering needs SUPABASE_SERVICE_ROLE_KEY in the runtime environment.",
    );
  }

  const supabase = await createClient();
  const { data: org } = await supabase
    .from("orgs")
    .select("name, name_override, logo_url, branding")
    .eq("id", session.orgId)
    .maybeSingle();
  if (!org) return apiError("internal", "Missing organization row");

  const brand = resolvePdfBrand({ org, client: null });
  // Construct the PDF doc element outside the try block so the React
  // error-boundary rule doesn't think we're catching JSX render errors
  // (these errors are caught by the @react-pdf renderer's own pipeline,
  // not by React Suspense). The try wraps the async compile + upload.
  const doc = <BrandKitPdf brand={brand} />;
  try {
    const { signedUrl } = await compileAndStore({
      doc,
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
