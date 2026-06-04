export const dynamic = "force-dynamic";

import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { fmtDate } from "@/components/detail/DetailShell";
import { getRequestT } from "@/lib/i18n/request";

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  const [{ data: project }, { data: files }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .eq("id", projectId)
      .maybeSingle(),
    supabase
      .from("deliverables")
      .select("id, title, type, file_path, updated_at")
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .not("file_path", "is", null)
      .order("updated_at", { ascending: false }),
  ]);
  return (
    <>
      <ModuleHeader
        eyebrow={project?.name ?? t("console.projects.files.eyebrowFallback", undefined, "Project")}
        title={t("console.projects.files.title", undefined, "Files")}
        subtitle={
          (files?.length ?? 0) === 1
            ? t(
                "console.projects.files.subtitleOne",
                { count: files?.length ?? 0 },
                `${files?.length ?? 0} Uploaded Deliverable`,
              )
            : t(
                "console.projects.files.subtitleOther",
                { count: files?.length ?? 0 },
                `${files?.length ?? 0} Uploaded Deliverables`,
              )
        }
        breadcrumbs={[
          { label: t("console.projects.files.breadcrumbProjects", undefined, "Projects"), href: "/console/projects" },
          {
            label: project?.name ?? t("console.projects.files.eyebrowFallback", undefined, "Project"),
            href: `/console/projects/${projectId}`,
          },
          { label: t("console.projects.files.breadcrumbFiles", undefined, "Files") },
        ]}
      />
      <div className="page-content max-w-5xl">
        {!files || files.length === 0 ? (
          <EmptyState
            title={t("console.projects.files.emptyTitle", undefined, "No Files Uploaded")}
            description={t(
              "console.projects.files.emptyDescription",
              undefined,
              "Deliverables that have attached file paths appear here. Upload from the relevant portal.",
            )}
          />
        ) : (
          <ul className="space-y-2">
            {files.map((f) => (
              <li key={f.id}>
                <Link
                  href={`/api/v1/deliverables/${f.id}/download`}
                  className="surface hover-lift flex items-center justify-between p-4"
                >
                  <div>
                    <div className="text-sm font-medium">
                      {f.title ?? t("console.projects.files.untitled", undefined, "Untitled")}
                    </div>
                    <div className="font-mono text-[10px] tracking-[0.2em] text-[var(--text-muted)] uppercase">
                      {f.type}
                    </div>
                  </div>
                  <div className="font-mono text-xs text-[var(--text-muted)]">{fmtDate(f.updated_at)}</div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
