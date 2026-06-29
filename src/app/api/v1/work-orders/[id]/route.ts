import { apiOk, apiError } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/v1/work-orders/{id} — a work order with its bids and change orders.
 * Org-scoped via RLS. Subcontractor-operations layer (v7.5).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withAuth(async (session) => {
    const supabase = await createClient();
    const { data: workOrder, error } = await supabase
      .from("work_orders")
      .select("*")
      .eq("id", id)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) return apiError("internal", error.message);
    if (!workOrder) return apiError("not_found", "Work order not found");
    const [{ data: bids }, { data: changeOrders }] = await Promise.all([
      supabase.from("work_order_bids").select("id, vendor_id, amount_cents, note, created_at").eq("work_order_id", id),
      supabase
        .from("work_order_change_orders")
        .select("id, reason, amount_cents, change_order_state, created_at")
        .eq("work_order_id", id),
    ]);
    return apiOk({ workOrder, bids: bids ?? [], changeOrders: changeOrders ?? [] });
  });
}
