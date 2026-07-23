"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dollarsToCents, generateNumber } from "@/lib/format";
import { actionFail, formFail } from "@/lib/forms/fail";
import { emitAudit } from "@/lib/audit";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  estimated: z.string().optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createReqAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const { error } = await supabase.from("requisitions").insert({
    org_id: session.orgId,
    requester_id: session.userId,
    title: parsed.data.title,
    description: parsed.data.description || null,
    estimated_cents: parsed.data.estimated ? dollarsToCents(parsed.data.estimated) : null,
  });
  if (error) return actionFail(error.message, fd);
  revalidatePath("/studio/procurement/requisitions");
  redirect("/studio/procurement/requisitions");
}

export type ConvertReqState = { error?: string } | null;

/**
 * v7.8 record action — "Convert To PO". An APPROVED requisition
 * becomes a draft purchase order pre-filled with its title, scope and
 * estimate; purchase_orders.requisition_id is the hard back-link.
 * The requisition_state approved → converted flip is the atomic claim
 * (conditional update), so concurrent double-clicks can't draft two
 * POs; the requisition_id pre-check makes retries land on the PO the
 * first click created.
 */
export async function convertRequisitionToPoAction(reqId: string): Promise<ConvertReqState> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.convert-requisitions", "Only manager+ can convert requisitions") };
  const supabase = await createClient();

  const { data: req } = await supabase
    .from("requisitions")
    .select("id, title, description, estimated_cents, project_id, requisition_state")
    .eq("org_id", session.orgId)
    .eq("id", reqId)
    .maybeSingle();
  if (!req) return { error: actionErrorMessage("not-found.requisition", "Requisition not found") };

  // Idempotency: a PO already citing this requisition wins.
  const { data: existing } = await supabase
    .from("purchase_orders")
    .select("id")
    .eq("org_id", session.orgId)
    .eq("requisition_id", reqId)
    .is("deleted_at", null)
    .limit(1);
  const existingPo = existing?.[0];
  if (existingPo) {
    redirect(`/studio/procurement/purchase-orders/${existingPo.id}`);
  }

  if (req.requisition_state !== "approved") {
    return { error: `Requisition must be approved before conversion (currently ${req.requisition_state})` };
  }

  // Claim the conversion first — the conditional update is the lock.
  const { data: claimed, error: claimError } = await supabase
    .from("requisitions")
    .update({ requisition_state: "converted" })
    .eq("org_id", session.orgId)
    .eq("id", reqId)
    .eq("requisition_state", "approved")
    .select("id");
  if (claimError) return { error: claimError.message };
  if (!claimed || claimed.length === 0) {
    return { error: actionErrorMessage("concurrency.requisition", "Requisition changed concurrently. Refresh and retry") };
  }

  const { data: po, error: insertError } = await supabase
    .from("purchase_orders")
    .insert({
      org_id: session.orgId,
      number: generateNumber("PO"),
      title: req.title,
      notes: req.description,
      project_id: req.project_id,
      amount_cents: req.estimated_cents ?? 0,
      requisition_id: reqId,
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (insertError) {
    // Release the claim so the operator can retry after fixing the cause.
    await supabase
      .from("requisitions")
      .update({ requisition_state: "approved" })
      .eq("org_id", session.orgId)
      .eq("id", reqId)
      .eq("requisition_state", "converted");
    return { error: insertError.message };
  }

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "requisition.converted_to_po",
    targetTable: "purchase_orders",
    targetId: po.id,
    metadata: { requisitionId: reqId },
  });

  revalidatePath("/studio/procurement/requisitions");
  revalidatePath(`/studio/procurement/requisitions/${reqId}`);
  revalidatePath("/studio/procurement/purchase-orders");
  redirect(`/studio/procurement/purchase-orders/${po.id}`);
}

/**
 * v7.8 record action — "Convert To RFQ". Opens competitive sourcing on
 * a submitted/approved requisition: drafts an rfqs row pre-filled from
 * the requisition, back-linked via a `[req:<id>]` marker in the RFQ
 * description (rfqs has no requisition FK; the marker doubles as the
 * idempotency probe), and advances the requisition's procurement spine
 * (upo_state) to rfq_issued.
 */
export async function convertRequisitionToRfqAction(reqId: string): Promise<ConvertReqState> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.convert-requisitions", "Only manager+ can convert requisitions") };
  const supabase = await createClient();

  const { data: req } = await supabase
    .from("requisitions")
    .select("id, title, description, project_id, requisition_state")
    .eq("org_id", session.orgId)
    .eq("id", reqId)
    .maybeSingle();
  if (!req) return { error: actionErrorMessage("not-found.requisition", "Requisition not found") };

  const marker = `[req:${reqId}]`;
  const { data: existing } = await supabase
    .from("rfqs")
    .select("id")
    .eq("org_id", session.orgId)
    .like("description", `%${marker}%`)
    .limit(1);
  const existingRfq = existing?.[0];
  if (existingRfq) {
    redirect(`/studio/procurement/rfqs/${existingRfq.id}`);
  }

  if (req.requisition_state !== "submitted" && req.requisition_state !== "approved") {
    return { error: `Requisition must be submitted or approved before sourcing (currently ${req.requisition_state})` };
  }

  const description = [req.description?.trim() || null, marker].filter(Boolean).join("\n\n");
  const { data: rfq, error: insertError } = await supabase
    .from("rfqs")
    .insert({
      org_id: session.orgId,
      title: req.title,
      description,
      project_id: req.project_id,
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (insertError) return { error: insertError.message };

  // Patch the source's procurement spine: sourcing is now in flight.
  await supabase.from("requisitions").update({ state: "rfq_issued" }).eq("org_id", session.orgId).eq("id", reqId);

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "requisition.converted_to_rfq",
    targetTable: "rfqs",
    targetId: rfq.id,
    metadata: { requisitionId: reqId },
  });

  revalidatePath("/studio/procurement/requisitions");
  revalidatePath(`/studio/procurement/requisitions/${reqId}`);
  revalidatePath("/studio/procurement/rfqs");
  redirect(`/studio/procurement/rfqs/${rfq.id}`);
}

const BulkIds = z.array(z.string().uuid()).min(1).max(200);

export type BulkResult = { message?: string; error?: string };

/**
 * Bulk approve / reject submitted requisitions (audit A-22). manager+
 * only; rows not in `submitted` are skipped and reported.
 */
async function bulkSetRequisitionState(ids: string[], next: "approved" | "rejected"): Promise<BulkResult> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager.review-requisitions", "You Need Manager Access To Review Requisitions") };
  const parsed = BulkIds.safeParse(ids);
  if (!parsed.success) return { error: actionErrorMessage("invalid.selection", "Invalid Selection") };
  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("requisitions")
    .update({ requisition_state: next })
    .in("id", parsed.data)
    .eq("org_id", session.orgId)
    .eq("requisition_state", "submitted")
    .select("id");
  if (error) return { error: `Could Not Update · ${error.message}` };
  const done = updated?.length ?? 0;
  const skipped = parsed.data.length - done;
  revalidatePath("/studio/procurement/requisitions");
  const verb = next === "approved" ? "Approved" : "Rejected";
  if (skipped > 0) return { error: `${done} ${verb} · ${skipped} Skipped (not in submitted)` };
  return { message: `${done} ${done === 1 ? "Requisition" : "Requisitions"} ${verb}` };
}

export async function bulkApproveRequisitions(ids: string[]): Promise<BulkResult> {
  return bulkSetRequisitionState(ids, "approved");
}

export async function bulkRejectRequisitions(ids: string[]): Promise<BulkResult> {
  return bulkSetRequisitionState(ids, "rejected");
}
