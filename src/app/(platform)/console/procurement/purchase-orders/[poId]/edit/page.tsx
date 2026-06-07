import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updatePurchaseOrder, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ poId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("purchase_orders", session.orgId, p.poId);
  if (!row) notFound();
  const { t } = await getRequestT();
  const action = updatePurchaseOrder.bind(null, p.poId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.purchaseOrders.edit.eyebrow", undefined, "Purchase Order")}
        title={t("console.procurement.purchaseOrders.edit.title", { title: row.title }, `Edit ${row.title}`)}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/procurement/purchase-orders/${p.poId}`}
          submitLabel={t("console.procurement.purchaseOrders.edit.submit", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.procurement.purchaseOrders.edit.titleLabel", undefined, "Title")}
            name="title"
            defaultValue={row.title}
            required
            maxLength={200}
          />
          <Input
            label={t("console.procurement.purchaseOrders.edit.numberLabel", undefined, "Number")}
            name="number"
            defaultValue={row.number}
            required
            maxLength={80}
          />
          <Input
            label={t("console.procurement.purchaseOrders.edit.amountLabel", undefined, "Amount — Cents")}
            name="amount_cents"
            type="number"
            defaultValue={String(row.amount_cents ?? 0)}
          />
          <Input
            label={t("console.procurement.purchaseOrders.edit.currencyLabel", undefined, "Currency")}
            name="currency"
            defaultValue={row.currency ?? "USD"}
            required
            maxLength={3}
          />
          <p className="text-xs text-[var(--p-text-2)]">
            {t(
              "console.procurement.purchaseOrders.edit.statusHint",
              undefined,
              "Status transitions are managed from the detail page.",
            )}
          </p>
        </FormShell>
      </div>
    </>
  );
}
