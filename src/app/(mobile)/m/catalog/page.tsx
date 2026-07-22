import { isManagerPlus, requireSession } from "@/lib/auth";
import { Fab } from "@/components/mobile/kit";
import { createClient } from "@/lib/supabase/server";
import { getRequestT } from "@/lib/i18n/request";
import { CATALOG_KIND_LABEL, CATALOG_KIND_LABEL_SINGULAR, type CatalogKind } from "@/lib/db/assignments";
import { CatalogView, type CatalogEntry } from "./CatalogView";

export const dynamic = "force-dynamic";

/**
 * /m/catalog — browse the requestable SKU catalog (`master_catalog_items`)
 * grouped by kind. Each row "Request" links into the advance flow at
 * /m/advances/new (prefilled with the catalog item).
 */
export default async function CatalogPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const { data } = await supabase
    .from("master_catalog_items")
    .select("id, kind, code, name, unit_cost_cents")
    .eq("org_id", session.orgId)
    // Requestable = active: the advance intake binds only to active SKUs, so
    // an inactive (e.g. pending special-order) SKU here would be a dead CTA.
    .eq("active", true)
    .is("deleted_at", null)
    .order("kind", { ascending: true })
    .order("name", { ascending: true })
    .limit(500);

  const items: CatalogEntry[] = (data ?? []).map((r) => {
    const kind = r.kind as CatalogKind;
    const cat = CATALOG_KIND_LABEL_SINGULAR[kind] ?? kind;
    return {
      id: r.id as string,
      kind,
      kindLabel: CATALOG_KIND_LABEL[kind] ?? kind,
      name: `${cat} · ${(r.name as string) ?? ""}`.trim(),
      code: (r.code as string | null) ?? null,
      unitCostCents: (r.unit_cost_cents as number | null) ?? null,
    };
  });

  return (
    <div className="screen screen-anim">
      <CatalogView
        items={items}
        canManage={isManagerPlus(session)}
        labels={{
          back: t("m.catalog.back", undefined, "More"),
          title: t("m.catalog.title", undefined, "Catalog"),
          search: t("m.catalog.search", undefined, "Search the catalog…"),
          // Kit 31 (live-test resolution #3): the CTA is "Add To Request" and
          // opens the advance Add Item editor prefilled with this SKU.
          request: t("m.catalog.addToRequest", undefined, "Add To Request"),
          empty: t("m.catalog.empty", undefined, "No items"),
          emptyHint: t("m.catalog.emptyHint", undefined, "Nothing matches."),
          kind: t("m.catalog.col.kind", undefined, "Kind"),
          code: t("m.catalog.col.code", undefined, "Code"),
          unitCost: t("m.catalog.col.unitCost", undefined, "Unit Cost"),
        }}
      />
      {/* Kit FAB: Request Advance (CREATE map — catalog shares Assets' target). */}
      <Fab href="/m/advances/new" label={t("m.catalog.requestAdvance", undefined, "Request Advance")} />
    </div>
  );
}
