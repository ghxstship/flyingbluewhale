"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type State = { error?: string } | null;

export type ReferralCode = {
  code: string;
  points: number;
  tier: string;
};

/**
 * Get-or-create the signed-in user's `referral_codes` row. RLS WITH CHECK
 * requires user_id = auth.uid(), so the owner column is the session user.
 * Returns the resolved code/points/tier for the hero.
 */
export async function getOrCreateReferral(): Promise<ReferralCode> {
  const session = await requireSession();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("referral_codes")
    .select("code, points, tier")
    .eq("user_id", session.userId)
    .maybeSingle();

  if (existing) {
    return { code: existing.code, points: existing.points, tier: existing.tier };
  }

  const code = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  const { data: inserted, error } = await supabase
    .from("referral_codes")
    .insert({ user_id: session.userId, code })
    .select("code, points, tier")
    .single();

  if (error || !inserted) {
    // Lost a race (unique pk) — re-read.
    const { data: again } = await supabase
      .from("referral_codes")
      .select("code, points, tier")
      .eq("user_id", session.userId)
      .maybeSingle();
    if (again) return { code: again.code, points: again.points, tier: again.tier };
    return { code, points: 0, tier: "bronze" };
  }

  return { code: inserted.code, points: inserted.points, tier: inserted.tier };
}

const InviteInput = z.object({
  contact: z.string().trim().min(1, "Enter an email or phone number."),
});

/**
 * Send a referral invitation. RLS WITH CHECK requires referrer_user_id =
 * auth.uid(), so the owner column is set from the session.
 */
export async function sendReferralInvite(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = InviteInput.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid contact." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("referral_invitations").insert({
    referrer_user_id: session.userId,
    invitee_contact: parsed.data.contact,
    invite_state: "invited",
  });
  if (error) return { error: error.message };

  revalidatePath("/m/referrals");
  return null;
}
