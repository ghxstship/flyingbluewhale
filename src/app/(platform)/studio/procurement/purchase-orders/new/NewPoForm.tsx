"use client";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { RecordCombobox } from "@/components/RecordCombobox";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createPoAction } from "../actions";

export function NewPoForm() {
  const t = useT();
  return (
    <FormShell
      action={createPoAction}
      cancelHref="/studio/procurement/purchase-orders"
      submitLabel={t("console.procurement.purchaseOrders.new.submit", undefined, "Create PO")}
    >
      <Input label={t("console.procurement.purchaseOrders.new.titleLabel", undefined, "Title")} name="title" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <RecordCombobox
          table="vendors"
          name="vendor_id"
          label={t("console.procurement.purchaseOrders.new.vendorLabel", undefined, "Vendor")}
          noneLabel={t("console.procurement.purchaseOrders.new.noVendorOption", undefined, "No vendor")}
          searchPlaceholder={t("console.procurement.purchaseOrders.new.searchVendors", undefined, "Search vendors…")}
          emptyLabel={t("console.procurement.purchaseOrders.new.noVendorMatches", undefined, "No matching vendors")}
        />
        <RecordCombobox
          table="projects"
          name="project_id"
          label={t("console.procurement.purchaseOrders.new.projectLabel", undefined, "Project")}
          noneLabel={t("console.procurement.purchaseOrders.new.noProjectOption", undefined, "No project")}
          searchPlaceholder={t("console.procurement.purchaseOrders.new.searchProjects", undefined, "Search projects…")}
          emptyLabel={t("console.procurement.purchaseOrders.new.noProjectMatches", undefined, "No matching projects")}
        />
      </div>
      <Input
        label={t("console.procurement.purchaseOrders.new.amountLabel", undefined, "Amount (USD)")}
        name="amount"
        type="number"
        step="0.01"
        required
      />
    </FormShell>
  );
}
