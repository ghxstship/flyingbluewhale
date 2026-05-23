import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { PhotoUploadForm } from "./PhotoUploadForm";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Operations" title="Upload Photos" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase to upload photos.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("projects")
    .select("id, name, project_state")
    .eq("org_id", session.orgId)
    .in("project_state", ["active", "draft"])
    .order("name");

  const projects = (data ?? []).map((p) => ({
    value: p.id,
    label: p.name,
    keywords: [p.project_state],
  }));

  return (
    <>
      <ModuleHeader
        eyebrow="Operations"
        title="Upload Photos"
        subtitle="Attach jobsite or production photos to a project album."
        breadcrumbs={[
          { label: "Operations", href: "/console" },
          { label: "Photos", href: "/console/photos" },
          { label: "Upload" },
        ]}
      />
      <div className="page-content max-w-2xl">
        {projects.length === 0 ? (
          <div className="surface p-6 text-sm text-[var(--text-muted)]">
            No active projects. Create one before uploading photos.
          </div>
        ) : (
          <PhotoUploadForm projects={projects} />
        )}
      </div>
    </>
  );
}
