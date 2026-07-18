import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Kit 31 (live-test resolutions #20/#23) — field purchase-request reads.
 *
 * The /m PO Request flow (FORMS.po → submitPoRequest) writes `requisitions`
 * rows with the structured PO facets (vendor_name, qty, needed_by,
 * auto_code/cost_center_id, product_url, purpose, quote_path). This is the
 * shared read the /m/finance surface consumes — one helper so the finance
 * page and the requisitions list can never disagree about what a field PO is.
 */

export type FieldPurchaseRequest = {
  id: string;
  title: string;
  vendorName: string | null;
  qty: number | null;
  estimatedCents: number | null;
  neededBy: string | null;
  autoCode: boolean;
  /** "0000 · Executive" when manually coded, else null (auto-codes on approval). */
  costCode: string | null;
  costCenterId: string | null;
  productUrl: string | null;
  purpose: string | null;
  hasQuote: boolean;
  requesterId: string | null;
  projectId: string | null;
  requisitionState: string;
  createdAt: string;
};

export async function listFieldPurchaseRequests(
  orgId: string,
  opts: { projectId?: string; requesterId?: string; limit?: number } = {},
): Promise<FieldPurchaseRequest[]> {
  const supabase = await createClient();
  let query = supabase
    .from("requisitions")
    .select(
      "id, title, vendor_name, qty, estimated_cents, needed_by, auto_code, cost_center_id, product_url, purpose, quote_path, requester_id, project_id, requisition_state, created_at, cost_center:cost_center_id(code, name)",
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 100);
  if (opts.projectId) query = query.eq("project_id", opts.projectId);
  if (opts.requesterId) query = query.eq("requester_id", opts.requesterId);

  const { data, error } = await query;
  if (error) throw error;

  type Row = {
    id: string;
    title: string;
    vendor_name: string | null;
    qty: number | null;
    estimated_cents: number | null;
    needed_by: string | null;
    auto_code: boolean;
    cost_center_id: string | null;
    product_url: string | null;
    purpose: string | null;
    quote_path: string | null;
    requester_id: string | null;
    project_id: string | null;
    requisition_state: string;
    created_at: string;
    cost_center: { code: string; name: string } | null;
  };

  return ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    title: r.title,
    vendorName: r.vendor_name,
    qty: r.qty,
    estimatedCents: r.estimated_cents,
    neededBy: r.needed_by,
    autoCode: r.auto_code,
    costCode: r.cost_center ? `${r.cost_center.code} · ${r.cost_center.name}` : null,
    costCenterId: r.cost_center_id,
    productUrl: r.product_url,
    purpose: r.purpose,
    hasQuote: !!r.quote_path,
    requesterId: r.requester_id,
    projectId: r.project_id,
    requisitionState: r.requisition_state,
    createdAt: r.created_at,
  }));
}
