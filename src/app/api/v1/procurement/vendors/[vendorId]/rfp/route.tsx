import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { resolvePdfBrand } from "@/lib/pdf/branding";
import { compileAndStore } from "@/lib/pdf/render";
import { VendorRfpPdf } from "@/lib/pdf/vendor-rfp";
import { log } from "@/lib/log";

const ParamsSchema = z.object({ vendorId: z.string().uuid() });
const BodySchema = z.object({
  projectId: z.string().uuid(),
  scope: z.string().min(1).max(10_000),
  deliverables: z
    .array(z.object({ title: z.string(), description: z.string().optional(), due: z.string().optional() }))
    .default([]),
  submitInstructions: z.string().min(1).max(5_000),
  deadline: z.string().optional(),
});

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ vendorId: string }> }) {
  const { vendorId } = await ctx.params;
  const p = ParamsSchema.safeParse({ vendorId });
  if (!p.success) return apiError("bad_request", "Invalid vendor id");
  const b = await parseJson(req, BodySchema);
  if (b instanceof Response) return b;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;
  const denial = assertCapability(session, "procurement:read");
  if (denial) return denial;

  const supabase = await createClient();
  const [{ data: vendor }, { data: project }, { data: org }] = await Promise.all([
    supabase.from("vendors").select("name, contact_email").eq("id", p.data.vendorId).eq("org_id", session.orgId).maybeSingle(),
    supabase.from("projects").select("name").eq("id", b.projectId).eq("org_id", session.orgId).maybeSingle(),
    supabase.from("orgs").select("name, name_override, logo_url, branding").eq("id", session.orgId).maybeSingle(),
  ]);
  if (!vendor) return apiError("not_found", "Vendor not found");
  if (!project) return apiError("not_found", "Project not found");
  if (!org) return apiError("internal", "Missing organization row");

  const brand = resolvePdfBrand({ org, client: null });
  try {
    const { signedUrl } = await compileAndStore({
      doc: (
        <VendorRfpPdf
          brand={brand}
          vendor={{ name: vendor.name, contact_email: vendor.contact_email ?? null }}
          project={{ name: project.name }}
          scope={b.scope}
          deliverables={b.deliverables}
          submitInstructions={b.submitInstructions}
          deadline={b.deadline ?? null}
        />
      ),
      bucket: "proposals",
      path: `rfps/${session.orgId}/${p.data.vendorId}-${Date.now()}.pdf`,
      signedUrlTtlSeconds: 60,
      contentDisposition: "attachment",
      filenameForAttachment: `rfp-${vendor.name.toLowerCase().replace(/\s+/g, "-")}.pdf`,
    });
    return NextResponse.redirect(signedUrl, 302);
  } catch (e) {
    log.error("vendor_rfp.compile_failed", { vendor_id: p.data.vendorId, err: e instanceof Error ? e.message : String(e) });
    return apiError("internal", "Failed to render RFP");
  }
}
