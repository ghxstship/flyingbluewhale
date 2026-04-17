import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { hasSupabase } from "@/lib/env";
import { getSession } from "@/lib/auth";
import { personaForRole } from "@/lib/auth";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { getGuideByPersona } from "@/lib/db/guides";
import { GuideView } from "@/components/guides/GuideView";
import type { GuideConfig } from "@/lib/guides/types";
import type { GuidePersona } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

function mapSessionToGuidePersona(role: string): GuidePersona {
  const persona = personaForRole(role as Parameters<typeof personaForRole>[0]);
  if (persona === "artist" || persona === "vendor" || persona === "client" || persona === "sponsor" || persona === "guest" || persona === "crew") return persona;
  if (persona === "owner" || persona === "admin" || persona === "controller" || persona === "project_manager" || persona === "developer") return "staff";
  return "guest";
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) notFound();
  const project = await projectIdFromSlug(slug);
  if (!project) notFound();

  const session = await getSession();
  const persona: GuidePersona = session ? mapSessionToGuidePersona(session.role) : "guest";
  const guide = await getGuideByPersona(project.id, persona);

  if (!guide || !guide.published) {
    return (
      <>
        <ModuleHeader eyebrow={project.name} title="Event guide" subtitle="Your Know-Before-You-Go" />
        <div className="page-content">
          <div className="surface p-6 text-sm text-[var(--text-muted)]">
            The production team hasn&apos;t published a guide for your role yet. Check back soon.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ModuleHeader eyebrow={project.name} title={guide.title} subtitle={guide.subtitle ?? undefined} />
      <div className="page-content max-w-4xl">
        <GuideView
          title={guide.title}
          subtitle={guide.subtitle}
          classification={guide.classification}
          tier={guide.tier}
          config={guide.config as GuideConfig}
        />
      </div>
    </>
  );
}
