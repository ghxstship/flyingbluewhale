import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";
import type { FabricationOrder } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function FabricationPage() {
  if (!hasSupabase) return <><ModuleHeader title="Fabrication" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>;
  const session = await requireSession();
  const rows = await listOrgScoped("fabrication_orders", session.orgId, { orderBy: "created_at" });
  return (
    <>
      <ModuleHeader eyebrow="Production" title="Fabrication orders" subtitle={`${rows.length} orders`}
        action={<Button href="/console/production/fabrication/new">+ New order</Button>} />
      <div className="page-content">
        <DataTable<FabricationOrder>
          rows={rows}
          columns={[
            { key: "title", header: "Title", render: (r) => r.title },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "due", header: "Due", render: (r) => formatDate(r.due_at, "medium"), className: "font-mono text-xs" },
          ]}
        />
      </div>
    </>
  );
}
