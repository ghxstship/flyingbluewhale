import { z } from "zod";
import { registerAction } from "../registry";
import { createServiceClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

/**
 * settlement.settle — the kit 26 Phase E agent verb: "settle the Chicago
 * show". Flips a show settlement draft/reconciling -> final and stamps
 * finalized_at/_by, refusing re-finalize and disputes (the transition it
 * respects). DELIBERATELY does NOT fire the Stripe balance payout — moving
 * money stays a human act on the settlement console
 * (finalizeSettlementAction); the verb closes the ledger, not the wallet.
 */

const Schema = z.object({
  settlementId: z.string().uuid(),
});

registerAction({
  type: "settlement.settle",
  schema: Schema,
  label: "Settle Show",
  description: "Finalizes a show settlement (draft or reconciling to final). Never moves money.",
  async run(input, ctx) {
    const svc = createServiceClient() as unknown as LooseSupabase;

    const { data: s } = (await svc
      .from("settlements")
      .select("id, settlement_state, nbor_cents, balance_due_cents")
      .eq("id", input.settlementId)
      .eq("org_id", ctx.orgId)
      .maybeSingle()) as {
      data: {
        id: string;
        settlement_state: "draft" | "reconciling" | "final" | "disputed";
        nbor_cents: number | null;
        balance_due_cents: number;
      } | null;
    };
    if (!s) throw new Error(`settlement.settle: settlement ${input.settlementId} not found in this organization`);
    if (s.settlement_state === "final") {
      return { output: { settlementId: s.id, settlementState: "final", changed: false } };
    }
    if (s.settlement_state === "disputed") {
      throw new Error("settlement.settle: a disputed settlement must be resolved by a person, not an automation");
    }

    // Conditional claim — a concurrent finalize that beat us keeps its
    // finalized_by attribution instead of being silently overwritten.
    const { data: updated, error } = (await svc
      .from("settlements")
      .update({
        settlement_state: "final",
        finalized_at: new Date().toISOString(),
        finalized_by: ctx.actorId ?? null,
      })
      .eq("id", s.id)
      .eq("org_id", ctx.orgId)
      .eq("settlement_state", s.settlement_state)
      .select("id")
      .maybeSingle()) as { data: { id: string } | null; error: { message: string } | null };
    if (error) throw new Error(`settlement.settle: update failed: ${error.message}`);
    if (!updated) {
      throw new Error("settlement.settle: settlement state changed concurrently; re-run to settle the current state");
    }

    return {
      output: {
        settlementId: s.id,
        settlementState: "final",
        changed: true,
        balanceDueCents: s.balance_due_cents,
        payout: "not fired (human act on the settlement console)",
      },
    };
  },
});

export {};
