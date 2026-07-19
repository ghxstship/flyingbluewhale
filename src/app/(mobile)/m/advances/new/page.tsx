import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { CATALOG_KIND_LABEL, type CatalogKind } from "@/lib/db/assignments";
import { AdvanceForm, type CatalogPick } from "./AdvanceForm";

export const dynamic = "force-dynamic";

/**
 * Request an advance — the kit `advance` FormScreen wired to the
 * `requestAdvance` server action. The item is a catalog lookup filtered by
 * the selected Category (real `catalog_kind` families); the action binds the
 * assignment to the chosen `master_catalog_items` SKU, or mints an inactive
 * SKU for a flagged special order.
 *
 * Kit 31 (live-test resolution #3): the catalog's "Add To Request" CTA
 * arrives here as `?catalogItemId=` + `&kind=` — the form opens with the
 * concrete SKU preselected (category + item) and binds to it directly.
 *
 * Otherwise, prefills the recurring fields from the requester's most recent
 * advance (WCAG 2.2 SC 3.3.7 Redundant Entry) so they aren't re-typed.
 */
export default async function NewAdvancePage({
  searchParams,
}: {
  searchParams: Promise<{ catalogItemId?: string; kind?: string }>;
}) {
  const session = await requireSession();
  const { catalogItemId } = await searchParams;

  let catalog: CatalogPick[] = [];
  let initial: Record<string, unknown> | undefined;
  let boundCatalogItemId: string | undefined;
  let fromCatalog = false;
  let catalogItemName: string | undefined;

  if (hasSupabase) {
    const supabase = await createClient();

    const { data: items } = await supabase
      .from("master_catalog_items")
      .select("id, kind, code, name")
      .eq("org_id", session.orgId)
      .eq("active", true)
      .is("deleted_at", null)
      .order("kind", { ascending: true })
      .order("name", { ascending: true })
      .limit(1000);
    catalog = (items ?? []) as CatalogPick[];

    if (catalogItemId && /^[0-9a-f-]{36}$/i.test(catalogItemId)) {
      const bound = catalog.find((c) => c.id === catalogItemId);
      if (bound) {
        boundCatalogItemId = bound.id;
        fromCatalog = true;
        catalogItemName = bound.name || undefined;
      }
    }

    if (!fromCatalog) {
      const { data: prior } = await supabase
        .from("assignments")
        .select("catalog_kind, data")
        .eq("org_id", session.orgId)
        .eq("party_user_id", session.userId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (prior) {
        const data = (prior.data ?? {}) as Record<string, unknown>;
        const seed: Record<string, unknown> = {};
        const label = CATALOG_KIND_LABEL[prior.catalog_kind as CatalogKind];
        if (label) seed.cat = label;
        // Recurring contextual fields — NOT item-specific (`item`/`type`) or
        // window-specific (`start`/`end`), which are entered fresh each time.
        if (data.qty != null) seed.qty = String(data.qty);
        if (typeof data.special === "string" && data.special) seed.special = data.special;
        if (typeof data.purpose === "string" && data.purpose) seed.purpose = data.purpose;
        if (typeof data.notes === "string" && data.notes) seed.notes = data.notes;
        if (Object.keys(seed).length > 0) initial = seed;
      }
    }
  }

  return (
    <AdvanceForm
      catalog={catalog}
      initial={initial}
      catalogItemId={boundCatalogItemId}
      fromCatalog={fromCatalog}
      catalogItemName={catalogItemName}
    />
  );
}
