"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dollarsToCents, generateNumber } from "@/lib/format";
import { actionFail, formFail } from "@/lib/forms/fail";
import { emitAudit } from "@/lib/audit";
import { routeToApprovals } from "@/lib/approvals/route";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z.object({
  title: z.string().min(1),
  vendor_id: z.string().uuid().optional().or(z.literal("")),
  project_id: z.string().uuid().optional().or(z.literal("")),
  amount: z.string().min(1),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createPoAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  // POs commit money to vendors — manager+ only at the app layer.
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.create-purchase-orders", "Only manager+ can create purchase orders") };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  // Cross-tenant FK guards on the optional FK fields. POs reference
  // money so a dangling cross-org vendor_id or project_id corrupts
  // procurement reporting in subtle ways — gate at the boundary.
  const projectId = parsed.data.project_id || null;
  const vendorId = parsed.data.vendor_id || null;
  if (projectId) {
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!project) return { error: actionErrorMessage("not-found.project-in-org", "Project not found in your organization") };
  }
  if (vendorId) {
    const { data: vendor } = await supabase
      .from("vendors")
      .select("id")
      .eq("id", vendorId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!vendor) return { error: actionErrorMessage("not-found.vendor-in-org", "Vendor not found in your organization") };
  }

  const { data, error } = await supabase
    .from("purchase_orders")
    .insert({
      org_id: session.orgId,
      number: generateNumber("PO"),
      title: parsed.data.title,
      vendor_id: vendorId,
      project_id: projectId,
      amount_cents: dollarsToCents(parsed.data.amount),
      created_by: session.userId,
    })
    .select()
    .single();
  if (error) return actionFail(error.message, fd);
  revalidatePath("/studio/procurement/purchase-orders");
  redirect(`/studio/procurement/purchase-orders/${data.id}`);
}

// PO FSM: draft → sent → acknowledged → fulfilled. Cancel allowed
// from any non-terminal state. Fulfilled + cancelled are terminal.
const PO_TRANSITIONS: Record<string, readonly string[]> = {
  draft: ["sent", "cancelled"],
  sent: ["acknowledged", "cancelled"],
  acknowledged: ["fulfilled", "cancelled"],
  fulfilled: [], // terminal
  cancelled: [], // terminal
};

export async function setPoStatusAction(
  id: string,
  status: "draft" | "sent" | "acknowledged" | "fulfilled" | "cancelled",
) {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.change-po-status", "Only manager+ can change PO status") };
  const supabase = await createClient();
  // Read current status so we can validate the transition + scope the
  // conditional update — without it a stale UI could move fulfilled
  // → draft and overwrite the historical record.
  const { data: row } = await supabase
    .from("purchase_orders")
    .select("po_state")
    .eq("org_id", session.orgId)
    .eq("id", id)
    .maybeSingle();
  if (!row) return { error: actionErrorMessage("not-found.purchase-order", "Purchase order not found") };
  const current = row.po_state as string;
  const allowed = PO_TRANSITIONS[current] ?? [];
  if (!allowed.includes(status)) {
    return { error: `Cannot move ${current} → ${status}. Allowed: ${allowed.join(", ") || "(terminal)"}` };
  }
  const { data: updated, error } = await supabase
    .from("purchase_orders")
    .update({ po_state: status as "draft" | "sent" | "acknowledged" | "fulfilled" | "cancelled" })
    .eq("org_id", session.orgId)
    .eq("id", id)
    .eq("po_state", current as "draft")
    .select("id");
  if (error) return { error: error.message };
  if (!updated || updated.length === 0) return { error: actionErrorMessage("concurrency.po-status", "PO status changed concurrently. Refresh and retry") };
  revalidatePath(`/studio/procurement/purchase-orders/${id}`);
  revalidatePath("/studio/procurement/purchase-orders");
  return { ok: true as const };
}

export type RoutePoState = { error?: string } | null;

/**
 * v7.8 record action — "Route To Approvals". Opens an approval_instances
 * row for the PO via the shared approvals engine (kit 20 REPO_LANDING §2:
 * no local status fields; the PO keeps its own po_state FSM while the
 * instance carries the review lifecycle).
 */
export async function routePoToApprovalsAction(poId: string): Promise<RoutePoState> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.route-purchase-orders-to-approvals", "Only manager+ can route purchase orders to approvals") };

  const supabase = await createClient();
  const { data: po } = await supabase
    .from("purchase_orders")
    .select("id, number, title, amount_cents, po_state")
    .eq("org_id", session.orgId)
    .eq("id", poId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!po) return { error: actionErrorMessage("not-found.purchase-order", "Purchase order not found") };
  if (po.po_state !== "draft" && po.po_state !== "sent") {
    return { error: `Only draft or sent purchase orders can be routed (currently ${po.po_state})` };
  }

  const routed = await routeToApprovals({
    session,
    subjectTable: "purchase_orders",
    subjectId: poId,
    metadata: { number: po.number, title: po.title, amountCents: po.amount_cents },
  });
  if ("error" in routed) return { error: routed.error };

  if (!routed.alreadyRouted) {
    await emitAudit({
      actorId: session.userId,
      orgId: session.orgId,
      actorEmail: session.email,
      action: "purchase_order.routed_to_approvals",
      targetTable: "approval_instances",
      targetId: routed.id,
      metadata: { poId, number: po.number },
    });
  }

  revalidatePath(`/studio/procurement/purchase-orders/${poId}`);
  revalidatePath("/studio/governance/approvals");
  redirect(`/studio/governance/approvals/${routed.id}`);
}

const BulkIds = z.array(z.string().uuid()).min(1).max(200);

export type BulkResult = { message?: string; error?: string };

/**
 * Bulk-send draft purchase orders (audit A-22). manager+ only; org-pinned;
 * non-draft rows are skipped and reported.
 */
export async function bulkSendPos(ids: string[]): Promise<BulkResult> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager.send-purchase-orders", "You Need Manager Access To Send Purchase Orders") };
  const parsed = BulkIds.safeParse(ids);
  if (!parsed.success) return { error: actionErrorMessage("invalid.selection", "Invalid Selection") };
  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("purchase_orders")
    .update({ po_state: "sent" })
    .in("id", parsed.data)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .eq("po_state", "draft")
    .select("id");
  if (error) return { error: `Could Not Send · ${error.message}` };
  const sent = updated?.length ?? 0;
  const skipped = parsed.data.length - sent;
  revalidatePath("/studio/procurement/purchase-orders");
  if (skipped > 0) return { error: `${sent} Sent · ${skipped} Skipped (not in draft)` };
  return { message: `${sent} ${sent === 1 ? "PO" : "POs"} Sent` };
}

/**
 * Bulk-cancel purchase orders (audit A-22). manager+ only; fulfilled or
 * already-cancelled rows are skipped and reported.
 */
export async function bulkCancelPos(ids: string[]): Promise<BulkResult> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager.cancel-purchase-orders", "You Need Manager Access To Cancel Purchase Orders") };
  const parsed = BulkIds.safeParse(ids);
  if (!parsed.success) return { error: actionErrorMessage("invalid.selection", "Invalid Selection") };
  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("purchase_orders")
    .update({ po_state: "cancelled" })
    .in("id", parsed.data)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .not("po_state", "in", "(fulfilled,cancelled)")
    .select("id");
  if (error) return { error: `Could Not Cancel · ${error.message}` };
  const cancelled = updated?.length ?? 0;
  const skipped = parsed.data.length - cancelled;
  revalidatePath("/studio/procurement/purchase-orders");
  if (skipped > 0) return { error: `${cancelled} Cancelled · ${skipped} Skipped (fulfilled or already cancelled)` };
  return { message: `${cancelled} ${cancelled === 1 ? "PO" : "POs"} Cancelled` };
}
