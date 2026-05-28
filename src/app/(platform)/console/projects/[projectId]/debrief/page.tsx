export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { GenerateDebriefButton } from "./GenerateDebriefButton";

type Debrief = {
  id: string;
  body: string | null;
  model: string;
  generated_at: string | null;
};

function renderMarkdown(md: string): string {
  return md
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^\- (.+)$/gm, "<li>$1</li>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n\n/g, "\n")
    .trim();
}

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Project" title="Post-event debrief" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase to use this feature.</div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const [{ data: project }, { data: rawDebrief }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name")
      .eq("id", projectId)
      .eq("org_id", session.orgId)
      .maybeSingle(),
    supabase
      .from("project_debriefs")
      .select("id, body, model, generated_at")
      .eq("project_id", projectId)
      .maybeSingle(),
  ]);

  const proj = project as { id?: string; name?: string } | null;
  const debrief = rawDebrief as Debrief | null;

  return (
    <>
      <ModuleHeader
        eyebrow={proj?.name ?? "Project"}
        title="Post-event debrief"
        subtitle="AI-generated executive summary aggregating incidents, crew snapshots, expenses, and task completion."
        breadcrumbs={[
          { label: "Projects", href: "/console/projects" },
          { label: proj?.name ?? "Project", href: `/console/projects/${projectId}` },
          { label: "Post-event debrief" },
        ]}
        action={<GenerateDebriefButton projectId={projectId} hasExisting={Boolean(debrief?.body)} />}
      />
      <div className="page-content">
        {debrief?.body ? (
          <div className="surface p-6 max-w-3xl">
            {debrief.generated_at && (
              <p className="text-xs text-[var(--color-text-muted)] mb-4">
                Generated{" "}
                {new Date(debrief.generated_at).toLocaleString([], {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}{" "}
                · {debrief.model}
              </p>
            )}
            {/* biome-ignore lint/security/noDangerouslySetInnerHtml: AI-generated markdown, server-controlled content */}
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(debrief.body) }}
            />
          </div>
        ) : (
          <div className="surface p-8 text-center max-w-md mx-auto mt-8">
            <p className="text-[var(--color-text-muted)] mb-4">
              No debrief generated yet. Synthesize an AI post-event report from your project data.
            </p>
            <GenerateDebriefButton projectId={projectId} hasExisting={false} variant="primary" />
          </div>
        )}
      </div>
    </>
  );
}
