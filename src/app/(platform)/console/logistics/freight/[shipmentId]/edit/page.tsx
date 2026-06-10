import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateShipment, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ shipmentId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("purchase_orders", session.orgId, p.shipmentId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  void r;
  const { t } = await getRequestT();
  const action = updateShipment.bind(null, p.shipmentId) as unknown as (state: State, fd: FormData) => Promise<State>;
  const shipmentTitle =
    ((row as Record<string, unknown>)["title"] as string | undefined) ??
    t("console.logistics.freight.edit.fallbackTitle", undefined, "Shipment");
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.logistics.freight.edit.eyebrow", undefined, "Shipment")}
        title={t("console.logistics.freight.edit.title", { name: shipmentTitle }, `Edit ${shipmentTitle}`)}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/logistics/freight/${p.shipmentId}`}
          submitLabel={t("common.saveChanges", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.logistics.freight.edit.fields.title", undefined, "Title")}
            name="title"
            defaultValue={row.title ?? ""}
            required
            maxLength={200}
          />
          <Input
            label={t("console.logistics.freight.edit.fields.number", undefined, "Number")}
            name="number"
            defaultValue={row.number ?? ""}
            required
            maxLength={80}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.logistics.freight.edit.fields.po_state", undefined, "Status")}
            </span>
            <select name="po_state" defaultValue={row.po_state ?? ""} required className="ps-input focus-ring w-full">
              <option value="draft">draft</option>
              <option value="sent">sent</option>
              <option value="acknowledged">acknowledged</option>
              <option value="fulfilled">fulfilled</option>
              <option value="cancelled">cancelled</option>
            </select>
          </label>
          <Input
            label={t("console.logistics.freight.edit.fields.amountCents", undefined, "Amount — Cents")}
            name="amount_cents"
            type="number"
            defaultValue={row.amount_cents != null ? String(row.amount_cents) : ""}
          />
          <Input
            label={t("console.logistics.freight.edit.fields.currency", undefined, "Currency")}
            name="currency"
            defaultValue={row.currency ?? ""}
            required
            maxLength={3}
          />
        </FormShell>
      </div>
    </>
  );
}
