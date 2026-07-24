import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { CATALOG_KINDS, CATALOG_KIND_LABEL } from "@/lib/db/assignments";
import { createCatalogItem } from "./actions";

export const dynamic = "force-dynamic";

export default async function NewCatalogItemPage() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.hub.title", undefined, "Organization Hub")}
        title={t("console.settings.catalog.new.title", undefined, "New Item")}
        breadcrumbs={[
          { label: t("console.legend.hub.breadcrumb", undefined, "LEG3ND") },
          { label: t("console.legend.hub.title", undefined, "Organization Hub"), href: "/legend/hub" },
          { label: t("console.settings.catalog.hubTitle", undefined, "Catalogs"), href: "/legend/hub/catalogs" },
          { label: t("console.settings.catalog.new.breadcrumb", undefined, "New") },
        ]}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createCatalogItem}
          cancelHref="/legend/hub/catalogs"
          submitLabel={t("common.create", undefined, "Create")}
        >
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.settings.catalog.new.kindLabel", undefined, "Kind")}
            </label>
            <select name="kind" required className="ps-input mt-1.5 w-full" defaultValue="credential">
              {CATALOG_KINDS.map((k) => (
                <option key={k} value={k}>
                  {t(`console.settings.catalog.kind.${k}`, undefined, CATALOG_KIND_LABEL[k])}
                </option>
              ))}
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
            label={t("console.settings.catalog.new.unitCostLabel", undefined, "Unit Cost (USD)")}
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
