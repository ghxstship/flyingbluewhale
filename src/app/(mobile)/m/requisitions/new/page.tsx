import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { POForm } from "./POForm";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Purchase Order Request.
 *
 * Kit 31 (live-test resolution #20): the four-field quick requisition grew
 * into the kit `po` form spec — product-link auto-import, qty/total, needed-by,
 * Auto-Code vs Manual budget coding, purpose, quote attach. Same store
 * (`requisitions`); the server half injects the org's real cost codes so
 * Manual coding offers live records, never seed strings. PO records surface
 * in /m/finance via `listFieldPurchaseRequests`.
 */
export default async function NewRequisitionPage() {
  let costCodeOptions: string[] = [];

  if (hasSupabase) {
    const session = await requireSession();
    const supabase = await createClient();
    const { data: codes } = await supabase
      .from("cost_centers")
      .select("code, name")
      .eq("org_id", session.orgId)
      .eq("active", true)
      .order("code", { ascending: true })
      .limit(100);
    costCodeOptions = ((codes ?? []) as { code: string; name: string }[]).map(
      (c) => `${c.code} · ${c.name}`,
    );
  }

  return <POForm costCodeOptions={costCodeOptions} />;
}
