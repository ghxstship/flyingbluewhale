import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney, timeAgo } from "@/lib/format";
import type { Requisition } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function RequisitionsPage() {
  if (!hasSupabase) return <><ModuleHeader title="Requisitions" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>;
  const session = await requireSession();
  const rows = await listOrgScoped("requisitions", session.orgId, { orderBy: "created_at" });
  return (
    <>
      <ModuleHeader eyebrow="Procurement" title="Requisitions" subtitle={`${rows.length} requests`}
        action={<Button href="/console/procurement/requisitions/new">+ New request</Button>} />
      <div className="page-content">
        <DataTable<Requisition>
          rows={rows}
          columns={[
            { key: "title", header: "Title", render: (r) => r.title },
            { key: "estimated", header: "Estimated", render: (r) => formatMoney(r.estimated_cents), className: "font-mono text-xs" },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "created", header: "Created", render: (r) => timeAgo(r.created_at), className: "font-mono text-xs" },
          ]}
        />
      </div>
    </>
  );
}
