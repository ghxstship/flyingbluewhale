import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateRateCardItem, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ itemId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("rate_card_items", session.orgId, p.itemId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  void r;
  const { t } = await getRequestT();
  const action = updateRateCardItem.bind(null, p.itemId) as unknown as (state: State, fd: FormData) => Promise<State>;
  const itemName =
    ((row as Record<string, unknown>)["name"] as string | undefined) ??
    t("console.logistics.ratecard.edit.fallbackName", undefined, "Rate card item");
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.logistics.ratecard.edit.eyebrow", undefined, "Rate Card Item")}
        title={t("console.logistics.ratecard.edit.title", { name: itemName }, `Edit ${itemName}`)}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/logistics/ratecard/${p.itemId}`}
          submitLabel={t("common.saveChanges", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.logistics.ratecard.edit.name", undefined, "Name")}
            name="name"
            defaultValue={row.name ?? ""}
            required
            maxLength={200}
          />
          <Input
            label={t("console.logistics.ratecard.edit.sku", undefined, "SKU")}
            name="sku"
            defaultValue={row.sku ?? ""}
            required
            maxLength={80}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.logistics.ratecard.edit.description", undefined, "Description")}
            </span>
            <textarea
              name="description"
              defaultValue={row.description ?? ""}
              rows={5}
              className="ps-input focus-ring w-full"
            />
          </label>
          <Input
            label={t("console.logistics.ratecard.edit.unitPriceCents", undefined, "Unit Price — Cents")}
            name="unit_price_cents"
            type="number"
            defaultValue={row.unit_price_cents != null ? String(row.unit_price_cents) : ""}
          />
          <Input
            label={t("console.logistics.ratecard.edit.currency", undefined, "Currency")}
            name="currency"
            defaultValue={row.currency ?? ""}
            required
            maxLength={3}
          />
          <Input
            label={t("console.logistics.ratecard.edit.catalog", undefined, "Catalog")}
            name="catalog"
            defaultValue={row.catalog ?? ""}
            required
            maxLength={80}
          />
        </FormShell>
      </div>
    </>
  );
}
