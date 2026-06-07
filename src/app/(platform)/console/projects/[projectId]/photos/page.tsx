import { ModuleHeader } from "@/components/Shell";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const { t } = await getRequestT();
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("project_photos")
    .select("id,album,file_path,caption,taken_at,taken_by,location_id,lat,lng")
    .eq("org_id", session.orgId)
    .eq("project_id", projectId)
    .order("taken_at", { ascending: false })
    .limit(200);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.projects.photos.eyebrow", undefined, "Project")}
        title={t("console.projects.photos.title", undefined, "Photos")}
        subtitle={
          rows && rows.length > 0
            ? rows.length === 1
              ? t(
                  "console.projects.photos.subtitleSingular",
                  { count: rows.length },
                  `${rows.length} photo (latest 200)`,
                )
              : t(
                  "console.projects.photos.subtitlePlural",
                  { count: rows.length },
                  `${rows.length} photos (latest 200)`,
                )
            : t("console.projects.photos.subtitleEmpty", undefined, "Field photos uploaded for this project.")
        }
      />
      <div className="page-content">
        {!rows || rows.length === 0 ? (
          <EmptyState
            title={t("console.projects.photos.emptyTitle", undefined, "No Photos")}
            description={t(
              "console.projects.photos.emptyDescription",
              undefined,
              "No photos have been uploaded for this project yet. Upload from the field PWA or via the Photos module.",
            )}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {rows.map((r) => (
              <div key={r.id} className="surface overflow-hidden">
                <div className="aspect-video bg-[var(--p-surface-2)]" aria-hidden="true" />
                <div className="space-y-1 p-3">
                  <div className="text-xs font-medium">
                    {r.caption ?? t("console.projects.photos.untitled", undefined, "Untitled")}
                  </div>
                  <div className="font-mono text-[10px] text-[var(--p-text-2)]">
                    {r.album ? `${r.album} · ` : ""}
                    {formatDate(r.taken_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
