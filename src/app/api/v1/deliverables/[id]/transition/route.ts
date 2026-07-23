import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { emitAudit, type AuditAction } from "@/lib/audit";
import { log } from "@/lib/log";
import {
  FULFILLMENT_STATES,
  NEXT_FULFILLMENT_STATES,
  type FulfillmentState,
} from "@/lib/db/assignments";

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
 *
 * Allowed transitions come from the canonical NEXT_FULFILLMENT_STATES map
 * in `@/lib/db/assignments` (CLAUDE.md Advancing canon) — never fork a
 * local copy here.
 */

const Body = z.object({
  to: z.enum(FULFILLMENT_STATES),
  note: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const input = await parseJson(req, Body);
  if (input instanceof Response) return input;
  return withAuth(async (session) => {
    const denial = assertCapability(session, "projects:write");
    if (denial) return denial;
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("deliverables")
      .select("id, fulfillment_state")
      .eq("org_id", session.orgId)
      .eq("id", id)
      .maybeSingle();
    if (error) return apiError("internal", error.message);
    if (!row) return apiError("not_found", "Deliverable not found");

    const allowed = NEXT_FULFILLMENT_STATES[row.fulfillment_state as FulfillmentState] ?? [];
    if (!allowed.includes(input.to)) {
      return apiError(
        "conflict",
        `Cannot transition ${row.fulfillment_state} → ${input.to}. Allowed: ${allowed.join(", ") || "(none)"}`,
      );
    }

    const before = { status: row.fulfillment_state };

    const nextStatus: FulfillmentState = input.to;

    // Conditional update: only land if the row is still in the state we
    // observed above. Closes the TOCTOU between the SELECT and the
    // UPDATE — if a concurrent transition raced us, the .eq("fulfillment_state", // row.fulfillment_state) makes the update a no-op (rows = 0) and we surface a
    // 409 conflict instead of silently overwriting the newer state.
    const { data: updated, error: upErr } = await supabase
      .from("deliverables")
      .update({
        fulfillment_state: nextStatus,
        reviewed_by: session.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("org_id", session.orgId)
      .eq("fulfillment_state", row.fulfillment_state)
      .select("id");
    if (upErr) return apiError("internal", upErr.message);
    if (!updated || updated.length === 0) {
      return apiError("conflict", "Deliverable was modified concurrently. Refresh and retry.");
    }

    const after = { status: nextStatus };

    // LDP §4 Deliverable Lifecycle — append a typed row to the
    // fulfillment_state_transitions log alongside the generic audit_log
    // entry. Best-effort; a log failure does not block the transition.
    const { error: logErr } = await supabase.from("deliverable_state_transitions").insert({
      org_id: session.orgId,
      deliverable_id: id,
      from_state: row.fulfillment_state as never,
      to_state: nextStatus as never,
      transitioned_by: session.userId,
      reason: input.note ?? null,
    });
    if (logErr) {
      // Non-fatal — audit_log still captures the transition via emitAudit below.
      log.warn("deliverable_state_transitions.insert_failed", {
        deliverable_id: id,
        err: logErr.message,
      });
    }

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

    return apiOk({ id, status: nextStatus });
  });
}
