import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { resolvePdfBrand } from "@/lib/pdf/branding";
import { compileAndStore } from "@/lib/pdf/render";
import { AdvanceBook } from "@/lib/pdf/deliverables/document";
import type { DeliverableRow } from "@/lib/pdf/deliverables/document";
import { log } from "@/lib/log";

/**
 * GET /api/v1/projects/{projectId}/advance-book — Opportunity #1.
 *
 * Compiles every approved or submitted deliverable on the project into
 * one branded PDF book (cover + TOC + one section per deliverable,
 * ordered stably). Returns a 302 to a 60-second signed URL.
 *
 * Classification tier is the MAX of `event_guides.tier` for the project
 * (as a proxy — deliverables don't carry a tier themselves today).
 */

const ParamsSchema = z.object({ projectId: z.string().uuid() });

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await ctx.params;
  const parsed = ParamsSchema.safeParse({ projectId });
  if (!parsed.success) return apiError("bad_request", "Invalid project id");

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  const denial = assertCapability(session, "projects:read");
  if (denial) return denial;

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", parsed.data.projectId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!project) return apiError("not_found", "Project not found");

  const [{ data: rows }, { data: org }, { data: tiers }] = await Promise.all([
    supabase
      .from("deliverables")
      .select("id, type, status, version, deadline, data")
      .eq("project_id", parsed.data.projectId)
      .in("status", ["approved", "submitted"] as never)
      .order("type", { ascending: true }),
    supabase.from("orgs").select("name, name_override, logo_url, branding").eq("id", session.orgId).maybeSingle(),
    supabase
      .from("event_guides")
      .select("tier, classification")
      .eq("project_id", parsed.data.projectId)
      .order("tier", { ascending: false })
      .limit(1),
  ]);
  if (!org) return apiError("internal", "Missing organization row");

  const classificationTier = tiers && tiers[0] ? (tiers[0].tier as number | null) ?? undefined : undefined;
  const classification = tiers && tiers[0] ? (tiers[0].classification as string | null) ?? undefined : undefined;

  const deliverables: DeliverableRow[] = (rows ?? []).map((r) => ({
    id: r.id as string,
    type: r.type as string,
    status: (r.status as string | null) ?? null,
    version: (r.version as number | null) ?? null,
    deadline: (r.deadline as string | null) ?? null,
    data: r.data,
  }));

  const brand = resolvePdfBrand({ org, client: null });
  try {
    const { signedUrl } = await compileAndStore({
      doc: (
        <AdvanceBook
          brand={brand}
          projectName={project.name}
          classification={classification}
          classificationTier={classificationTier}
          deliverables={deliverables}
        />
      ),
      bucket: "advancing",
      path: `advance-books/${session.orgId}/${project.id}.pdf`,
      signedUrlTtlSeconds: 60,
      contentDisposition: "attachment",
      filenameForAttachment: `${project.name.toLowerCase().replace(/\s+/g, "-")}-advance.pdf`,
    });
    return NextResponse.redirect(signedUrl, 302);
  } catch (e) {
    log.error("advance_book.compile_failed", { project_id: project.id, err: e instanceof Error ? e.message : String(e) });
    return apiError("internal", "Failed to render advance book");
  }
}
