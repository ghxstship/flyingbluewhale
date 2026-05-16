"use server";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ClaimState = { error?: string; success?: boolean } | null;

export async function claimOpenShift(
  _prev: ClaimState,
  formData: FormData,
): Promise<ClaimState> {
  const session = await requireSession();
  const supabase = await createClient();

  const open_shift_id = formData.get("open_shift_id") as string | null;
  const note = (formData.get("note") as string | null)?.trim() || null;

  if (!open_shift_id) return { error: "Missing shift ID." };

  // Verify shift is still open and belongs to the user's org
  const { data: shift } = await supabase
    .from("open_shifts")
    .select("id, org_id, shift_state, max_claims")
    .eq("id", open_shift_id)
    .eq("org_id", session.orgId)
    .maybeSingle();

  if (!shift) return { error: "Shift not found." };
  if (shift.shift_state !== "open") return { error: "This shift is no longer available." };

  const { error } = await supabase.from("open_shift_claims").insert({
    open_shift_id,
    org_id: session.orgId,
    user_id: session.userId,
    note,
  });

  if (error) {
    if (error.code === "23505") return { error: "You have already claimed this shift." };
    return { error: error.message };
  }

  revalidatePath("/m/open-shifts");
  return { success: true };
}

export async function withdrawClaim(claimId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase
    .from("open_shift_claims")
    .update({ claim_state: "withdrawn" })
    .eq("id", claimId)
    .eq("user_id", session.userId);
  revalidatePath("/m/open-shifts");
}
