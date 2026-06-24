import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { CATALOG_KINDS, CATALOG_KIND_LABEL } from "@/lib/db/assignments";
import { updateCatalogItem } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="page-content">
        {t("console.settings.catalog.edit.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  const { id } = await params;
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("master_catalog_items")
    .select("id, kind, code, name, description, unit_cost_cents, inventory_qty")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) notFound();
  const item = data as {
    id: string;
    kind: string;
    code: string;
    name: string;
    description: string | null;
    unit_cost_cents: number | null;
    inventory_qty: number | null;
  };

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.settings.catalog.edit.eyebrow", undefined, "Catalog")}
        title={t("console.settings.catalog.edit.title", { name: item.name }, `Edit ${item.name}`)}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={updateCatalogItem}
          cancelHref={`/studio/settings/catalog/${item.id}`}
          submitLabel={t("common.save", undefined, "Save")}
        >
          <input type="hidden" name="id" value={item.id} />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.settings.catalog.edit.kindLabel", undefined, "Kind")}
            </label>
            <select name="kind" required className="ps-input mt-1.5 w-full" defaultValue={item.kind}>
              {CATALOG_KINDS.map((k) => (
                <option key={k} value={k}>
                  {t(`console.settings.catalog.edit.kind.${k}`, undefined, CATALOG_KIND_LABEL[k])}
                </option>
              ))}
            </select>
          </div>
          <Input
            label={t("console.settings.catalog.edit.codeLabel", undefined, "Code")}
            name="code"
            required
            maxLength={64}
            defaultValue={item.code}
          />
          <Input
            label={t("console.settings.catalog.edit.nameLabel", undefined, "Name")}
            name="name"
            required
            maxLength={200}
            defaultValue={item.name}
          />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.settings.catalog.edit.descriptionLabel", undefined, "Description")}
            </label>
            <textarea
              name="description"
              rows={3}
              maxLength={1000}
              defaultValue={item.description ?? ""}
              className="ps-input mt-1.5 w-full"
            />
          </div>
          <Input
            label={t("console.settings.catalog.edit.unitCostLabel", undefined, "Unit Cost — USD")}
            name="unit_cost_usd"
            type="number"
            step="0.01"
            min="0"
            defaultValue={item.unit_cost_cents != null ? String(item.unit_cost_cents / 100) : ""}
          />
          <Input
            label={t("console.settings.catalog.edit.inventoryQtyLabel", undefined, "Inventory quantity")}
            name="inventory_qty"
            type="number"
            step="1"
            min="0"
            defaultValue={item.inventory_qty != null ? String(item.inventory_qty) : ""}
          />
        </FormShell>
      </div>
    </>
  );
}
