import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { timeAgo } from "@/lib/format";
import type { PurchaseOrder } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function POsPage() {
  if (!hasSupabase) return <><ModuleHeader title="Purchase orders" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>;
  const session = await requireSession();
  const rows = await listOrgScoped("purchase_orders", session.orgId, { orderBy: "created_at" });
  const committed = rows.filter((r) => ["sent","acknowledged","fulfilled"].includes(r.status)).reduce((s, r) => s + r.amount_cents, 0);
  return (
    <>
      <ModuleHeader eyebrow="Procurement" title="Purchase orders" subtitle={`${rows.length} POs · ${formatMoney(committed)} committed`}
        action={<Button href="/console/procurement/purchase-orders/new">+ New PO</Button>} />
      <div className="page-content">
        <DataTable<PurchaseOrder>
          rows={rows}
          rowHref={(r) => `/console/procurement/purchase-orders/${r.id}`}
          columns={[
            { key: "number", header: "Number", render: (r) => <span className="font-mono text-xs">{r.number}</span> },
            { key: "title", header: "Title", render: (r) => r.title },
            { key: "amount", header: "Amount", render: (r) => formatMoney(r.amount_cents, r.currency), className: "font-mono text-xs" },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "created", header: "Created", render: (r) => timeAgo(r.created_at), className: "font-mono text-xs" },
          ]}
        />
      </div>
    </>
  );
}
