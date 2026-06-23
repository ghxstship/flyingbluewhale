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
 * Prefills the recurring fields from the requester's most recent advance
 * (WCAG 2.2 SC 3.3.7 Redundant Entry) so they aren't re-typed.
 */
export default async function NewAdvancePage() {
  const session = await requireSession();

  let initial: Record<string, unknown> | undefined;
  if (hasSupabase) {
    const supabase = await createClient();
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
      // date-specific (`needed`), which should be entered fresh each time.
      if (data.qty != null) seed.qty = String(data.qty);
      if (typeof data.special === "string" && data.special) seed.special = data.special;
      if (typeof data.purpose === "string" && data.purpose) seed.purpose = data.purpose;
      if (typeof data.notes === "string" && data.notes) seed.notes = data.notes;
      if (Object.keys(seed).length > 0) initial = seed;
    }
  }

  return <AdvanceForm initial={initial} />;
}
