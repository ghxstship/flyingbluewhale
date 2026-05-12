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
          title={`${labelFor(persona)} — access`}
          subtitle={`Tier ${tierInfo.tier} · ${tierInfo.classification}`}
        />
        <div className="page-content max-w-3xl">
          <div className="surface space-y-3 p-6">
            <Badge variant="success">Public — no code required</Badge>
            <p className="text-sm text-[var(--text-secondary)]">
              This persona is publicly accessible. Anyone with the link sees this guide once it is published. There is
              nothing to manage here.
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Public URL:{" "}
              <code className="font-mono">
                /p/{project.slug ?? "<slug>"}/guide?as={persona}
              </code>
            </p>
            <div className="pt-2">
              <Link href={`/console/projects/${projectId}/guides/${persona}`} className="btn btn-secondary btn-sm">
                Edit guide content
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
        title={`${labelFor(persona)} — access codes`}
        subtitle={`Tier ${tierInfo.tier} · ${tierInfo.classification}`}
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

function labelFor(p: GuidePersona): string {
  const map: Record<GuidePersona, string> = {
    staff: "Production",
    crew: "Operations",
    vendor: "Food & Beverage",
    brand_ambassador: "Brand Ambassador",
    sponsor: "Sponsors",
    artist: "Talent",
    media_press: "Media & Press",
    client: "Client",
    guest: "Guests",
    custom: "Temporary Access",
  };
  return map[p];
}
