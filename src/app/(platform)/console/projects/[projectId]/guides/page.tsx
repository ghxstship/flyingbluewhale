import { notFound } from "next/navigation";
import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { getProject } from "@/lib/db/projects";
import { listGuides, PERSONA_TIERS } from "@/lib/db/guides";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import type { GuidePersona } from "@/lib/supabase/types";

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
              <Link key={p} href={`/console/projects/${projectId}/guides/${p}`} className="surface hover-lift p-5">
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
              </Link>
            );
          })}
        </div>
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
            <Button href={`/console/projects/${projectId}/guides/custom`} variant="secondary">
              {t("console.projects.guides.startCustom", undefined, "Start Custom Guide")}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
