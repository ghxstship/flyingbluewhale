"use client";
import { useState } from "react";
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
  const [poKind, setPoKind] = useState<"goods" | "labor" | "services">("goods");

  return (
    <FormShell
      action={createPoAction}
      cancelHref="/console/procurement/purchase-orders"
      submitLabel={t("console.procurement.purchaseOrders.new.submit", undefined, "Create PO")}
    >
      <Input label={t("console.procurement.purchaseOrders.new.titleLabel", undefined, "Title")} name="title" required />

      {/* PO kind — Rentman parity: classify goods vs labour vs services */}
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">
          {t("console.procurement.purchaseOrders.new.kindLabel", undefined, "PO Type")}
        </label>
        <select
          name="po_kind"
          value={poKind}
          onChange={(e) => setPoKind(e.target.value as "goods" | "labor" | "services")}
          className="input-base mt-1.5 w-full"
        >
          <option value="goods">{t("console.procurement.purchaseOrders.new.kindGoods", undefined, "Goods / Equipment")}</option>
          <option value="labor">{t("console.procurement.purchaseOrders.new.kindLabor", undefined, "Labour / Staffing")}</option>
          <option value="services">{t("console.procurement.purchaseOrders.new.kindServices", undefined, "Professional Services")}</option>
        </select>
      </div>

      {/* Labour-specific fields shown only for labor POs */}
      {poKind === "labor" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t("console.procurement.purchaseOrders.new.contractorNameLabel", undefined, "Contractor / Agency")}
            name="contractor_name"
            maxLength={200}
            hint={t("console.procurement.purchaseOrders.new.contractorNameHint", undefined, "Freelancer name or staffing agency")}
          />
          <Input
            label={t("console.procurement.purchaseOrders.new.roleTitleLabel", undefined, "Role / Position")}
            name="role_title"
            maxLength={200}
            hint={t("console.procurement.purchaseOrders.new.roleTitleHint", undefined, 'e.g. "A1 Audio Tech"')}
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">
            {t("console.procurement.purchaseOrders.new.vendorLabel", undefined, "Vendor")}
          </label>
          <select name="vendor_id" className="input-base mt-1.5 w-full">
            <option value="">{t("console.procurement.purchaseOrders.new.noVendor", undefined, "— No vendor —")}</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">
            {t("console.procurement.purchaseOrders.new.projectLabel", undefined, "Project")}
          </label>
          <select name="project_id" className="input-base mt-1.5 w-full">
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
        label={t("console.procurement.purchaseOrders.new.amountLabel", undefined, "Amount (USD)")}
        name="amount"
        type="number"
        step="0.01"
        required
      />
      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">
          {t("console.procurement.purchaseOrders.new.notesLabel", undefined, "Notes")}
        </label>
        <textarea name="notes" rows={2} maxLength={2000} className="input-base mt-1.5 w-full" />
      </div>
    </FormShell>
  );
}
