import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataView } from "@/components/views/DataViewServer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/i18n/format";
import { timeAgo } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import type { PurchaseOrder, POStatus } from "@/lib/supabase/types";
import { bulkCancelPos, bulkSendPos } from "./actions";

export const dynamic = "force-dynamic";

/** Narrow, uncapped aggregate source for the header count + committed sum
 *  (audit A-05) — `listOrgScoped` caps at 100 rows, so reducing over it
 *  truncated the committed total once an org passed the cap. */
async function poAmounts(orgId: string): Promise<Array<{ amount_cents: number; po_state: POStatus }>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchase_orders")
    .select("amount_cents, po_state")
    .eq("org_id", orgId)
    .is("deleted_at", null);
  if (error) throw error;
  return (data ?? []) as Array<{ amount_cents: number; po_state: POStatus }>;
}

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
  const [rows, amounts] = await Promise.all([
    listOrgScoped("purchase_orders", session.orgId, { orderBy: "created_at" }),
    poAmounts(session.orgId),
  ]);
  const totalCount = amounts.length;
  const committed = amounts
    .filter((r) => ["sent", "acknowledged", "fulfilled"].includes(r.po_state))
    .reduce((s, r) => s + r.amount_cents, 0);
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.eyebrow", undefined, "Procurement")}
        title={t("console.procurement.purchaseOrders.title", undefined, "Purchase Orders")}
        subtitle={t(
          "console.procurement.purchaseOrders.subtitle",
          { count: totalCount, amount: formatMoney(committed) },
          `${totalCount} POs · ${formatMoney(committed)} committed`,
        )}
        action={
          <Button href="/studio/procurement/purchase-orders/new">
            {t("console.procurement.purchaseOrders.newPo", undefined, "+ New PO")}
          </Button>
        }
      />
      <div className="page-content">
        <DataView<PurchaseOrder>
          rows={rows}
          totalCount={totalCount}
          rowHref={(r) => `/studio/procurement/purchase-orders/${r.id}`}
          emptyLabel={t("console.procurement.purchaseOrders.emptyLabel", undefined, "No purchase orders yet")}
          emptyDescription={t(
            "console.procurement.purchaseOrders.emptyDescription",
            undefined,
            "Raise a PO to commit spend with a vendor; approved requisitions convert here too.",
          )}
          emptyAction={
            <Button href="/studio/procurement/purchase-orders/new" size="sm">
              {t("console.procurement.purchaseOrders.newPo", undefined, "+ New PO")}
            </Button>
          }
          bulkActions={[
            {
              id: "send",
              label: t("console.procurement.purchaseOrders.bulk.send", undefined, "Mark Sent"),
              perform: bulkSendPos,
            },
            {
              id: "cancel",
              label: t("console.procurement.purchaseOrders.bulk.cancel", undefined, "Cancel"),
              variant: "danger",
              perform: bulkCancelPos,
            },
          ]}
          columns={[
            {
              key: "number",
              header: t("console.procurement.purchaseOrders.col.number", undefined, "Number"),
              render: (r) => r.number,
              mono: true,
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
              mono: true,
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
              mono: true,
              accessor: (r) => r.created_at,
            },
          ]}
        />
      </div>
    </>
  );
}
