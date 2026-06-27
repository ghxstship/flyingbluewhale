"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type State = { error?: string; ok?: string } | null;

/**
 * Redeem a voucher code for credits. Validates state/expiry/redemption caps,
 * records the redemption (unique per user), credits the ledger, and advances
 * the voucher's redeemed_count / state.
 */
export async function redeemVoucherAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
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
  return { ok: `Redeemed — ${res.credits} credits added` };
}
