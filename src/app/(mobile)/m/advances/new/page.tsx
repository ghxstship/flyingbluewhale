import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { AdvanceForm } from "./AdvanceForm";

export const dynamic = "force-dynamic";

// Reverse of the action's CATEGORY_TO_KIND — pick a representative category
// label per catalog kind so the prior request's kind prefills the select.
const KIND_TO_CATEGORY: Record<string, string> = {
  credential: "Credential",
  radio: "Radio",
  catering: "Meal Voucher",
  vehicle: "Parking",
  equipment: "Other",
};

/**
 * Request an advance — the kit `advance` FormScreen wired to the
 * `requestAdvance` server action, which authors a `master_catalog_items`
 * SKU (find-or-create) + an `assignments` row in `fulfillment_state`
 * "briefed" and push-notifies managers.
 *
 * Kit 31 (live-test resolution #3): the catalog's "Add To Request" CTA
 * arrives here as `?catalogItemId=` + `&kind=` — the Add Item editor opens
 * prefilled with the concrete SKU (category + item), and the action binds
 * the assignment to that catalog row directly.
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

  let initial: Record<string, unknown> | undefined;
  let boundCatalogItemId: string | undefined;
  let fromCatalog = false;
  let catalogItemName: string | undefined;

  if (hasSupabase) {
    const supabase = await createClient();

    if (catalogItemId && /^[0-9a-f-]{36}$/i.test(catalogItemId)) {
      const { data: item } = await supabase
        .from("master_catalog_items")
        .select("id, kind, name")
        .eq("id", catalogItemId)
        .eq("org_id", session.orgId)
        .is("deleted_at", null)
        .maybeSingle();
      if (item) {
        boundCatalogItemId = item.id as string;
        fromCatalog = true;
        catalogItemName = (item.name as string) || undefined;
        initial = {
          cat: KIND_TO_CATEGORY[(item.kind as string) ?? ""] ?? "Other",
          type: (item.name as string) ?? "",
        };
      }
    }

    if (!initial) {
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
        const cat = KIND_TO_CATEGORY[(prior.catalog_kind as string) ?? ""];
        if (cat) seed.cat = cat;
        // Recurring contextual fields — NOT item-specific (`type`) or
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
      initial={initial}
      catalogItemId={boundCatalogItemId}
      fromCatalog={fromCatalog}
      catalogItemName={catalogItemName}
    />
  );
}
