"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dollarsToCents, generateNumber } from "@/lib/format";
import { emitAudit } from "@/lib/audit";

const AwardSchema = z.object({
  vendor_id: z.string().uuid(),
  amount: z.string().optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

// Award is legal from any non-terminal RFQ state — draft (internal
// sourcing that never published), sent (published, bids in), closed
// (bidding window ended). awarded/cancelled are terminal.
const AWARDABLE_STATES = ["draft", "sent", "closed"] as const;

/**
 * v7.8 record action — "Award → Draft PO". Stamps the winning vendor
 * onto the RFQ (awarded_to_vendor_id + rfq_state=awarded, the
 * conditional update being the double-award lock) and drafts the
 * purchase order pre-filled from the RFQ, back-linked via an
 * `[rfq:<id>]` marker in the PO notes (purchase_orders has no rfq FK;
 * the marker doubles as the idempotency probe).
 */
export async function awardRfqAction(rfqId: string, _prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can award RFQs" };
  const parsed = AwardSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Pick a vendor to award to" };
  const supabase = await createClient();

  const { data: rfq } = await supabase
    .from("rfqs")
    .select("id, title, description, project_id, rfq_state")
    .eq("org_id", session.orgId)
    .eq("id", rfqId)
    .maybeSingle();
  if (!rfq) return { error: "RFQ not found" };

  // Idempotency: a PO already drafted from this RFQ wins.
  const marker = `[rfq:${rfqId}]`;
  const { data: existing } = await supabase
    .from("purchase_orders")
    .select("id")
    .eq("org_id", session.orgId)
    .like("notes", `%${marker}%`)
    .is("deleted_at", null)
    .limit(1);
  const existingPo = existing?.[0];
  if (existingPo) {
    redirect(`/studio/procurement/purchase-orders/${existingPo.id}`);
  }

  if (!AWARDABLE_STATES.includes(rfq.rfq_state as (typeof AWARDABLE_STATES)[number])) {
    return { error: `RFQ cannot be awarded from its current state (${rfq.rfq_state})` };
  }

  // Cross-tenant FK guard on the winning vendor.
  const { data: vendor } = await supabase
    .from("vendors")
    .select("id, name")
    .eq("id", parsed.data.vendor_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!vendor) return { error: "Vendor not found in your organization" };

  // Claim the award — conditional on the observed state so a stale tab
  // or double-click can't re-award.
  const { data: claimed, error: claimError } = await supabase
    .from("rfqs")
    .update({
      rfq_state: "awarded",
      awarded_to_vendor_id: vendor.id,
      closed_at: new Date().toISOString(),
    })
    .eq("org_id", session.orgId)
    .eq("id", rfqId)
    .eq("rfq_state", rfq.rfq_state)
    .select("id");
  if (claimError) return { error: claimError.message };
  if (!claimed || claimed.length === 0) {
    return { error: "RFQ changed concurrently — refresh and retry" };
  }

  const { data: po, error: insertError } = await supabase
    .from("purchase_orders")
    .insert({
      org_id: session.orgId,
      number: generateNumber("PO"),
      title: rfq.title,
      vendor_id: vendor.id,
      project_id: rfq.project_id,
      amount_cents: dollarsToCents(parsed.data.amount),
      notes: `Drafted from RFQ award ${marker}`,
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (insertError) {
    // The award itself is committed; the operator can hand-create the
    // PO. Surface the failure rather than silently succeeding.
    return { error: `RFQ awarded, but PO draft failed: ${insertError.message}` };
  }

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "rfq.awarded_po_drafted",
    targetTable: "purchase_orders",
    targetId: po.id,
    metadata: { rfqId, vendorId: vendor.id },
  });

  revalidatePath("/studio/procurement/rfqs");
  revalidatePath(`/studio/procurement/rfqs/${rfqId}`);
  revalidatePath("/studio/procurement/purchase-orders");
  redirect(`/studio/procurement/purchase-orders/${po.id}`);
}
