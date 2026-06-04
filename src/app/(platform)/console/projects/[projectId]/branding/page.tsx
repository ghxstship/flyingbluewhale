import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { safeBranding } from "@/lib/branding";
import { getRequestT } from "@/lib/i18n/request";
import { BrandingForm } from "./BrandingForm";

export const dynamic = "force-dynamic";

export default async function BrandingPage({ params }: { params: Promise<{ projectId: string }> }) {
  if (!hasSupabase) notFound();
  const { projectId } = await params;
  const supabase = await createClient();
  const { data: project } = await supabase.from("projects").select("id, name, branding").eq("id", projectId).single();

  if (!project) notFound();
  const branding = safeBranding(project.branding);
  const { t } = await getRequestT();

  return (
    <>
      <ModuleHeader
        eyebrow={project.name}
        title={t("console.projects.branding.title", undefined, "Branding")}
        subtitle={t(
          "console.projects.branding.subtitle",
          undefined,
          "White-Label Tokens For This Project's GVTEWAY Portal",
        )}
      />
      <div className="page-content max-w-2xl">
        <BrandingForm projectId={project.id} initial={branding} projectName={project.name} />
      </div>
    </>
  );
}
