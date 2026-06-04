export const dynamic = "force-dynamic";

import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { fmtDate } from "@/components/detail/DetailShell";
import { getRequestT } from "@/lib/i18n/request";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t } = await getRequestT();
  const project = await projectIdFromSlug(slug);
  type File = { id: string; title: string | null; type: string; file_path: string | null; updated_at: string };
  let files: File[] = [];
  if (project) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("deliverables")
      .select("id, title, type, file_path, updated_at")
      .eq("project_id", project.id)
      .is("deleted_at", null)
      .not("file_path", "is", null)
      .order("updated_at", { ascending: false });
    files = (data ?? []) as File[];
  }
  return (
    <PortalSubpage
      slug={slug}
      persona="client"
      title={t("p.client.files.title", undefined, "Files")}
      subtitle={t("p.client.files.subtitle", undefined, "Branded deliverables shared with you")}
    >
      {files.length === 0 ? (
        <EmptyState
          title={t("p.client.files.empty.title", undefined, "No Files Yet")}
          description={t(
            "p.client.files.empty.description",
            undefined,
            "Uploaded project deliverables appear here as they move through review.",
          )}
        />
      ) : (
        <ul className="space-y-2">
          {files.map((f) => (
            <li key={f.id}>
              <a
                href={`/api/v1/deliverables/${f.id}/download`}
                className="surface hover-lift flex items-center justify-between p-4"
              >
                <div>
                  <div className="text-sm font-medium">
                    {f.title ?? t("p.client.files.untitled", undefined, "Untitled")}
                  </div>
                  <div className="font-mono text-[10px] tracking-[0.2em] text-[var(--text-muted)] uppercase">
                    {f.type}
                  </div>
                </div>
                <div className="font-mono text-xs text-[var(--text-muted)]">{fmtDate(f.updated_at)}</div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </PortalSubpage>
  );
}
