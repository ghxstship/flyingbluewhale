import { PortalSubpage } from "@/components/PortalSubpage";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { listDeliverables, projectIdFromSlug, labelForType } from "@/lib/db/advancing";
import { timeAgo } from "@/lib/format";
import type { Deliverable } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await projectIdFromSlug(slug);
  const rows = project ? await listDeliverables(project.id) : [];
  return (
    <PortalSubpage slug={slug} persona="client" title="Deliverables" subtitle="Documents and assets for this project">
      <DataTable<Deliverable>
        rows={rows}
        emptyLabel="No deliverables yet"
        columns={[
          {
            key: "title",
            header: "Title",
            render: (r) => r.title ?? labelForType(r.type),
            accessor: (r) => r.title ?? r.type ?? null,
          },
          {
            key: "type",
            header: "Type",
            render: (r) => <span className="font-mono text-xs">{labelForType(r.type)}</span>,
            filterable: true,
            groupable: true,
            accessor: (r) => r.type ?? null,
          },
          {
            key: "status",
            header: "Status",
            render: (r) => <StatusBadge status={r.deliverable_state} />,
            accessor: (r) => r.deliverable_state,
            filterable: true,
            groupable: true,
          },
          {
            key: "updated",
            header: "Updated",
            render: (r) => timeAgo(r.updated_at),
            className: "font-mono text-xs",
            accessor: (r) => r.updated_at,
          },
        ]}
      />
    </PortalSubpage>
  );
}
