"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { assertLegendWrite } from "@/lib/legend_access";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

export type State = { error?: string; ok?: string } | null;

/**
 * Redeem a voucher code for credits. Validates state/expiry/redemption caps,
 * records the redemption (unique per user), credits the ledger, and advances
 * the voucher's redeemed_count / state.
 */
export async function redeemVoucherAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const denied = assertLegendWrite(session);
  if (denied) return denied;
  const parsed = z.object({ code: z.string().min(1, "Enter a code").max(120) }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid code" };
  const code = parsed.data.code.trim();
  const db = await createClient();

  // Atomic + idempotent: redeem_voucher validates state/expiry/caps, records
  // the one-per-user redemption, grants the credit (keyed on the voucher so a
  // double-submit can't double-credit), and bumps the count/state — all in one
  // transaction. Replaces the prior three unguarded writes, which could leave a
  // redemption row without its credit grant (permanently blocking the retry via
  // the unique (voucher_id, user_id) constraint).
  const { data: result, error } = await db.rpc("redeem_voucher", {
    p_org_id: session.orgId,
    p_user_id: session.userId,
    p_code: code,
  });
  if (error) return { error: error.message };

  const res = result as { ok: boolean; reason?: string; credits?: number } | null;
  if (!res?.ok) {
    const messages: Record<string, string> = {
      not_found: "Code not found",
      inactive: "This code is no longer active",
      expired: "This code has expired",
      fully_redeemed: "This code has been fully redeemed",
      already_redeemed: "You already redeemed this code",
    };
    return { error: messages[res?.reason ?? ""] ?? "Could not redeem this code" };
  }

  revalidatePath("/legend/store");
  return { ok: `Redeemed: ${res.credits} credits added` };
}

/**
 * Spend credits on a store item — THE debit path of the credit economy
 * (readiness blocker B-4a). Delegates to the atomic `purchase_store_item`
 * SECURITY DEFINER RPC (migration 20260723120000): balance check + ledger
 * debit + `credit_purchases` fulfillment row + stock decrement in one
 * transaction, serialized per (org, user) so the balance can never go
 * negative. The RPC is not yet in the generated types (migration authored,
 * not applied), so the call rides the loose client.
 */
export async function purchaseItemAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const denied = assertLegendWrite(session);
  if (denied) return denied;
  const parsed = z.object({ product_id: z.string().uuid() }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid product" };
  const db = (await createClient()) as unknown as LooseSupabase;

  const { data: result, error } = await db.rpc("purchase_store_item", {
    p_org_id: session.orgId,
    p_user_id: session.userId,
    p_product_id: parsed.data.product_id,
  });
  if (error) return { error: error.message };

  const res = result as { ok: boolean; reason?: string; credits?: number; balance?: number; price?: number } | null;
  if (!res?.ok) {
    if (res?.reason === "insufficient_balance") {
      // Honest shortfall: say exactly how many credits are missing.
      const shortfall = Math.max(0, (res.price ?? 0) - (res.balance ?? 0));
      return { error: `Not enough credits: this item costs ${res.price ?? 0} and you have ${res.balance ?? 0}. You need ${shortfall} more.` };
    }
    const messages: Record<string, string> = {
      not_found: "Item not found",
      not_purchasable: "This product is a credit pack, not a store item",
      inactive: "This item is no longer available",
      out_of_stock: "This item is out of stock",
    };
    return { error: messages[res?.reason ?? ""] ?? "Could not complete this purchase" };
  }

  revalidatePath("/legend/store");
  return { ok: `Purchased: ${res.credits} credits spent. New balance: ${res.balance}` };
}
