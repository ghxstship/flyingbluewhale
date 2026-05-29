import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getProject } from "@/lib/db/projects";
import { hasSupabase } from "@/lib/env";
import { getGuideByPersona } from "@/lib/db/guides";
import { SignageKiosk } from "./SignageKiosk";
import type { GuidePersona } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const VALID_PERSONAS: GuidePersona[] = [
  "staff", "crew", "vendor", "artist", "client", "sponsor", "guest", "custom",
];

export default async function SignagePage({
  params,
}: {
  params: Promise<{ projectId: string; persona: string }>;
}) {
  const { projectId, persona } = await params;
  if (!hasSupabase) notFound();
  if (!VALID_PERSONAS.includes(persona as GuidePersona)) notFound();

  const session = await requireSession();
  const project = await getProject(session.orgId, projectId);
  if (!project) notFound();

  const guide = await getGuideByPersona(projectId, persona as GuidePersona);
  if (!guide) notFound();

  return (
    <SignageKiosk
      guideId={guide.id}
      projectName={project.name}
      persona={persona}
    />
  );
}
