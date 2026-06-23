"use client";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createPoAction } from "../actions";

export function NewPoForm({
  vendors,
  projects,
}: {
  vendors: { id: string; name: string }[];
  projects: { id: string; name: string }[];
}) {
  const t = useT();
  return (
    <FormShell
      action={createPoAction}
      cancelHref="/studio/procurement/purchase-orders"
      submitLabel={t("console.procurement.purchaseOrders.new.submit", undefined, "Create PO")}
    >
      <Input label={t("console.procurement.purchaseOrders.new.titleLabel", undefined, "Title")} name="title" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.procurement.purchaseOrders.new.vendorLabel", undefined, "Vendor")}
          </label>
          <select name="vendor_id" className="ps-input mt-1.5 w-full">
            <option value="">{t("console.procurement.purchaseOrders.new.noVendor", undefined, "— No vendor —")}</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.procurement.purchaseOrders.new.projectLabel", undefined, "Project")}
          </label>
          <select name="project_id" className="ps-input mt-1.5 w-full">
            <option value="">
              {t("console.procurement.purchaseOrders.new.noProject", undefined, "— No project —")}
            </option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Input
        label={t("console.procurement.purchaseOrders.new.amountLabel", undefined, "Amount — USD")}
        name="amount"
        type="number"
        step="0.01"
        required
      />
    </FormShell>
  );
}
