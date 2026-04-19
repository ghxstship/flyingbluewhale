import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { resolvePdfBrand } from "@/lib/pdf/branding";
import { compileAndStore } from "@/lib/pdf/render";
import { DeliverablePdf } from "@/lib/pdf/deliverables/document";
import { labelFor } from "@/lib/pdf/deliverables/registry";
import { log } from "@/lib/log";

/**
 * GET /api/v1/deliverables/{id}/pdf — Opportunity #2.
 * Renders a single deliverable to PDF and 302-redirects to a 60-second
 * signed URL. The download path and existing
 * /api/v1/deliverables/{id}/download stay — that endpoint still serves
 * the uploaded raw file; this one serves the type-canonical PDF.
 */

const ParamsSchema = z.object({ id: z.string().uuid() });

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const parsed = ParamsSchema.safeParse({ id });
  if (!parsed.success) return apiError("bad_request", "Invalid deliverable id");

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  const supabase = await createClient();
  const { data: d, error } = await supabase
    .from("deliverables")
    .select("id, type, status, version, deadline, data, project_id, org_id")
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (error) return apiError("internal", error.message);
  if (!d) return apiError("not_found", "Deliverable not found");

  const [{ data: project }, { data: org }] = await Promise.all([
    supabase.from("projects").select("name").eq("id", d.project_id).maybeSingle(),
    supabase.from("orgs").select("name, name_override, logo_url, branding").eq("id", session.orgId).maybeSingle(),
  ]);
  if (!org) return apiError("internal", "Missing organization row");

  const brand = resolvePdfBrand({ org, client: null });
  try {
    const { signedUrl } = await compileAndStore({
      doc: (
        <DeliverablePdf
          brand={brand}
          projectName={project?.name}
          deliverable={{
            id: d.id,
            type: d.type as string,
            status: (d.status as string | null) ?? null,
            version: (d.version as number | null) ?? null,
            deadline: (d.deadline as string | null) ?? null,
            data: d.data,
          }}
        />
      ),
      bucket: "advancing",
      path: `pdf/${session.orgId}/${d.project_id}/${d.id}.pdf`,
      signedUrlTtlSeconds: 60,
      contentDisposition: "attachment",
      filenameForAttachment: `${(project?.name ?? "project").toLowerCase().replace(/\s+/g, "-")}-${labelFor(d.type as string).toLowerCase().replace(/\s+/g, "-")}.pdf`,
    });
    return NextResponse.redirect(signedUrl, 302);
  } catch (e) {
    log.error("deliverable.pdf.compile_failed", { id: d.id, err: e instanceof Error ? e.message : String(e) });
    return apiError("internal", "Failed to render deliverable PDF");
  }
}
