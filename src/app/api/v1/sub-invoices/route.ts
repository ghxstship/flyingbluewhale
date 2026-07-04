import { type NextRequest } from "next/server";
import { apiOk, apiError } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/v1/sub-invoices — inbound subcontractor invoices for the org.
 * Phase A §09: a filtered lens on the merged `invoices` store
 * (source='ap_sub'). `submitted_on` is kept as an alias of `issued_at`
 * for pre-merge consumers.
 */
export async function GET(req: NextRequest) {
  const state = new URL(req.url).searchParams.get("state");
  return withAuth(async (session) => {
    const supabase = await createClient();
    let q = supabase
      .from("invoices")
      .select(
        "id, number, vendor_id, work_order_id, purchase_order_id, amount_cents, retainage_pct, invoice_state, issued_at, waiver:lien_waiver_id(waiver_state)",
      )
      .eq("org_id", session.orgId)
      .eq("source", "ap_sub")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200);
    if (state) q = q.eq("invoice_state", state as never);
    const { data, error } = await q;
    if (error) return apiError("internal", error.message);
    const subInvoices = (data ?? []).map((r) => ({
      id: r.id,
      number: r.number,
      vendor_id: r.vendor_id,
      work_order_id: r.work_order_id,
      purchase_order_id: r.purchase_order_id,
      amount_cents: r.amount_cents,
      retainage_pct: r.retainage_pct,
      invoice_state: r.invoice_state,
      submitted_on: r.issued_at,
      waiver_state: (r.waiver as { waiver_state: string | null } | null)?.waiver_state ?? null,
    }));
    return apiOk({ subInvoices });
  });
}
