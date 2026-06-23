"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
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
  const parsed = z.object({ code: z.string().min(1, "Enter a code").max(120) }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid code" };
  const code = parsed.data.code.trim();
  const db = (await createClient()) as unknown as LooseSupabase;

  const { data: voucher } = await db
    .from("vouchers")
    .select("id, credits, max_redemptions, redeemed_count, expires_on, voucher_state")
    .eq("org_id", session.orgId)
    .eq("code", code)
    .is("deleted_at", null)
    .maybeSingle();
  if (!voucher) return { error: "Code not found" };
  if (voucher.voucher_state !== "active") return { error: "This code is no longer active" };
  if (voucher.expires_on && new Date(voucher.expires_on + "T23:59:59Z").getTime() < Date.now()) {
    return { error: "This code has expired" };
  }
  if (voucher.redeemed_count >= voucher.max_redemptions) return { error: "This code has been fully redeemed" };

  // One redemption per user (enforced by unique (voucher_id, user_id)).
  const { error: redErr } = await db.from("voucher_redemptions").insert({
    org_id: session.orgId,
    voucher_id: voucher.id,
    user_id: session.userId,
    credits: voucher.credits,
  });
  if (redErr) {
    return { error: redErr.code === "23505" ? "You already redeemed this code" : redErr.message };
  }

  await db.from("credit_ledger").insert({
    org_id: session.orgId,
    user_id: session.userId,
    delta: voucher.credits,
    reason: `Voucher ${code}`,
    ref_kind: "voucher",
    ref_id: voucher.id,
  });

  const nextCount = voucher.redeemed_count + 1;
  await db
    .from("vouchers")
    .update({ redeemed_count: nextCount, voucher_state: nextCount >= voucher.max_redemptions ? "redeemed" : "active" })
    .eq("id", voucher.id);

  revalidatePath("/legend/store");
  return { ok: `Redeemed — ${voucher.credits} credits added` };
}
