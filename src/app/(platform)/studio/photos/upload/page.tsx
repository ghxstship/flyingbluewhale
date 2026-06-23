import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { PhotoUploadForm } from "./PhotoUploadForm";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.photos.upload.eyebrow", undefined, "Operations")}
          title={t("console.photos.upload.title", undefined, "Upload Photos")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.photos.upload.configureSupabase", undefined, "Configure Supabase to upload photos.")}
          </div>
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
        eyebrow={t("console.photos.upload.eyebrow", undefined, "Operations")}
        title={t("console.photos.upload.title", undefined, "Upload Photos")}
        subtitle={t(
          "console.photos.upload.subtitle",
          undefined,
          "Attach jobsite or production photos to a project album.",
        )}
        breadcrumbs={[
          { label: t("console.photos.upload.breadcrumbs.operations", undefined, "Operations"), href: "/studio" },
          { label: t("console.photos.upload.breadcrumbs.photos", undefined, "Photos"), href: "/studio/photos" },
          { label: t("console.photos.upload.breadcrumbs.upload", undefined, "Upload") },
        ]}
      />
      <div className="page-content max-w-2xl">
        {projects.length === 0 ? (
          <div className="surface p-6 text-sm text-[var(--p-text-2)]">
            {t(
              "console.photos.upload.noProjects",
              undefined,
              "No active projects. Create one before uploading photos.",
            )}
          </div>
        ) : (
          <PhotoUploadForm projects={projects} />
        )}
      </div>
    </>
  );
}
