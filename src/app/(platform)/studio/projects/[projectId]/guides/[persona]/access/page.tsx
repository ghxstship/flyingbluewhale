import { notFound } from "next/navigation";
import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { getProject } from "@/lib/db/projects";
import { PERSONA_TIERS } from "@/lib/db/guides";
import { listAccessCodes, listRedemptions } from "@/lib/db/guide-access";
import { hasSupabase } from "@/lib/env";
import { isPublicPersona } from "@/lib/guides/access-token";
import { getRequestT } from "@/lib/i18n/request";
import type { GuidePersona } from "@/lib/supabase/types";
import { AccessCodeManager } from "./AccessCodeManager";

export const dynamic = "force-dynamic";

const VALID: GuidePersona[] = [
  "staff",
  "crew",
  "vendor",
  "brand_ambassador",
  "sponsor",
  "artist",
  "media_press",
  "client",
  "guest",
  "custom",
];

export default async function GuideAccessPage({ params }: { params: Promise<{ projectId: string; persona: string }> }) {
  const { projectId, persona: rawPersona } = await params;
  if (!hasSupabase) notFound();
  if (!VALID.includes(rawPersona as GuidePersona)) notFound();
  const persona = rawPersona as GuidePersona;

  const session = await requireSession();
  const { t } = await getRequestT();
  const project = await getProject(session.orgId, projectId);
  if (!project) notFound();

  const tierInfo = PERSONA_TIERS[persona];
  const publicPersona = isPublicPersona(persona);

  // If this persona is public, render an explainer rather than a CRUD UI —
  // codes are meaningless when anyone with the URL can already view.
  if (publicPersona) {
    return (
      <>
        <ModuleHeader
          eyebrow={project.name}
          title={t(
            "console.projects.guides.access.publicTitle",
            { persona: labelFor(persona, t) },
            `${labelFor(persona, t)} · access`,
          )}
          subtitle={t(
            "console.projects.guides.access.subtitle",
            { tier: tierInfo.tier, classification: tierInfo.classification },
            `Tier ${tierInfo.tier} · ${tierInfo.classification}`,
          )}
        />
        <div className="page-content max-w-3xl">
          <div className="surface space-y-3 p-6">
            <Badge variant="success">
              {t("console.projects.guides.access.publicBadge", undefined, "Public (no code required)")}
            </Badge>
            <p className="text-sm text-[var(--p-text-2)]">
              {t(
                "console.projects.guides.access.publicExplainer",
                undefined,
                "This persona is publicly accessible. Anyone with the link sees this guide once it is published. There is nothing to manage here.",
              )}
            </p>
            <p className="text-xs text-[var(--p-text-2)]">
              {t("console.projects.guides.access.publicUrlLabel", undefined, "Public URL:")}{" "}
              <code className="font-mono">
                /p/{project.slug ?? "<slug>"}/guide?as={persona}
              </code>
            </p>
            <div className="pt-2">
              <Link
                href={`/studio/projects/${projectId}/guides/${persona}`}
                className="ps-btn ps-btn--ghost ps-btn--sm"
              >
                {t("console.projects.guides.access.editGuideContent", undefined, "Edit guide content")}
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  const codes = await listAccessCodes(session.orgId, projectId);
  const codesForPersona = codes.filter((c) => c.persona === persona);
  const redemptions = await listRedemptions(session.orgId, projectId, 50);
  const redemptionsForPersona = redemptions.filter((r) => r.persona === persona);

  return (
    <>
      <ModuleHeader
        eyebrow={project.name}
        title={t(
          "console.projects.guides.access.codesTitle",
          { persona: labelFor(persona, t) },
          `${labelFor(persona, t)} · access codes`,
        )}
        subtitle={t(
          "console.projects.guides.access.subtitle",
          { tier: tierInfo.tier, classification: tierInfo.classification },
          `Tier ${tierInfo.tier} · ${tierInfo.classification}`,
        )}
      />
      <div className="page-content max-w-4xl">
        <AccessCodeManager
          projectId={projectId}
          persona={persona}
          codes={codesForPersona}
          redemptions={redemptionsForPersona}
        />
      </div>
    </>
  );
}

function labelFor(
  p: GuidePersona,
  t: (key: string, vars?: Record<string, string | number>, fallback?: string) => string,
): string {
  const map: Record<GuidePersona, string> = {
    staff: t("console.projects.guides.access.persona.staff", undefined, "Production"),
    crew: t("console.projects.guides.access.persona.crew", undefined, "Operations"),
    vendor: t("console.projects.guides.access.persona.vendor", undefined, "Food & Beverage"),
    brand_ambassador: t("console.projects.guides.access.persona.brand_ambassador", undefined, "Brand Ambassador"),
    sponsor: t("console.projects.guides.access.persona.sponsor", undefined, "Sponsors"),
    artist: t("console.projects.guides.access.persona.artist", undefined, "Talent"),
    media_press: t("console.projects.guides.access.persona.media_press", undefined, "Media & Press"),
    client: t("console.projects.guides.access.persona.client", undefined, "Client"),
    guest: t("console.projects.guides.access.persona.guest", undefined, "Guests"),
    custom: t("console.projects.guides.access.persona.custom", undefined, "Temporary Access"),
  };
  return map[p];
}
