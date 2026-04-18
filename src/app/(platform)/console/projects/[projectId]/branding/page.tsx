import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { safeBranding } from "@/lib/branding";
import { BrandingForm } from "./BrandingForm";

export const dynamic = "force-dynamic";

export default async function BrandingPage({ params }: { params: Promise<{ projectId: string }> }) {
  if (!hasSupabase) notFound();
  const { projectId } = await params;
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, branding")
    .eq("id", projectId)
    .single();

  if (!project) notFound();
  const branding = safeBranding(project.branding);

  return (
    <>
      <ModuleHeader
        eyebrow={project.name}
        title="Branding"
        subtitle="White-label tokens applied to this project's portals (GVTEWAY)."
      />
      <div className="page-content max-w-2xl">
        <BrandingForm projectId={project.id} initial={branding} projectName={project.name} />
      </div>
    </>
  );
}
