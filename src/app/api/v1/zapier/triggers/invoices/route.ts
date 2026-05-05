import { apiError, apiOk } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { toZapierInvoice } from "@/lib/integrations/zapier/payloads";
import { createClient } from "@/lib/supabase/server";

/**
 * Polling trigger — fires on the `invoice.paid` lifecycle. Filtered to
 * paid invoices and ordered by `paid_at` desc so Zaps wired to "new paid
 * invoice" see exactly that. Unpaid invoices are not Zapier's signal —
 * the `invoice.sent` webhook covers that lane.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("invoices")
      .select(
        "id, number, title, status, amount_cents, currency, client_id, project_id, issued_at, due_at, paid_at, created_at, updated_at",
      )
      .eq("org_id", session.orgId)
      .eq("status", "paid")
      .not("paid_at", "is", null)
      .order("paid_at", { ascending: false })
      .limit(50);
    if (error) return apiError("internal", error.message);
    return apiOk((data ?? []).map(toZapierInvoice));
  });
}
