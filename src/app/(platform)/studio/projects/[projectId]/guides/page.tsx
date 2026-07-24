import { notFound } from "next/navigation";
import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { can, isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getProject } from "@/lib/db/projects";
import { listGuides, PERSONA_TIERS } from "@/lib/db/guides";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import type { GuidePersona } from "@/lib/supabase/types";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { createGuideFromTemplateAction, saveGuideAsTemplateAction } from "./actions";

export const dynamic = "force-dynamic";

const ALL_PERSONAS: GuidePersona[] = ["staff", "crew", "vendor", "artist", "client", "sponsor", "guest", "custom"];

export default async function GuidesIndex({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  if (!hasSupabase) notFound();
  const session = await requireSession();
  const project = await getProject(session.orgId, projectId);
  if (!project) notFound();
  const guides = await listGuides(session.orgId, projectId);
  const { t } = await getRequestT();

  const byPersona = new Map(guides.map((g) => [g.persona, g]));

  // Org-level guide templates (template-management program, 2026-07-24).
  // Published templates seed new guides; any existing guide can be captured.
  const canManageTemplates = isManagerPlus(session) || can(session, "templates:write");
  const supabase = await createClient();
  const loose = supabase as unknown as LooseSupabase;
  const { data: tplRows } = await loose
    .from("org_guide_templates")
    .select("id, name, persona, description")
    .eq("org_id", session.orgId)
    .eq("template_state", "published")
    .is("deleted_at", null)
    .order("name", { ascending: true })
    .limit(100);
  const guideTemplates = (tplRows ?? []) as Array<{
    id: string;
    name: string;
    persona: GuidePersona;
    description: string | null;
  }>;

  // Per-guide viewer counts (guide_views read receipts, one row per viewer
  // per guide). One batched read across all guide ids, counted in-process.
  // guide_views is not in the generated client types yet (regen deferred).
  const viewCounts = new Map<string, number>();
  if (guides.length > 0) {
    const { data: viewRows } = await loose
      .from("guide_views")
      .select("guide_id")
      .in(
        "guide_id",
        guides.map((g) => g.id),
      );
    for (const row of (viewRows ?? []) as Array<{ guide_id: string }>) {
      viewCounts.set(row.guide_id, (viewCounts.get(row.guide_id) ?? 0) + 1);
    }
  }

  return (
    <>
      <ModuleHeader
        eyebrow={project.name}
        title={t("console.projects.guides.title", undefined, "Event Guides")}
        subtitle={t("console.projects.guides.subtitle", undefined, "Per-role know-before-you-go.")}
      />
      <div className="page-content space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ALL_PERSONAS.map((p) => {
            const existing = byPersona.get(p);
            const tierInfo = PERSONA_TIERS[p];
            return (
              <Link key={p} href={`/studio/projects/${projectId}/guides/${p}`} className="surface hover-lift p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{toTitle(p)}</div>
                  {existing?.published ? (
                    <Badge variant="success">{t("console.projects.guides.statusLive", undefined, "Live")}</Badge>
                  ) : existing ? (
                    <Badge variant="muted">{t("console.projects.guides.statusDraft", undefined, "Draft")}</Badge>
                  ) : (
                    <Badge variant="muted">{t("console.projects.guides.statusNone", undefined, "None")}</Badge>
                  )}
                </div>
                <div className="mt-2 text-xs text-[var(--p-text-2)]">
                  {t(
                    "console.projects.guides.tierLine",
                    { tier: tierInfo.tier, classification: tierInfo.classification },
                    `Tier ${tierInfo.tier} · ${tierInfo.classification}`,
                  )}
                </div>
                {existing?.title && <div className="mt-2 text-sm">{existing.title}</div>}
                {existing && (
                  <div className="mt-1 text-xs text-[var(--p-text-3)]">
                    {t(
                      "console.projects.guides.viewCount",
                      { count: viewCounts.get(existing.id) ?? 0 },
                      `${viewCounts.get(existing.id) ?? 0} views`,
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
        {canManageTemplates && (
          <div className="surface p-5">
            <div className="text-sm font-semibold">
              {t("console.projects.guides.templatesHeading", undefined, "Org Guide Templates")}
            </div>
            <p className="mt-2 text-sm text-[var(--p-text-2)]">
              {t(
                "console.projects.guides.templatesDescription",
                undefined,
                "Seed a guide from a published org template, or capture one of this project's guides as a reusable template. Templates are managed in the LEG3ND library.",
              )}
            </p>
            {guideTemplates.length > 0 && (
              <ul className="mt-3 space-y-2">
                {guideTemplates.map((tpl) => (
                  <li key={tpl.id} className="flex flex-wrap items-center gap-3">
                    <span className="text-sm">{tpl.name}</span>
                    <Badge variant="muted">{toTitle(tpl.persona)}</Badge>
                    {tpl.description && (
                      <span className="text-xs text-[var(--p-text-3)]">{tpl.description}</span>
                    )}
                    <form
                      action={async () => {
                        "use server";
                        const res = await createGuideFromTemplateAction(projectId, tpl.id);
                        if (res.error) throw new Error(res.error);
                      }}
                      className="ml-auto"
                    >
                      <Button type="submit" variant="secondary">
                        {t("console.projects.guides.useTemplate", undefined, "Use for this project")}
                      </Button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
            {guideTemplates.length === 0 && (
              <p className="mt-3 text-xs text-[var(--p-text-3)]">
                {t(
                  "console.projects.guides.noTemplates",
                  undefined,
                  "No published templates yet. Capture a guide below, then publish it in the LEG3ND library.",
                )}
              </p>
            )}
            {guides.length > 0 && (
              <div className="mt-4 border-t border-[var(--p-border)] pt-3">
                <div className="text-xs font-semibold text-[var(--p-text-2)]">
                  {t("console.projects.guides.captureHeading", undefined, "Capture as template")}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {guides.map((g) => (
                    <form
                      key={g.persona}
                      action={async () => {
                        "use server";
                        const res = await saveGuideAsTemplateAction(projectId, g.persona);
                        if (res.error) throw new Error(res.error);
                      }}
                    >
                      <Button type="submit" variant="secondary">
                        {t(
                          "console.projects.guides.saveAsTemplate",
                          { persona: toTitle(g.persona) },
                          `Save ${toTitle(g.persona)} as template`,
                        )}
                      </Button>
                    </form>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <div className="surface-inset p-5 text-sm text-[var(--p-text-2)]">
          <div className="text-sm font-semibold text-[var(--p-text-1)]">
            {t("console.projects.guides.customHeading", undefined, "Custom Guide")}
          </div>
          <p className="mt-2">
            {t(
              "console.projects.guides.customDescription",
              undefined,
              "Build a guide for a role that isn't on the standard list. Same renderer, your fields.",
            )}
          </p>
          <div className="mt-3">
            <Button href={`/studio/projects/${projectId}/guides/custom`} variant="secondary">
              {t("console.projects.guides.startCustom", undefined, "Start Custom Guide")}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
