import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { resolvePdfBrand } from "@/lib/pdf/branding";
import { compileAndStore } from "@/lib/pdf/render";
import { SignageGridPdf } from "@/lib/pdf/reports";
import { SignageGridSchema } from "@/lib/pdf/schemas/deliverables";
import { log } from "@/lib/log";

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

  // Pull all signage_grid deliverables + flatten entries.
  const { data: dels } = await supabase
    .from("deliverables")
    .select("data")
    .eq("project_id", project.id)
    .eq("type", "signage_grid" as never);
  const entries: Array<{ location: string; type: string; size?: string | null; install?: string | null; strike?: string | null; note?: string | null }> = [];
  for (const d of dels ?? []) {
    const parsed = SignageGridSchema.safeParse(d.data);
    if (parsed.success) entries.push(...parsed.data.entries);
  }

  const { data: org } = await supabase.from("orgs").select("name, name_override, logo_url, branding").eq("id", session.orgId).maybeSingle();
  if (!org) return apiError("internal", "Missing organization row");

  const brand = resolvePdfBrand({ org, client: null });
  try {
    const { signedUrl } = await compileAndStore({
      doc: <SignageGridPdf brand={brand} project={{ name: project.name }} entries={entries} />,
      bucket: "advancing",
      path: `signage/${session.orgId}/${project.id}.pdf`,
      signedUrlTtlSeconds: 60,
      contentDisposition: "attachment",
      filenameForAttachment: `${project.name.toLowerCase().replace(/\s+/g, "-")}-signage.pdf`,
    });
    return NextResponse.redirect(signedUrl, 302);
  } catch (e) {
    log.error("signage_grid.compile_failed", { project_id: project.id, err: e instanceof Error ? e.message : String(e) });
    return apiError("internal", "Failed to render signage grid");
  }
}
