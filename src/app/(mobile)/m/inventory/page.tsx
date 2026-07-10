import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestT } from "@/lib/i18n/request";
import { CATALOG_KIND_LABEL_SINGULAR, type CatalogKind } from "@/lib/db/assignments";
import { RefreshShell } from "@/components/mobile/RefreshShell";
import { InventoryView, type AssetUnit, type InventoryItem } from "./InventoryView";

export const dynamic = "force-dynamic";

// `assets.state` (ual_state) → display label + ItemUnits tone.
const ASSET_STATE_LABEL: Record<string, string> = {
  acquired: "Acquired",
  available: "Available",
  reserved: "Reserved",
  in_transit: "In Transit",
  in_use: "In Use",
  returned: "Returned",
  in_maintenance: "Maintenance",
  retired: "Retired",
  lost: "Lost",
};
const ASSET_STATE_TONE: Record<string, AssetUnit["tone"]> = {
  available: "ok",
  acquired: "ok",
  returned: "ok",
  reserved: "info",
  in_transit: "info",
  in_use: "accent",
  in_maintenance: "warn",
  retired: "neutral",
  lost: "danger",
};

/**
 * /m/inventory — the COMPVSS "Assets" tab. On-hand SKU catalog backed by
 * `master_catalog_items` (org-scoped), named `Category · Type`. Per-instance
 * chain-of-custody comes from the real `assets` table — matched to each catalog
 * row by `asset_kind` (= catalog kind) or `display_name` — and passed to
 * `ItemUnits`. Catalog rows with no asset instances fall back to the
 * inventory_qty available count. The `InventoryView` client island owns the
 * ActionBar / view / filter state.
 */
export default async function InventoryPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const [{ data }, { data: assetRows }] = await Promise.all([
    supabase
      .from("master_catalog_items")
      .select("id, kind, code, name, unit_cost_cents, inventory_qty")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("kind", { ascending: true })
      .order("name", { ascending: true })
      .limit(500),
    supabase
      .from("assets")
      .select("id, asset_kind, display_name, state, serial, asset_tag")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .is("retired_at", null)
      .order("display_name", { ascending: true })
      .limit(2000),
  ]);

  // Index real per-instance assets by kind and by lowercased display_name so
  // each catalog row can claim its matching units.
  const assets = assetRows ?? [];
  const byKind = new Map<string, typeof assets>();
  const byName = new Map<string, typeof assets>();
  for (const a of assets) {
    const k = (a.asset_kind ?? "").toLowerCase();
    const n = (a.display_name ?? "").toLowerCase();
    if (k) (byKind.get(k) ?? byKind.set(k, []).get(k)!).push(a);
    if (n) (byName.get(n) ?? byName.set(n, []).get(n)!).push(a);
  }

  const items: InventoryItem[] = (data ?? []).map((r) => {
    const kind = r.kind as CatalogKind;
    const cat = CATALOG_KIND_LABEL_SINGULAR[kind] ?? kind;
    const rawName = (r.name as string) ?? "";

    // Prefer a name match (more specific); fall back to kind match.
    const matched = byName.get(rawName.toLowerCase()) ?? byKind.get(String(kind).toLowerCase()) ?? [];
    const units: AssetUnit[] = matched.map((a) => ({
      tag: a.asset_tag || a.serial || a.display_name || a.id.slice(0, 8),
      status: ASSET_STATE_LABEL[a.state] ?? a.state,
      holder: a.serial ? `S/N ${a.serial}` : cat,
      tone: ASSET_STATE_TONE[a.state] ?? "neutral",
    }));

    return {
      id: r.id as string,
      kind,
      cat,
      // "Category · Type" naming (XPMS convention).
      name: `${cat} · ${rawName}`.trim(),
      code: (r.code as string | null) ?? null,
      unitCostCents: (r.unit_cost_cents as number | null) ?? null,
      qty: (r.inventory_qty as number | null) ?? null,
      units,
    };
  });

  return (
    <RefreshShell>
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
          tracked: t("m.inventory.tracked", undefined, "Available"),
          untracked: t("m.inventory.untracked", undefined, "Untracked"),
          serialized: t("m.inventory.serialized", undefined, "Serialized Units"),
          available: t("m.inventory.available", undefined, "Available"),
        }}
      />
    </div>
    </RefreshShell>
  );
}
