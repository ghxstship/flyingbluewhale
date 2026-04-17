import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { getProject } from "@/lib/db/projects";
import { getGuideByPersona, PERSONA_TIERS } from "@/lib/db/guides";
import { hasSupabase } from "@/lib/env";
import type { GuidePersona } from "@/lib/supabase/types";
import { GuideEditor } from "./GuideEditor";

export const dynamic = "force-dynamic";

const VALID: GuidePersona[] = ["artist","vendor","client","sponsor","guest","crew","staff","custom"];

const SEED_CONFIG = JSON.stringify({
  pageTitles: ["The Event","Schedule","Contacts","Safety"],
  sections: [
    { type: "overview", heading: "The event", body: "Welcome to the show. This guide covers everything you need to know.", callouts: [{ kind: "pink", title: "Heads up", body: "Read to the end before show day." }] },
    { type: "schedule", heading: "Day-of schedule", entries: [
      { time: "06:00", activity: "Load-in begins", location: "Dock 3" },
      { time: "16:00", activity: "Doors", location: "Front of house" },
      { time: "21:30", activity: "Headliner" },
      { time: "23:30", activity: "Curfew" },
    ]},
    { type: "contacts", heading: "Key contacts", entries: [
      { header: "Production" },
      { role: "Stage manager", name: "TBD", phone: "555-0100" },
    ]},
    { type: "faq", heading: "FAQ", entries: [
      { q: "Where do I park?", a: "Lot B — marked with pink cones." },
    ]},
  ],
}, null, 2);

export default async function GuideEditorPage({ params }: { params: Promise<{ projectId: string; persona: string }> }) {
  const { projectId, persona: rawPersona } = await params;
  if (!hasSupabase) notFound();
  if (!VALID.includes(rawPersona as GuidePersona)) notFound();
  const persona = rawPersona as GuidePersona;

  const session = await requireSession();
  const project = await getProject(session.orgId, projectId);
  if (!project) notFound();

  const existing = await getGuideByPersona(projectId, persona);
  const tierInfo = PERSONA_TIERS[persona];

  return (
    <>
      <ModuleHeader
        eyebrow={project.name}
        title={`${persona.charAt(0).toUpperCase() + persona.slice(1)} guide`}
        subtitle={`Tier ${tierInfo.tier} · ${tierInfo.classification}`}
      />
      <div className="page-content max-w-4xl">
        <GuideEditor
          projectId={projectId}
          persona={persona}
          defaultValues={{
            title: existing?.title ?? `${project.name} — ${persona} guide`,
            subtitle: existing?.subtitle ?? "",
            classification: existing?.classification ?? tierInfo.classification,
            published: existing?.published ?? false,
            config: existing?.config ? JSON.stringify(existing.config, null, 2) : SEED_CONFIG,
          }}
        />
      </div>
    </>
  );
}
