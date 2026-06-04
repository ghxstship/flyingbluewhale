export const dynamic = "force-dynamic";

import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtDate } from "@/components/detail/DetailShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getRequestT } from "@/lib/i18n/request";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await requireSession();
  const { t } = await getRequestT();
  const supabase = await createClient();
  const { data } = await supabase
    .from("deliverables")
    .select("id, title, type, fulfillment_state, version, updated_at")
    .eq("org_id", session.orgId)
    .eq("submitted_by", session.userId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(100);
  const rows = (data ?? []) as Array<{
    id: string;
    title: string | null;
    type: string;
    fulfillment_state: string;
    version: number;
    updated_at: string;
  }>;
  return (
    <PortalSubpage
      slug={slug}
      persona="vendor"
      title={t("p.vendor.submissions.title", undefined, "Submissions")}
      subtitle={t("p.vendor.submissions.subtitle", undefined, "What you've sent in")}
    >
      {rows.length === 0 ? (
        <EmptyState
          title={t("p.vendor.submissions.empty.title", undefined, "No Submissions Yet")}
          description={t(
            "p.vendor.submissions.empty.description",
            undefined,
            "Deliverables you submit via Advancing appear here with their review status.",
          )}
        />
      ) : (
        <table className="data-table w-full text-sm">
          <thead>
            <tr>
              <th>{t("p.vendor.submissions.col.title", undefined, "Title")}</th>
              <th>{t("p.vendor.submissions.col.type", undefined, "Type")}</th>
              <th>{t("p.vendor.submissions.col.version", undefined, "v")}</th>
              <th>{t("p.vendor.submissions.col.status", undefined, "Status")}</th>
              <th>{t("p.vendor.submissions.col.updated", undefined, "Updated")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.title ?? t("p.vendor.submissions.untitled", undefined, "Untitled")}</td>
                <td className="font-mono text-xs">{r.type}</td>
                <td className="font-mono text-xs">{r.version}</td>
                <td>
                  <StatusBadge status={r.fulfillment_state} />
                </td>
                <td className="font-mono text-xs">{fmtDate(r.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </PortalSubpage>
  );
}
