import { PortalSubpage } from "@/components/PortalSubpage";
import { DataView } from "@/components/views/DataViewServer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { listDeliverables, projectIdFromSlug, labelForType } from "@/lib/db/advancing";
import { timeAgo } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import type { Deliverable } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { t } = await getRequestT();
  const { slug } = await params;
  const project = await projectIdFromSlug(slug);
  const rows = project ? await listDeliverables(project.id) : [];
  return (
    <PortalSubpage
      slug={slug}
      persona="client"
      title={t("p.client.deliverables.title", undefined, "Deliverables")}
      subtitle={t("p.client.deliverables.subtitle", undefined, "Documents and assets for this project")}
    >
      <DataView<Deliverable>
        rows={rows}
        emptyLabel={t("p.client.deliverables.empty", undefined, "No Deliverables Yet")}
        emptyDescription={t(
          "p.client.deliverables.emptyDescription",
          undefined,
          "Documents and assets your producer shares for this project will appear here as they are delivered.",
        )}
        columns={[
          {
            key: "title",
            header: t("p.client.deliverables.col.title", undefined, "Title"),
            render: (r) => r.title ?? labelForType(r.type),
            accessor: (r) => r.title ?? r.type ?? null,
          },
          {
            key: "type",
            header: t("p.client.deliverables.col.type", undefined, "Type"),
            render: (r) => labelForType(r.type),
            mono: true,
            filterable: true,
            groupable: true,
            accessor: (r) => r.type ?? null,
          },
          {
            key: "status",
            header: t("p.client.deliverables.col.status", undefined, "Status"),
            render: (r) => <StatusBadge status={r.fulfillment_state} />,
            accessor: (r) => r.fulfillment_state,
            filterable: true,
            groupable: true,
          },
          {
            key: "updated",
            header: t("p.client.deliverables.col.updated", undefined, "Updated"),
            render: (r) => timeAgo(r.updated_at),
            mono: true,
            accessor: (r) => r.updated_at,
          },
        ]}
      />
    </PortalSubpage>
  );
}
