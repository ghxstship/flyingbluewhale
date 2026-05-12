import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { hasSupabase } from "@/lib/env";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { PERSONA_TIERS } from "@/lib/db/guides";
import type { GuidePersona } from "@/lib/supabase/types";
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

const PERSONA_LABELS: Record<GuidePersona, string> = {
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

  const asParam = typeof sp.as === "string" ? sp.as : undefined;
  const persona: GuidePersona =
    asParam && VALID_PERSONAS.has(asParam as GuidePersona) ? (asParam as GuidePersona) : "crew";
  const from = typeof sp.from === "string" ? sp.from : `/p/${slug}/guide`;
  const personaLabel = PERSONA_LABELS[persona];
  const tier = PERSONA_TIERS[persona].tier;

  return (
    <>
      <ModuleHeader
        eyebrow={project.name}
        title="Enter access code"
        subtitle={`Required for the ${personaLabel} guide — issued by your production lead.`}
      />
      <div className="page-content max-w-md">
        <div className="surface space-y-4 p-6">
          <div className="text-xs text-[var(--text-muted)]">
            Tier {tier} · {personaLabel}
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            This guide is internal. If you were sent a code, paste it below. Codes are 10 characters and
            case-insensitive — formatting like dashes is optional.
          </p>
          <UnlockForm slug={slug} persona={persona} from={from} />
          <p className="text-xs text-[var(--text-muted)]">
            Need a code? Contact your production lead, or email{" "}
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
