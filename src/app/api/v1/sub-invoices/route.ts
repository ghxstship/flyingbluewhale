import { type NextRequest } from "next/server";
import { apiOk, apiError } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** GET /api/v1/sub-invoices — inbound subcontractor invoices for the org. */
export async function GET(req: NextRequest) {
  const state = new URL(req.url).searchParams.get("state");
  return withAuth(async (session) => {
    const supabase = await createClient();
    let q = supabase
      .from("sub_invoices")
      .select("id, vendor_id, work_order_id, amount_cents, invoice_state, submitted_on")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("submitted_on", { ascending: false })
      .limit(200);
    if (state) q = q.eq("invoice_state", state);
    const { data, error } = await q;
    if (error) return apiError("internal", error.message);
    return apiOk({ subInvoices: data ?? [] });
  });
}
