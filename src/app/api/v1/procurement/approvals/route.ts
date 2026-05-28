/**
 * GET  /api/v1/procurement/approvals  — list pending/resolved approval requests
 * POST /api/v1/procurement/approvals  — create an approval request for a PO or requisition
 *
 * Competitive feature: PO / Req approval routing (vs Coupa / SAP Joule agentic workflows).
 */
import { z } from "zod";
import { apiCreated, apiError, apiOk, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendPushTo } from "@/lib/push/send";
import type { LooseSupabase } from "@/lib/supabase/loose";

export const dynamic = "force-dynamic";

const CreateApproval = z.object({
  entity_type: z.enum(["purchase_order", "requisition", "expense"]),
  entity_id: z.string().uuid(),
  approver_id: z.string().uuid().optional(),
  notes: z.string().max(1000).optional(),
  threshold_amount_cents: z.number().int().min(0).optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const stateFilter = url.searchParams.get("state") ?? "pending";

  return withAuth(async (session) => {
    const denial = assertCapability(session, "procurement:read");
    if (denial) return denial;

    const supabase = (await createClient()) as unknown as LooseSupabase;

    const query = supabase
      .from("approval_requests")
      .select("*, requested_by_user:requested_by(id, email), approver_user:approver_id(id, email)")
      .eq("org_id", session.orgId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (stateFilter !== "all") {
      query.eq("approval_request_state", stateFilter);
    }

    const { data, error } = await query;
    if (error) return apiError("internal", error.message);

    return apiOk({ approvals: data ?? [] });
  });
}

export async function POST(req: Request) {
  const body = await parseJson(req, CreateApproval);
  if (body instanceof Response) return body;

  return withAuth(async (session) => {
    const denial = assertCapability(session, "procurement:write");
    if (denial) return denial;

    const supabase = (await createClient()) as unknown as LooseSupabase;

    const { data, error } = await supabase
      .from("approval_requests")
      .insert({
        org_id: session.orgId,
        entity_type: body.entity_type,
        entity_id: body.entity_id,
        requested_by: session.userId,
        approver_id: body.approver_id ?? null,
        notes: body.notes ?? null,
        threshold_amount_cents: body.threshold_amount_cents ?? null,
        approval_request_state: "pending",
      })
      .select()
      .single();

    if (error) return apiError("internal", error.message);

    // Push-notify the assigned approver if specified.
    if (body.approver_id) {
      const entityLabel = body.entity_type.replace(/_/g, " ");
      void sendPushTo(body.approver_id, {
        title: "Approval Required",
        body: `A ${entityLabel} needs your approval.`,
        kind: "approval_request",
        url: `/console/procurement/approvals/${data.id}`,
      });
    }

    return apiCreated(data);
  });
}
