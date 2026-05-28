import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendPushTo } from "@/lib/push/send";
import type { LooseSupabase } from "@/lib/supabase/loose";

export const dynamic = "force-dynamic";

const Params = z.object({ approvalId: z.string().uuid() });

const UpdateApproval = z.object({
  approval_request_state: z.enum(["approved", "rejected", "withdrawn"]),
  reviewer_notes: z.string().max(1000).optional(),
});

export async function GET(_req: Request, ctx: { params: Promise<{ approvalId: string }> }) {
  const { approvalId } = await ctx.params;
  if (!Params.safeParse({ approvalId }).success) return apiError("bad_request", "Invalid approval id");

  return withAuth(async (session) => {
    const denial = assertCapability(session, "procurement:read");
    if (denial) return denial;

    const supabase = (await createClient()) as unknown as LooseSupabase;

    const { data, error } = await supabase
      .from("approval_requests")
      .select("*, requested_by_user:requested_by(id, email), approver_user:approver_id(id, email)")
      .eq("id", approvalId)
      .eq("org_id", session.orgId)
      .maybeSingle();

    if (error) return apiError("internal", error.message);
    if (!data) return apiError("not_found", "Approval request not found");

    return apiOk(data);
  });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ approvalId: string }> }) {
  const { approvalId } = await ctx.params;
  if (!Params.safeParse({ approvalId }).success) return apiError("bad_request", "Invalid approval id");

  const body = await parseJson(req, UpdateApproval);
  if (body instanceof Response) return body;

  return withAuth(async (session) => {
    const denial = assertCapability(session, "procurement:write");
    if (denial) return denial;

    const supabase = (await createClient()) as unknown as LooseSupabase;

    const { data: existing } = await supabase
      .from("approval_requests")
      .select("approval_request_state, requested_by, entity_type")
      .eq("id", approvalId)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (!existing) return apiError("not_found", "Approval request not found");
    if ((existing as { approval_request_state?: string }).approval_request_state !== "pending") {
      return apiError("conflict", "Approval request is already resolved");
    }

    const { data, error } = await supabase
      .from("approval_requests")
      .update({
        approval_request_state: body.approval_request_state,
        reviewer_notes: body.reviewer_notes ?? null,
        resolved_at: new Date().toISOString(),
        approver_id: session.userId,
      })
      .eq("id", approvalId)
      .select()
      .single();

    if (error) return apiError("internal", error.message);

    // Notify requester of the decision.
    const requestedBy = (existing as { requested_by?: string }).requested_by;
    if (requestedBy) {
      const stateVerb = body.approval_request_state === "approved" ? "approved" : "rejected";
      const entityLabel = ((existing as { entity_type?: string }).entity_type ?? "request").replace(/_/g, " ");
      void sendPushTo(requestedBy, {
        title: `${entityLabel.charAt(0).toUpperCase() + entityLabel.slice(1)} ${stateVerb}`,
        body: body.reviewer_notes ?? `Your ${entityLabel} has been ${stateVerb}.`,
        kind: "approval_resolved",
        url: `/console/procurement/approvals/${approvalId}`,
      });
    }

    return apiOk(data);
  });
}
