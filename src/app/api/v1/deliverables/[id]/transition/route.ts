import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { emitAudit, type AuditAction } from "@/lib/audit";
import type { DeliverableStatus } from "@/lib/supabase/types";

/**
 * POST /api/v1/deliverables/:id/transition
 *
 * Drives the advancing state machine: submitted → in_review → approved
 * (or rejected / revision_requested). Producer-side personas only;
 * portal-side personas use the upload form instead.
 *
 * The contract is intentionally narrow — every transition is one verb,
 * the body carries an optional `note` that lands in audit_log under the
 * `before/after` envelope so the audit log diff viewer surfaces it.
 */

const Body = z.object({
  to: z.enum(["in_review", "approved", "rejected", "revision_requested", "fulfilled"]),
  note: z.string().max(2000).optional(),
});

const ALLOWED: Record<string, string[]> = {
  submitted: ["in_review", "approved", "rejected", "revision_requested"],
  in_review: ["approved", "rejected", "revision_requested"],
  approved: ["fulfilled", "revision_requested"],
  revision_requested: ["in_review", "rejected"],
  rejected: ["revision_requested"],
  fulfilled: [],
  draft: [],
};

// `fulfilled` isn't in the column enum yet; we map it onto `approved` +
// data.fulfilled_at = now() so we don't break existing schema. Future
// migration can split it out properly.
type DeliverableData = { fulfilled_at?: string; [key: string]: unknown };

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const input = await parseJson(req, Body);
  if (input instanceof Response) return input;
  return withAuth(async (session) => {
    const denial = assertCapability(session, "projects:write");
    if (denial) return denial;
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("deliverables")
      .select("id, status, data")
      .eq("org_id", session.orgId)
      .eq("id", id)
      .maybeSingle();
    if (error) return apiError("internal", error.message);
    if (!row) return apiError("not_found", "Deliverable not found");

    const allowed = ALLOWED[row.status] ?? [];
    if (!allowed.includes(input.to)) {
      return apiError(
        "conflict",
        `Cannot transition ${row.status} → ${input.to}. Allowed: ${allowed.join(", ") || "(none)"}`,
      );
    }

    const before = { status: row.status, fulfilled_at: (row.data as DeliverableData)?.fulfilled_at ?? null };

    let nextStatus: DeliverableStatus = input.to === "fulfilled" ? "approved" : (input.to as DeliverableStatus);
    let nextData: DeliverableData = (row.data as DeliverableData) ?? {};
    if (input.to === "fulfilled") {
      nextData = { ...nextData, fulfilled_at: new Date().toISOString() };
    }

    const { error: upErr } = await supabase
      .from("deliverables")
      .update({
        status: nextStatus,
        data: nextData as never,
        reviewed_by: session.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("org_id", session.orgId);
    if (upErr) return apiError("internal", upErr.message);

    const after = { status: nextStatus, fulfilled_at: nextData.fulfilled_at ?? null };

    await emitAudit({
      actorId: session.userId,
      orgId: session.orgId,
      actorEmail: session.email,
      action: `deliverable.${input.to}` as AuditAction,
      targetTable: "deliverables",
      targetId: id,
      metadata: { before, after, note: input.note ?? null },
      requestId: req.headers.get("x-request-id"),
    });

    return apiOk({ id, status: nextStatus, data: nextData });
  });
}
