import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { resolvePdfBrand } from "@/lib/pdf/branding";
import { compileAndStore } from "@/lib/pdf/render";
import { GuidePdf } from "@/lib/pdf/guide";
import { log } from "@/lib/log";
import type { GuideConfig } from "@/lib/guides/types";

/**
 * GET /api/v1/guides/[guideId]/pdf
 *
 * Renders an event guide to PDF. Authorization mirrors the web guide
 * page: anon visitors can download when `published=true`; authed users
 * can always download their own tenant's guides regardless of publish
 * state. The PDF is always compiled to attachment disposition so
 * operators can right-click-save on the portal.
 */

const ParamsSchema = z.object({ guideId: z.string().uuid() });

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ guideId: string }> }) {
  const { guideId } = await ctx.params;
  const parsed = ParamsSchema.safeParse({ guideId });
  if (!parsed.success) return apiError("bad_request", "Invalid guide id");

  const supabase = await createClient();

  // RLS on event_guides enforces both: is_org_member OR (published=true).
  // We read the guide + its project under that policy — no manual guard
  // needed here.
  const { data: guide, error } = await supabase
    .from("event_guides")
    .select(
      "id, org_id, project_id, persona, config, title, subtitle, classification, tier, published",
    )
    .eq("id", parsed.data.guideId)
    .maybeSingle();
  if (error) return apiError("internal", error.message);
  if (!guide) return apiError("not_found", "Guide not found");

  const [{ data: project }, { data: org }] = await Promise.all([
    supabase.from("projects").select("name").eq("id", guide.project_id).maybeSingle(),
    supabase
      .from("orgs")
      .select("name, name_override, logo_url, branding")
      .eq("id", guide.org_id)
      .maybeSingle(),
  ]);

  if (!org) return apiError("internal", "Missing organization row");

  const brand = resolvePdfBrand({ org, client: null });

  try {
    const { signedUrl } = await compileAndStore({
      doc: (
        <GuidePdf
          brand={brand}
          title={guide.title}
          subtitle={guide.subtitle ?? null}
          classification={guide.classification ?? null}
          tier={typeof guide.tier === "number" ? guide.tier : null}
          config={guide.config as GuideConfig}
          eventName={project?.name ?? undefined}
          personaLabel={guide.persona}
        />
      ),
      bucket: "advancing",
      path: `guides/${guide.org_id}/${guide.project_id}/${guide.persona}.pdf`,
      signedUrlTtlSeconds: 60,
      contentDisposition: "attachment",
      filenameForAttachment: `${project?.name ?? "event"}-${guide.persona}-guide.pdf`,
    });
    return NextResponse.redirect(signedUrl, 302);
  } catch (e) {
    log.error("guide.pdf.compile_failed", { guide_id: guide.id, err: e instanceof Error ? e.message : String(e) });
    return apiError("internal", "Failed to render guide PDF");
  }
}
