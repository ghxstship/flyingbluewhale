import { requireSession } from "@/lib/auth";
import { AdvanceForm } from "./AdvanceForm";

export const dynamic = "force-dynamic";

/**
 * Request an advance — the kit `advance` FormScreen wired to the
 * `requestAdvance` server action, which authors a `master_catalog_items`
 * SKU (find-or-create) + an `assignments` row in `fulfillment_state`
 * "briefed" and push-notifies managers.
 */
export default async function NewAdvancePage() {
  await requireSession();
  return <AdvanceForm />;
}
