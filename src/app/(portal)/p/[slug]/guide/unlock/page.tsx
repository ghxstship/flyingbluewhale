import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { hasSupabase } from "@/lib/env";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { PERSONA_TIERS } from "@/lib/db/guides";
import type { GuidePersona } from "@/lib/supabase/types";
import { getRequestT } from "@/lib/i18n/request";
import { UnlockForm } from "./UnlockForm";

export const dynamic = "force-dynamic";

const VALID_PERSONAS = new Set<GuidePersona>([
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
]);

function getPersonaLabels(
  t: (key: string, vars?: Record<string, string | number>, fallback?: string) => string,
): Record<GuidePersona, string> {
  return {
    staff: t("p.shared.guide.persona.staff", undefined, "Production"),
    crew: t("p.shared.guide.persona.crew", undefined, "Operations"),
    vendor: t("p.shared.guide.persona.vendor", undefined, "Food & Beverage"),
    brand_ambassador: t("p.shared.guide.persona.brand_ambassador", undefined, "Brand Ambassador"),
    sponsor: t("p.shared.guide.persona.sponsor", undefined, "Sponsors"),
    artist: t("p.shared.guide.persona.artist", undefined, "Talent"),
    media_press: t("p.shared.guide.persona.media_press", undefined, "Media & Press"),
    client: t("p.shared.guide.persona.client", undefined, "Client"),
    guest: t("p.shared.guide.persona.guest", undefined, "Guests"),
    custom: t("p.shared.guide.persona.custom", undefined, "Temporary Access"),
  };
}

export default async function UnlockPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  if (!hasSupabase) notFound();
  const project = await projectIdFromSlug(slug);
  if (!project) notFound();

  const { t } = await getRequestT();

  const asParam = typeof sp.as === "string" ? sp.as : undefined;
  const persona: GuidePersona =
    asParam && VALID_PERSONAS.has(asParam as GuidePersona) ? (asParam as GuidePersona) : "crew";
  const from = typeof sp.from === "string" ? sp.from : `/p/${slug}/guide`;
  const personaLabel = getPersonaLabels(t)[persona];
  const tier = PERSONA_TIERS[persona].tier;

  return (
    <>
      <ModuleHeader
        eyebrow={project.name}
        title={t("p.shared.guide.unlock.title", undefined, "Enter access code")}
        subtitle={t(
          "p.shared.guide.unlock.subtitle",
          { personaLabel },
          `Required for the ${personaLabel} guide, issued by your production lead.`,
        )}
      />
      <div className="page-content max-w-md">
        <div className="surface space-y-4 p-6">
          <div className="text-xs text-[var(--p-text-2)]">
            {t("p.shared.guide.unlock.tierLine", { tier, personaLabel }, `Tier ${tier} · ${personaLabel}`)}
          </div>
          <p className="text-sm text-[var(--p-text-2)]">
            {t(
              "p.shared.guide.unlock.body",
              undefined,
              "This guide is internal. If you were sent a code, paste it below. Codes are 10 characters and case-insensitive. Formatting like dashes is optional.",
            )}
          </p>
          <UnlockForm slug={slug} persona={persona} from={from} />
          <p className="text-xs text-[var(--p-text-2)]">
            {t(
              "p.shared.guide.unlock.needCodePrefix",
              undefined,
              "Need a code? Contact your production lead, or email",
            )}{" "}
            <a className="underline" href="mailto:hello@salvagecitysupperclub.com">
              hello@salvagecitysupperclub.com
            </a>
            .
          </p>
        </div>
      </div>
    </>
  );
}
