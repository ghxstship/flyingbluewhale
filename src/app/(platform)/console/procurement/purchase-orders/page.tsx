import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { timeAgo } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import type { PurchaseOrder } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function POsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={t("console.procurement.purchaseOrders.title", undefined, "Purchase Orders")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.procurement.purchaseOrders.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("purchase_orders", session.orgId, { orderBy: "created_at" });
  const committed = rows
    .filter((r) => ["sent", "acknowledged", "fulfilled"].includes(r.po_state))
    .reduce((s, r) => s + r.amount_cents, 0);
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.eyebrow", undefined, "Procurement")}
        title={t("console.procurement.purchaseOrders.title", undefined, "Purchase Orders")}
        subtitle={t(
          "console.procurement.purchaseOrders.subtitle",
          { count: rows.length, amount: formatMoney(committed) },
          `${rows.length} POs · ${formatMoney(committed)} committed`,
        )}
        action={
          <Button href="/console/procurement/purchase-orders/new">
            {t("console.procurement.purchaseOrders.newPo", undefined, "+ New PO")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<PurchaseOrder>
          rows={rows}
          rowHref={(r) => `/console/procurement/purchase-orders/${r.id}`}
          columns={[
            {
              key: "number",
              header: t("console.procurement.purchaseOrders.col.number", undefined, "Number"),
              render: (r) => <span className="font-mono text-xs">{r.number}</span>,
              accessor: (r) => r.number ?? null,
            },
            {
              key: "title",
              header: t("console.procurement.purchaseOrders.col.title", undefined, "Title"),
              render: (r) => r.title,
              accessor: (r) => r.title,
            },
            {
              key: "amount",
              header: t("console.procurement.purchaseOrders.col.amount", undefined, "Amount"),
              render: (r) => formatMoney(r.amount_cents, r.currency),
              className: "font-mono text-xs",
              accessor: (r) => r.amount_cents ?? null,
            },
            {
              key: "po_state",
              header: t("console.procurement.purchaseOrders.col.po_state", undefined, "Status"),
              render: (r) => <StatusBadge status={r.po_state} />,
              accessor: (r) => r.po_state,
              filterable: true,
              groupable: true,
            },
            {
              key: "created",
              header: t("console.procurement.purchaseOrders.col.created", undefined, "Created"),
              render: (r) => timeAgo(r.created_at),
              className: "font-mono text-xs",
              accessor: (r) => r.created_at,
            },
          ]}
        />
      </div>
    </>
  );
}
