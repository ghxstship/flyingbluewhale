export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StagePlotCanvas } from "@/components/stage-plots/StagePlotCanvas";

type StoredElement = {
  id: string;
  kind:
    | "mic"
    | "monitor"
    | "amp"
    | "drum_kit"
    | "guitar"
    | "keys"
    | "speaker"
    | "di_box"
    | "light_truss"
    | "riser";
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
};

export default async function StagePlotDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; stagePlotId: string }>;
}) {
  const { projectId, stagePlotId } = await params;
  const session = await requireSession();
  const supabase = await createClient();

  const [{ data: project }, { data: plot }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name")
      .eq("id", projectId)
      .eq("org_id", session.orgId)
      .maybeSingle(),
    supabase
      .from("stage_plots")
      .select("id, name, width_ft, depth_ft, elements")
      .eq("id", stagePlotId)
      .eq("project_id", projectId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle(),
  ]);

  if (!plot) notFound();

  return (
    <>
      <ModuleHeader
        eyebrow={project?.name ?? "Project"}
        title={plot.name}
        subtitle="Drag-and-drop 2D stage layout editor."
        breadcrumbs={[
          { label: "Projects", href: "/console/projects" },
          { label: project?.name ?? "Project", href: `/console/projects/${projectId}` },
          { label: "Stage plots", href: `/console/projects/${projectId}/stage-plots` },
          { label: plot.name },
        ]}
      />
      <div className="page-content">
        <StagePlotCanvas
          plotId={plot.id}
          initial={{
            name: plot.name,
            widthFt: plot.width_ft ?? 32,
            depthFt: plot.depth_ft ?? 24,
            elements: ((plot.elements as unknown) as StoredElement[] | null) ?? [],
          }}
        />
      </div>
    </>
  );
}
