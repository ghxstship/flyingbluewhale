import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestT } from "@/lib/i18n/request";
import { CATALOG_KIND_LABEL_SINGULAR, type CatalogKind } from "@/lib/db/assignments";
import { InventoryView, type InventoryItem } from "./InventoryView";

export const dynamic = "force-dynamic";

/**
 * /m/inventory — the COMPVSS "Assets" tab. On-hand SKU catalog backed by
 * `master_catalog_items` (org-scoped), named `Category · Type`. Server fetches;
 * the `InventoryView` client island owns the ActionBar / view / filter state.
 */
export default async function InventoryPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const { data } = await supabase
    .from("master_catalog_items")
    .select("id, kind, code, name, unit_cost_cents, inventory_qty")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("kind", { ascending: true })
    .order("name", { ascending: true })
    .limit(500);

  const items: InventoryItem[] = (data ?? []).map((r) => {
    const kind = r.kind as CatalogKind;
    const cat = CATALOG_KIND_LABEL_SINGULAR[kind] ?? kind;
    return {
      id: r.id as string,
      kind,
      cat,
      // "Category · Type" naming (XPMS convention).
      name: `${cat} · ${(r.name as string) ?? ""}`.trim(),
      code: (r.code as string | null) ?? null,
      unitCostCents: (r.unit_cost_cents as number | null) ?? null,
      qty: (r.inventory_qty as number | null) ?? null,
    };
  });

  return (
    <div className="screen screen-anim">
      <InventoryView
        items={items}
        labels={{
          eyebrow: t("m.inventory.eyebrow", undefined, "On-Hand Catalog"),
          title: t("m.inventory.title", undefined, "Assets"),
          search: t("m.inventory.search", undefined, "Search assets…"),
          scan: t("m.inventory.scanCta", undefined, "Scan To Check Out / In"),
          empty: t("m.inventory.empty", undefined, "No assets"),
          emptyHint: t("m.inventory.emptyHint", undefined, "Nothing matches these filters."),
          units: t("m.inventory.units", undefined, "Units"),
          colItem: t("m.inventory.colItem", undefined, "Item"),
          colCategory: t("m.inventory.colCategory", undefined, "Category"),
          colCode: t("m.inventory.colCode", undefined, "Code"),
          colQty: t("m.inventory.colQty", undefined, "On Hand"),
          colCost: t("m.inventory.colCost", undefined, "Unit Cost"),
          onHand: t("m.inventory.onHand", undefined, "on hand"),
          tracked: t("m.inventory.tracked", undefined, "Tracked"),
          untracked: t("m.inventory.untracked", undefined, "Untracked"),
        }}
      />
    </div>
  );
}
