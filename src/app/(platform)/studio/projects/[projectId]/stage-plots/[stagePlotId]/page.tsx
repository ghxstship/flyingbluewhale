export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StagePlotCanvas } from "@/components/stage-plots/StagePlotCanvas";
import { getRequestT } from "@/lib/i18n/request";
import { deleteStagePlot } from "./edit/actions";

type StoredElement = {
  id: string;
  kind: "mic" | "monitor" | "amp" | "drum_kit" | "guitar" | "keys" | "speaker" | "di_box" | "light_truss" | "riser";
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
  const { t } = await getRequestT();

  const [{ data: project }, { data: plot }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name")
      .eq("id", projectId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
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
        eyebrow={project?.name ?? t("console.projects.stagePlots.detail.projectFallback", undefined, "Project")}
        title={plot.name}
        subtitle={t("console.projects.stagePlots.detail.subtitle", undefined, "Drag And Drop 2D Stage Layout Editor")}
        breadcrumbs={[
          {
            label: t("console.projects.stagePlots.detail.breadcrumbs.projects", undefined, "Projects"),
            href: "/studio/projects",
          },
          {
            label: project?.name ?? t("console.projects.stagePlots.detail.projectFallback", undefined, "Project"),
            href: `/studio/projects/${projectId}`,
          },
          {
            label: t("console.projects.stagePlots.detail.breadcrumbs.stagePlots", undefined, "Stage Plots"),
            href: `/studio/projects/${projectId}/stage-plots`,
          },
          { label: plot.name },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              href={`/studio/projects/${projectId}/stage-plots/${stagePlotId}/edit`}
              size="sm"
              variant="secondary"
            >
              {t("console.projects.stagePlots.detail.editMetadata", undefined, "Edit metadata")}
            </Button>
            <DeleteForm
              action={deleteStagePlot.bind(null, projectId, stagePlotId)}
              confirm={t(
                "console.projects.stagePlots.detail.deleteConfirm",
                { name: plot.name },
                `Delete stage plot "${plot.name}"? It will be soft-deleted.`,
              )}
            />
          </div>
        }
      />
      <div className="page-content">
        <StagePlotCanvas
          plotId={plot.id}
          initial={{
            name: plot.name,
            widthFt: plot.width_ft ?? 32,
            depthFt: plot.depth_ft ?? 24,
            elements: (plot.elements as unknown as StoredElement[] | null) ?? [],
          }}
        />
      </div>
    </>
  );
}
