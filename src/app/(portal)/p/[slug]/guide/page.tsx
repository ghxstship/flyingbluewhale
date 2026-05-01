import Link from "next/link";
import { FileDown } from "lucide-react";
import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { hasSupabase } from "@/lib/env";
import { getSession } from "@/lib/auth";
import { personaForRole } from "@/lib/auth";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { getGuideByPersona, PERSONA_TIERS } from "@/lib/db/guides";
import { GuideView } from "@/components/guides/GuideView";
import { GuideComments } from "@/components/guides/GuideComments";
import { createClient } from "@/lib/supabase/server";
import type { GuideConfig } from "@/lib/guides/types";
import type { GuidePersona } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

function mapSessionToGuidePersona(role: string): GuidePersona {
  const persona = personaForRole(role as Parameters<typeof personaForRole>[0]);
  if (
    persona === "artist" ||
    persona === "vendor" ||
    persona === "client" ||
    persona === "sponsor" ||
    persona === "guest" ||
    persona === "crew"
  )
    return persona;
  if (
    persona === "owner" ||
    persona === "admin" ||
    persona === "controller" ||
    persona === "project_manager" ||
    persona === "developer"
  )
    return "staff";
  return "guest";
}

const VALID_PERSONAS = new Set<GuidePersona>([
  "artist",
  "vendor",
  "client",
  "sponsor",
  "guest",
  "crew",
  "staff",
  "custom",
]);

export default async function GuidePage({
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

  const session = await getSession();
  const sessionPersona: GuidePersona = session ? mapSessionToGuidePersona(session.role) : "guest";
  // Dev-mode bypass: in local development, treat the viewer as tier 1 so the
  // ?as=<persona> override and the chip-bar work without an authenticated session.
  // Production keeps the strict tier-hierarchy gate below.
  const isDev = process.env.NODE_ENV === "development";
  const effectivePersona: GuidePersona = isDev && !session ? "staff" : sessionPersona;
  const sessionTier = PERSONA_TIERS[effectivePersona].tier;

  // ?as=<persona> preview override gated by tier hierarchy. Lower-numbered tiers
  // hold higher permissions, so a user can view as any persona whose tier is
  // greater than or equal to their own (i.e. equal-or-lower permission).
  const asParam = typeof sp.as === "string" ? sp.as : undefined;
  const asPersona: GuidePersona | null =
    !!asParam && VALID_PERSONAS.has(asParam as GuidePersona) ? (asParam as GuidePersona) : null;
  const asPersonaAllowed = (!!session || isDev) && !!asPersona && PERSONA_TIERS[asPersona].tier >= sessionTier;
  const previewing = asPersonaAllowed && asPersona !== effectivePersona;
  const persona: GuidePersona = previewing ? (asPersona as GuidePersona) : effectivePersona;
  const guide = await getGuideByPersona(project.id, persona);

  if (!guide || !guide.published) {
    return (
      <>
        <ModuleHeader eyebrow={project.name} title="Event Guide" subtitle="Your Know-Before-You-Go" />
        <div className="page-content">
          <div className="surface p-6 text-sm text-[var(--text-muted)]">
            The production team hasn&apos;t published a guide for your role yet. Check back soon.
          </div>
        </div>
      </>
    );
  }

  // Initial comments (server-fetched for first paint)
  const supabase = await createClient();
  const { data: initialComments } = await supabase
    .from("guide_comments")
    .select("id, body, author_name, created_at, resolved_at")
    .eq("guide_id", guide.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <>
      <ModuleHeader
        eyebrow={project.name}
        title={guide.title}
        subtitle={guide.subtitle ?? undefined}
        action={
          <Link
            href={`/api/v1/guides/${guide.id}/pdf`}
            className="btn btn-ghost btn-sm inline-flex items-center gap-1.5"
            aria-label="Download this guide as a PDF"
          >
            <FileDown size={14} aria-hidden="true" />
            Download PDF
          </Link>
        }
      />
      <div className="page-content max-w-4xl">
        {(session || isDev) && (
          <PreviewSwitcher slug={slug} active={persona} previewing={previewing} sessionTier={sessionTier} />
        )}
        <GuideView
          title={guide.title}
          subtitle={guide.subtitle}
          classification={guide.classification}
          tier={guide.tier}
          config={guide.config as GuideConfig}
          comments={
            <GuideComments
              guideId={guide.id}
              orgId={guide.org_id}
              initial={(initialComments ?? []) as Parameters<typeof GuideComments>[0]["initial"]}
            />
          }
        />
      </div>
    </>
  );
}

const PREVIEW_PERSONAS: { value: GuidePersona; label: string }[] = [
  { value: "staff", label: "Production" },
  { value: "crew", label: "Operations" },
  { value: "vendor", label: "Food & Beverage" },
  { value: "sponsor", label: "Sponsors" },
  { value: "artist", label: "Talent" },
  { value: "guest", label: "Guests" },
  { value: "custom", label: "Temporary Access" },
];

function PreviewSwitcher({
  slug,
  active,
  previewing,
  sessionTier,
}: {
  slug: string;
  active: GuidePersona;
  previewing: boolean;
  sessionTier: number;
}) {
  // A user can preview any persona whose tier is greater than or equal to
  // their own session tier (i.e. equal-or-lower permission level).
  const visible = PREVIEW_PERSONAS.filter((p) => PERSONA_TIERS[p.value].tier >= sessionTier);
  if (visible.length < 2) return null;
  return (
    <div className="surface mb-4 flex flex-wrap items-center gap-2 px-4 py-2.5 text-xs">
      <span className="font-medium text-[var(--text-secondary)]">{previewing ? "Previewing as" : "Preview as"}</span>
      {visible.map((p) => {
        const isActive = p.value === active;
        return (
          <Link
            key={p.value}
            href={`/p/${slug}/guide?as=${p.value}`}
            aria-current={isActive ? "page" : undefined}
            className={
              isActive
                ? "rounded-full bg-[var(--org-primary)] px-2.5 py-1 font-medium text-[var(--background)]"
                : "rounded-full bg-[var(--surface-inset)] px-2.5 py-1 text-[var(--text-secondary)] hover:bg-[var(--surface-raised)]"
            }
          >
            {p.label}
          </Link>
        );
      })}
      {previewing && (
        <Link href={`/p/${slug}/guide`} className="ml-auto text-[var(--text-muted)] underline-offset-2 hover:underline">
          Exit preview
        </Link>
      )}
    </div>
  );
}
