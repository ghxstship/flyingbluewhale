import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { RecordActionButton } from "@/components/RecordActionButton";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";
import { timeAgo } from "@/lib/format";
import { PoStatusControls } from "./PoStatusControls";
import { routePoToApprovalsAction } from "../actions";
import { deletePurchaseOrder } from "./edit/actions";

export const dynamic = "force-dynamic";

export default async function POPage({ params }: { params: Promise<{ poId: string }> }) {
  const { poId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const { t } = await getRequestT();
  const po = await getOrgScoped("purchase_orders", session.orgId, poId);
  if (!po) notFound();
  return (
    <>
      <ModuleHeader
        eyebrow={po.number}
        title={po.title}
        subtitle={`${formatMoney(po.amount_cents, po.currency)} · ${po.po_state}`}
        action={
          <div className="flex items-center gap-2">
            {isManagerPlus(session) && (po.po_state === "draft" || po.po_state === "sent") && (
              <RecordActionButton
                action={routePoToApprovalsAction.bind(null, poId)}
                label={t(
                  "console.procurement.purchaseOrders.detail.routeToApprovals",
                  undefined,
                  "Route To Approvals",
                )}
                pendingLabel={t("console.procurement.purchaseOrders.detail.routing", undefined, "Routing…")}
              />
            )}
            <PoStatusControls id={po.id} status={po.po_state} />
            <Button href={`/studio/procurement/purchase-orders/${poId}/edit`} size="sm" variant="secondary">
              {t("common.edit", undefined, "Edit")}
            </Button>
            <DeleteForm
              action={deletePurchaseOrder.bind(null, poId)}
              confirm={t(
                "console.procurement.purchaseOrders.detail.deleteConfirm",
                { number: po.number },
                `Delete PO "${po.number}"? This cannot be undone.`,
              )}
            />
          </div>
        }
      />
      <div className="page-content space-y-6">
        <div className="metric-grid">
          <Field label={t("console.procurement.purchaseOrders.detail.po_state", undefined, "Status")}>
            <StatusBadge status={po.po_state} />
          </Field>
          <Field label={t("console.procurement.purchaseOrders.detail.amount", undefined, "Amount")}>
            {formatMoney(po.amount_cents, po.currency)}
          </Field>
          <Field label={t("console.procurement.purchaseOrders.detail.created", undefined, "Created")}>
            {timeAgo(po.created_at)}
          </Field>
          <Field label={t("console.procurement.purchaseOrders.detail.updated", undefined, "Updated")}>
            {timeAgo(po.updated_at)}
          </Field>
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="surface p-3">
      <div className="text-[11px] font-semibold tracking-wider text-[var(--p-text-2)] uppercase">{label}</div>
      <div className="mt-1 font-mono text-sm">{children}</div>
    </div>
  );
}
