import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createCatalogItem } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.settings.catalog.new.eyebrow", undefined, "Catalog")}
        title={t("console.settings.catalog.new.title", undefined, "New Item")}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createCatalogItem}
          cancelHref="/console/settings/catalog"
          submitLabel={t("common.create", undefined, "Create")}
        >
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.settings.catalog.new.kindLabel", undefined, "Kind")}
            </label>
            <select name="kind" required className="ps-input mt-1.5 w-full" defaultValue="credential">
              <option value="credential">
                {t("console.settings.catalog.kind.credential", undefined, "Credential")}
              </option>
              <option value="catering">{t("console.settings.catalog.kind.catering", undefined, "Catering")}</option>
              <option value="radio">{t("console.settings.catalog.kind.radio", undefined, "Radio")}</option>
              <option value="tool">{t("console.settings.catalog.kind.tool", undefined, "Tool")}</option>
              <option value="equipment">{t("console.settings.catalog.kind.equipment", undefined, "Equipment")}</option>
              <option value="uniform">{t("console.settings.catalog.kind.uniform", undefined, "Uniform")}</option>
              <option value="travel">{t("console.settings.catalog.kind.travel", undefined, "Travel")}</option>
              <option value="lodging">{t("console.settings.catalog.kind.lodging", undefined, "Lodging")}</option>
              <option value="vehicle">{t("console.settings.catalog.kind.vehicle", undefined, "Vehicle")}</option>
            </select>
          </div>
          <Input
            label={t("console.settings.catalog.new.codeLabel", undefined, "Code")}
            name="code"
            required
            maxLength={64}
            placeholder="crew-pass-tier1"
            hint={t("console.settings.catalog.new.codeHint", undefined, "Short identifier. Lowercase, dashes ok.")}
          />
          <Input
            label={t("console.settings.catalog.new.nameLabel", undefined, "Name")}
            name="name"
            required
            maxLength={200}
            placeholder="Crew Pass (Tier 1)"
          />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.settings.catalog.new.descriptionLabel", undefined, "Description")}
            </label>
            <textarea name="description" rows={3} maxLength={1000} className="ps-input mt-1.5 w-full" />
          </div>
          <Input
            label={t("console.settings.catalog.new.unitCostLabel", undefined, "Unit Cost — USD")}
            name="unit_cost_usd"
            type="number"
            step="0.01"
            min="0"
            hint={t(
              "console.settings.catalog.new.unitCostHint",
              undefined,
              "Optional. Used for inventory roll-ups + cost-allocation reports.",
            )}
          />
          <Input
            label={t("console.settings.catalog.new.inventoryQtyLabel", undefined, "Inventory quantity")}
            name="inventory_qty"
            type="number"
            step="1"
            min="0"
            hint={t(
              "console.settings.catalog.new.inventoryQtyHint",
              undefined,
              "Optional. Total stock available across the org.",
            )}
          />
        </FormShell>
      </div>
    </>
  );
}
