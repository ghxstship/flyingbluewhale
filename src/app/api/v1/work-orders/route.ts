import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiOk, apiCreated, apiError, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DISPATCH_MODES, WORK_ORDER_VISIBILITIES } from "@/lib/subcontractor";

/**
 * GET  /api/v1/work-orders  — list the org's work orders (newest first).
 * POST /api/v1/work-orders  — create a work order (draft).
 *
 * Org-scoped via RLS + session.orgId. Part of the subcontractor-operations
 * layer (v7.5). Documented in the OpenAPI registry (all-endpoints.ts).
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const state = url.searchParams.get("state");
  return withAuth(async (session) => {
    const supabase = await createClient();
    let q = supabase
      .from("work_orders")
      .select("id, title, trade, work_order_state, dispatch_mode, visibility, budget_guide_cents, start_date, end_date, awarded_vendor_id")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200);
    if (state) q = q.eq("work_order_state", state);
    const { data, error } = await q;
    if (error) return apiError("internal", error.message);
    return apiOk({ workOrders: data ?? [] });
  });
}

const CreateSchema = z.object({
  title: z.string().min(1).max(160),
  trade: z.string().min(1).max(80),
  siteAddress: z.string().max(300).optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  budgetGuideCents: z.number().int().min(0).optional(),
  visibility: z.enum(WORK_ORDER_VISIBILITIES).default("private"),
  dispatchMode: z.enum(DISPATCH_MODES).default("allow-offers"),
});

export async function POST(req: NextRequest) {
  return withAuth(async (session) => {
    const d = await parseJson(req, CreateSchema);
    if (d instanceof Response) return d;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("work_orders")
      .insert({
        org_id: session.orgId,
        title: d.title,
        trade: d.trade,
        site_address: d.siteAddress ?? null,
        start_date: d.startDate ?? null,
        end_date: d.endDate ?? null,
        budget_guide_cents: d.budgetGuideCents ?? null,
        visibility: d.visibility,
        dispatch_mode: d.dispatchMode,
        created_by: session.userId,
      })
      .select("id, title, trade, work_order_state")
      .single();
    if (error) return apiError("internal", error.message);
    return apiCreated({ workOrder: data });
  });
}
