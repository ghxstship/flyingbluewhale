"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { emitAudit } from "@/lib/audit";

export type ConvertEstimateState = { error?: string } | null;

/**
 * v7.8 record action — "Convert To Budget". A WON estimate is the
 * priced commitment; converting it materialises the budget envelope
 * the finance spine tracks against. Creates one budgets row carrying
 * the estimate's total (amount) and subtotal (estimate_cents baseline),
 * back-linked via budgets.code = EST-<id8> — the queryable lineage key
 * that also serves as the idempotency probe (budgets has no estimate FK
 * and this action deliberately ships without a migration).
 */
export async function convertEstimateToBudgetAction(estimateId: string): Promise<ConvertEstimateState> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can convert estimates" };

  const supabase = await createClient();
  const { data: estimate, error: loadError } = await supabase
    .from("estimates")
    .select("id, name, notes, project_id, estimate_state, subtotal_cost, total_with_markup")
    .eq("org_id", session.orgId)
    .eq("id", estimateId)
    .is("deleted_at", null)
    .maybeSingle();
  if (loadError) return { error: loadError.message };
  if (!estimate) return { error: "Estimate not found" };
  if (estimate.estimate_state !== "won") {
    return { error: `Estimate must be won before conversion (currently ${estimate.estimate_state})` };
  }

  // Idempotency: the lineage code is unique per estimate, so a retry or
  // double-click lands on the budget the first click created.
  const lineageCode = `EST-${estimateId.slice(0, 8).toUpperCase()}`;
  const { data: existing } = await supabase
    .from("budgets")
    .select("id")
    .eq("org_id", session.orgId)
    .eq("code", lineageCode)
    .maybeSingle();
  if (existing) {
    redirect(`/studio/finance/budgets/${existing.id}`);
  }

  // Estimate totals are stored in dollars (see the detail page's
  // fmtMoney); budgets are cents.
  const amountCents = Math.round(Number(estimate.total_with_markup) * 100);
  const subtotalCents = Math.round(Number(estimate.subtotal_cost) * 100);

  const { data: budget, error: insertError } = await supabase
    .from("budgets")
    .insert({
      org_id: session.orgId,
      name: estimate.name,
      project_id: estimate.project_id,
      amount_cents: amountCents,
      estimate_cents: subtotalCents,
      code: lineageCode,
      internal_notes: `Converted from estimate ${estimateId}`,
      notes: estimate.notes,
    })
    .select("id")
    .single();
  if (insertError) return { error: insertError.message };

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "estimate.converted_to_budget",
    targetTable: "budgets",
    targetId: budget.id,
    metadata: { estimateId, amountCents },
  });

  revalidatePath("/studio/finance/budgets");
  revalidatePath(`/studio/estimates/${estimateId}`);
  revalidatePath("/studio/estimates");
  redirect(`/studio/finance/budgets/${budget.id}`);
}
