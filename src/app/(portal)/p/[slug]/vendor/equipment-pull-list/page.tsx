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
  type Row = { id: string; title: string | null; updated_at: string };
  let items: Row[] = [];
  if (project) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("deliverables")
      .select("id, title, updated_at")
      .eq("project_id", project.id)
      .eq("type", "equipment_pull_list")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false });
    items = (data ?? []) as Row[];
  }
  return (
    <PortalSubpage
      slug={slug}
      persona="vendor"
      title={t("p.vendor.equipmentPullList.title", undefined, "Equipment Pull List")}
      subtitle={t("p.vendor.equipmentPullList.subtitle", undefined, "Confirmed gear for this job")}
    >
      {items.length === 0 ? (
        <EmptyState
          title={t("p.vendor.equipmentPullList.empty.title", undefined, "Pull List Not Published Yet")}
          description={t(
            "p.vendor.equipmentPullList.empty.description",
            undefined,
            "Production posts the confirmed pull list here once the advancing cycle settles.",
          )}
        />
      ) : (
        <ul className="space-y-2">
          {items.map((i) => (
            <li key={i.id} className="surface p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  {i.title ?? t("p.vendor.equipmentPullList.fallbackTitle", undefined, "Pull list")}
                </div>
                <div className="font-mono text-xs text-[var(--p-text-2)]">{fmtDate(i.updated_at)}</div>
              </div>
              <a href={`/api/v1/deliverables/${i.id}/pdf`} className="mt-2 inline-block text-xs text-[var(--p-accent)]">
                {t("p.vendor.equipmentPullList.downloadPdf", undefined, "Download PDF →")}
              </a>
            </li>
          ))}
        </ul>
      )}
    </PortalSubpage>
  );
}
