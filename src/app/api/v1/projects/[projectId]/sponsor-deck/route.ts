import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { resolvePdfBrand } from "@/lib/pdf/branding";
import { buildSponsorDeck } from "@/lib/pptx/sponsor-deck";
import { log } from "@/lib/log";

/**
 * POST /api/v1/projects/{projectId}/sponsor-deck — Opportunity #23.
 * Generates a PPTX sponsor activation recap. 302 → signed URL on exports.
 */

const ParamsSchema = z.object({ projectId: z.string().uuid() });
const BodySchema = z.object({
  sponsorName: z.string().min(1).max(120),
  dateRange: z.string().min(1).max(120),
  activations: z
    .array(z.object({
      title: z.string().max(120),
      summary: z.string().max(500),
      impressions: z.number().optional(),
      engagements: z.number().optional(),
    }))
    .default([]),
  topMarkets: z.array(z.string().max(120)).max(10).optional(),
});

export const dynamic = "force-dynamic";

export async function POST(req: Request, ctx: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await ctx.params;
  const p = ParamsSchema.safeParse({ projectId });
  if (!p.success) return apiError("bad_request", "Invalid project id");
  const b = await parseJson(req, BodySchema);
  if (b instanceof Response) return b;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;
  const denial = assertCapability(session, "projects:read");
  if (denial) return denial;

  const supabase = await createClient();
  const [{ data: project }, { data: org }, { data: tickets }] = await Promise.all([
    supabase.from("projects").select("id, name").eq("id", p.data.projectId).eq("org_id", session.orgId).maybeSingle(),
    supabase.from("orgs").select("name, name_override, logo_url, branding").eq("id", session.orgId).maybeSingle(),
    // Cap at 100k; real events never exceed this ceiling, and the query
    // feeds a count + sponsor-deck summary that doesn't need every row.
    supabase.from("tickets").select("id").eq("project_id", p.data.projectId).limit(100_000),
  ]);
  const ticketIds = (tickets ?? []).map((t) => t.id);
  const { count: scanCount } = ticketIds.length
    ? await supabase.from("ticket_scans").select("*", { count: "exact", head: true }).in("ticket_id", ticketIds)
    : { count: 0 };
  if (!project) return apiError("not_found", "Project not found");
  if (!org) return apiError("internal", "Missing organization row");

  const brand = resolvePdfBrand({ org, client: null });

  try {
    const deck = await buildSponsorDeck({
      producerName: brand.producerName,
      sponsorName: b.sponsorName,
      projectName: project.name,
      dateRange: b.dateRange,
      accentColor: brand.producerAccent,
      metrics: {
        totalAttendees: tickets?.length ?? undefined,
        scans: scanCount ?? undefined,
      },
      activations: b.activations,
      photos: [],
    });

      if (!isServiceClientAvailable()) {

        return apiError(

          "service_unavailable",

          "This endpoint requires SUPABASE_SERVICE_ROLE_KEY in the runtime environment.",

        );

      }

    const svc = createServiceClient();
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const path = `${session.orgId}/sponsor-decks/${project.id}-${stamp}.pptx`;
    const { error: upErr } = await svc.storage.from("exports").upload(path, deck, {
      contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      upsert: true,
    });
    if (upErr) return apiError("internal", upErr.message);
    const { data: url } = await svc.storage.from("exports").createSignedUrl(path, 300, {
      download: `${b.sponsorName.toLowerCase().replace(/\s+/g, "-")}-${project.name.toLowerCase().replace(/\s+/g, "-")}-recap.pptx`,
    });
    if (!url) return apiError("internal", "Failed to sign deck URL");
    return NextResponse.redirect(url.signedUrl, 302);
  } catch (e) {
    log.error("sponsor_deck.compile_failed", { project_id: project.id, err: e instanceof Error ? e.message : String(e) });
    return apiError("internal", "Failed to render sponsor deck");
  }
}
