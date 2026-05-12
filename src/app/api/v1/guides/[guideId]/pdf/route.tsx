import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { resolvePdfBrand } from "@/lib/pdf/branding";
import { compileAndStore } from "@/lib/pdf/render";
import { GuidePdf } from "@/lib/pdf/guide";
import { log } from "@/lib/log";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";
import type { GuideConfig, GuidePersona } from "@/lib/guides/types";
import {
  cookieName as guideCookieName,
  isPublicPersona,
  verifyToken as verifyGuideAccessToken,
} from "@/lib/guides/access-token";

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

export async function GET(req: Request, ctx: { params: Promise<{ guideId: string }> }) {
  // Public-readable endpoint — anon visitors can hit it for published
  // guides. Bound to export bucket (5/min) per source IP so a public
  // crawler can't burn through CPU on every revision.
  const rl = await ratelimit({ key: keyFromRequest(req, "guide-pdf"), ...RATE_BUDGETS.export });
  if (!rl.ok) return apiError("rate_limited", "Guide PDF rate limit reached");

  const { guideId } = await ctx.params;
  const parsed = ParamsSchema.safeParse({ guideId });
  if (!parsed.success) return apiError("bad_request", "Invalid guide id");

  const supabase = await createClient();

  // RLS on event_guides enforces both: is_org_member OR (published=true).
  // We read the guide + its project under that policy — no manual guard
  // needed here.
  const { data: guide, error } = await supabase
    .from("event_guides")
    .select("id, org_id, project_id, persona, config, title, subtitle, classification, tier, published")
    .eq("id", parsed.data.guideId)
    .maybeSingle();
  if (error) return apiError("internal", error.message);
  if (!guide) return apiError("not_found", "Guide not found");

  // Mirror the portal page gate: public personas (tier 5) flow through
  // when published; internal personas require either an org session for
  // the guide's org or a redeemed access cookie unlocking this persona.
  const persona = guide.persona as GuidePersona;
  if (!isPublicPersona(persona)) {
    const session = await getSession();
    const isOrgMember = !!session && session.orgId === guide.org_id;
    let unlocked = false;
    if (!isOrgMember) {
      const cookieStore = await cookies();
      const tok = cookieStore.get(guideCookieName(guide.project_id))?.value ?? null;
      const verified = await verifyGuideAccessToken(tok, guide.project_id);
      unlocked = !!verified && verified.personas.includes(persona);
    }
    if (!isOrgMember && !unlocked) {
      return apiError("forbidden", "Access code required for this guide.");
    }
  }

  const [{ data: project }, { data: org }] = await Promise.all([
    supabase.from("projects").select("name").eq("id", guide.project_id).maybeSingle(),
    supabase.from("orgs").select("name, name_override, logo_url, branding").eq("id", guide.org_id).maybeSingle(),
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
