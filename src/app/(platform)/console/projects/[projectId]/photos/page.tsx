import { ModuleHeader } from "@/components/Shell";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
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
        eyebrow="Project"
        title="Photos"
        subtitle={
          rows && rows.length > 0
            ? `${rows.length} photo${rows.length === 1 ? "" : "s"} (latest 200)`
            : "Field photos uploaded for this project."
        }
      />
      <div className="page-content">
        {!rows || rows.length === 0 ? (
          <EmptyState
            title="No Photos"
            description="No photos have been uploaded for this project yet. Upload from the field PWA or via the Photos module."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {rows.map((r) => (
              <div key={r.id} className="surface overflow-hidden">
                <div className="aspect-video bg-[var(--surface-inset)]" aria-hidden="true" />
                <div className="space-y-1 p-3">
                  <div className="text-xs font-medium">{r.caption ?? "Untitled"}</div>
                  <div className="font-mono text-[10px] text-[var(--text-muted)]">
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
