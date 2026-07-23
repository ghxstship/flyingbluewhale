"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import {
  DISPATCH_MODES,
  WORK_ORDER_VISIBILITIES,
  WORK_ORDER_STATES,
  canTransitionWorkOrder,
  type WorkOrderState,
} from "@/lib/subcontractor";
import { actionErrorMessage } from "@/lib/errors";

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

const CreateSchema = z.object({
  title: z.string().min(1).max(160),
  trade: z.string().min(1).max(80),
  site_address: z.string().max(300).optional().or(z.literal("")),
  start_date: z.string().date().optional().or(z.literal("")),
  end_date: z.string().date().optional().or(z.literal("")),
  budget_guide: z.coerce.number().min(0).optional(),
  visibility: z.enum(WORK_ORDER_VISIBILITIES),
  dispatch_mode: z.enum(DISPATCH_MODES),
});

export async function createWorkOrderAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = CreateSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const d = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("work_orders")
    .insert({
      org_id: session.orgId,
      title: d.title,
      trade: d.trade,
      site_address: d.site_address || null,
      start_date: d.start_date || null,
      end_date: d.end_date || null,
      budget_guide_cents: d.budget_guide != null ? Math.round(d.budget_guide * 100) : null,
      visibility: d.visibility,
      dispatch_mode: d.dispatch_mode,
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);
  revalidatePath("/studio/production/work-orders");
  redirect(`/studio/production/work-orders/${data!.id}`);
}

export async function transitionWorkOrderAction(id: string, to: WorkOrderState): Promise<State> {
  const session = await requireSession();
  if (!WORK_ORDER_STATES.includes(to)) return { error: actionErrorMessage("unknown-state", "Unknown state") };
  const supabase = await createClient();
  const { data: current } = await supabase
    .from("work_orders")
    .select("work_order_state")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .single();
  if (!current) return { error: actionErrorMessage("not-found.work-order", "Work order not found") };
  const from = current.work_order_state as WorkOrderState;
  if (!canTransitionWorkOrder(from, to)) {
    return { error: `Illegal transition ${from} → ${to}` };
  }
  const { error } = await supabase
    .from("work_orders")
    .update({ work_order_state: to })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/studio/production/work-orders/${id}`);
  return { ok: true };
}

/**
 * Award a work order to a vendor — the eligibility GATE. A vendor whose
 * `v_sub_eligibility` verdict for this trade is `blocked` cannot be awarded
 * (missing/expired required docs). This is the §4.1 contract enforced at the
 * work-order layer, server-side, so a stale tab can't bypass it.
 */
export async function awardWorkOrderAction(workOrderId: string, vendorId: string): Promise<State> {
  const session = await requireSession();
  const supabase = await createClient();
  const { data: wo } = await supabase
    .from("work_orders")
    .select("trade, work_order_state")
    .eq("id", workOrderId)
    .eq("org_id", session.orgId)
    .single();
  if (!wo) return { error: actionErrorMessage("not-found.work-order", "Work order not found") };

  const { data: elig } = await supabase
    .from("v_sub_eligibility")
    .select("verdict")
    .eq("org_id", session.orgId)
    .eq("vendor_id", vendorId)
    .eq("trade", wo.trade)
    .maybeSingle();
  if (elig?.verdict === "blocked") {
    return { error: actionErrorMessage("this-subcontractor-is-blocked-required-compliance-documents-are-missing", "This subcontractor is blocked: required compliance documents are missing or expired.") };
  }

  const { error } = await supabase
    .from("work_orders")
    .update({ awarded_vendor_id: vendorId, work_order_state: "awarded" })
    .eq("id", workOrderId)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/studio/production/work-orders/${workOrderId}`);
  return { ok: true };
}

/** Void-returning wrappers for direct `<form action={…}>` use (return ignored). */
export async function transitionWorkOrderForm(id: string, to: WorkOrderState): Promise<void> {
  await transitionWorkOrderAction(id, to);
}
export async function awardWorkOrderForm(workOrderId: string, vendorId: string): Promise<void> {
  await awardWorkOrderAction(workOrderId, vendorId);
}

const MessageSchema = z.object({ body: z.string().min(1).max(2000) });

/** Post a message to a work order's thread (Phase 2). Author = the caller. */
export async function postWorkOrderMessageAction(workOrderId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = MessageSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const { error } = await supabase.from("work_order_messages").insert({
    org_id: session.orgId,
    work_order_id: workOrderId,
    author_id: session.userId,
    body: parsed.data.body,
  });
  if (error) return actionFail(error.message, fd);
  revalidatePath(`/studio/production/work-orders/${workOrderId}/thread`);
  return { ok: true };
}

const BidSchema = z.object({
  vendor_id: z.string().uuid(),
  amount: z.coerce.number().min(0),
  note: z.string().max(500).optional().or(z.literal("")),
});

export async function placeBidAction(workOrderId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = BidSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const { error } = await supabase.from("work_order_bids").insert({
    org_id: session.orgId,
    work_order_id: workOrderId,
    vendor_id: parsed.data.vendor_id,
    amount_cents: Math.round(parsed.data.amount * 100),
    note: parsed.data.note || null,
  });
  if (error) return actionFail(error.message, fd);
  revalidatePath(`/studio/production/work-orders/${workOrderId}`);
  return { ok: true };
}
