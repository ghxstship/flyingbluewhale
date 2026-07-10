import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createRateCardItem } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.logistics.ratecard.new.eyebrow", undefined, "Procurement · Source")}
        title={t("console.logistics.ratecard.new.title", undefined, "New Rate-Card Item")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createRateCardItem}
          cancelHref="/studio/logistics/ratecard"
          submitLabel={t("console.logistics.ratecard.new.submit", undefined, "Add Item")}
        >
          <Input
            label={t("console.logistics.ratecard.new.fields.catalog", undefined, "Catalog")}
            name="catalog"
            required
            maxLength={60}
            placeholder={t(
              "console.logistics.ratecard.new.fields.catalogPlaceholder",
              undefined,
              "e.g. crew, transport, av",
            )}
          />
          <Input
            label={t("console.logistics.ratecard.new.fields.sku", undefined, "SKU")}
            name="sku"
            required
            maxLength={80}
            placeholder={t("console.logistics.ratecard.new.fields.skuPlaceholder", undefined, "e.g. PA-MAIN-V2")}
          />
          <Input
            label={t("console.logistics.ratecard.new.fields.name", undefined, "Name")}
            name="name"
            required
            maxLength={200}
          />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.logistics.ratecard.new.fields.description", undefined, "Description")}
            </label>
            <textarea name="description" rows={3} maxLength={2000} className="ps-input mt-1.5 w-full" />
          </div>
          <Input
            label={t("console.logistics.ratecard.new.fields.unitPrice", undefined, "Unit Price (USD)")}
            name="unit_price"
            type="number"
            required
            step="0.01"
            min={0}
          />
          <Input
            label={t("console.logistics.ratecard.new.fields.currency", undefined, "Currency")}
            name="currency"
            maxLength={3}
            defaultValue="USD"
          />
        </FormShell>
      </div>
    </>
  );
}
