import { NextResponse } from "next/server";
import { z } from "zod";
import QRCode from "qrcode";
import { apiError } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { resolvePdfBrand } from "@/lib/pdf/branding";
import { compileAndStore } from "@/lib/pdf/render";
import { WristbandSheetPdf } from "@/lib/pdf/wristband-sheet";
import { log } from "@/lib/log";

/**
 * GET /api/v1/projects/{projectId}/wristbands — Opportunity #16.
 * Renders every active ticket on the project as a printable QR
 * wristband (10-up LETTER grid). QR encodes the canonical ticket code
 * for gate-scan ingestion via /api/v1/tickets/scan.
 */

const ParamsSchema = z.object({ projectId: z.string().uuid() });

const dynamic = "force-dynamic";
export { dynamic };

export async function GET(_req: Request, ctx: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await ctx.params;
  const p = ParamsSchema.safeParse({ projectId });
  if (!p.success) return apiError("bad_request", "Invalid project id");

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;
  const denial = assertCapability(session, "projects:read");
  if (denial) return denial;

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects").select("id, name").eq("id", p.data.projectId).eq("org_id", session.orgId).maybeSingle();
  if (!project) return apiError("not_found", "Project not found");

  const [{ data: tickets }, { data: org }] = await Promise.all([
    supabase.from("tickets").select("id, code, holder_name, tier, status").eq("project_id", project.id).neq("status", "voided").limit(500),
    supabase.from("orgs").select("name, name_override, logo_url, branding").eq("id", session.orgId).maybeSingle(),
  ]);
  if (!org) return apiError("internal", "Missing organization row");

  // Generate QR as data URL per ticket — @react-pdf accepts image data URLs.
  const rows = await Promise.all(
    (tickets ?? []).map(async (t) => ({
      id: t.id as string,
      code: t.code as string,
      holderName: (t.holder_name as string | null) ?? null,
      tier: (t.tier as string | null) ?? null,
      qrDataUrl: await QRCode.toDataURL(t.code as string, { margin: 0, width: 144 }),
    })),
  );

  const brand = resolvePdfBrand({ org, client: null });
  try {
    const { signedUrl } = await compileAndStore({
      doc: <WristbandSheetPdf brand={brand} eventName={project.name} tickets={rows} />,
      bucket: "advancing",
      path: `wristbands/${session.orgId}/${project.id}.pdf`,
      signedUrlTtlSeconds: 60,
      contentDisposition: "attachment",
      filenameForAttachment: `${project.name.toLowerCase().replace(/\s+/g, "-")}-wristbands.pdf`,
    });
    return NextResponse.redirect(signedUrl, 302);
  } catch (e) {
    log.error("wristband.compile_failed", { project_id: project.id, err: e instanceof Error ? e.message : String(e) });
    return apiError("internal", "Failed to render wristband sheet");
  }
}
