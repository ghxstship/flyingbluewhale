"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type State = { error?: string; success?: boolean } | null;

export async function claimShiftAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const listingId = String(fd.get("listing_id") ?? "");
  const notes = String(fd.get("notes") ?? "") || null;
  if (!listingId) return { error: "Missing shift" };

  const supabase = await createClient();

  // Guard: listing must be open
  const { data: listing } = await supabase
    .from("open_shift_listings")
    .select("id, listing_state, max_claims, org_id")
    .eq("id", listingId)
    .maybeSingle();

  if (!listing) return { error: "Shift not found" };
  const l = listing as { id: string; listing_state: string; max_claims: number; org_id: string };
  if (l.listing_state !== "open") return { error: "This shift is no longer available" };

  const { error } = await supabase.from("open_shift_claims").insert({
    listing_id: listingId,
    org_id: l.org_id,
    user_id: session.userId,
    notes,
  });

  if (error) {
    if (error.code === "23505") return { error: "You've already claimed this shift" };
    return { error: error.message };
  }

  revalidatePath("/m/open-shifts");
  return { success: true };
}

export async function withdrawClaimAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const claimId = String(fd.get("claim_id") ?? "");
  if (!claimId) return { error: "Missing claim" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("open_shift_claims")
    .update({ claim_state: "withdrawn" })
    .eq("id", claimId)
    .eq("user_id", session.userId)
    .eq("claim_state", "pending");

  if (error) return { error: error.message };
  revalidatePath("/m/open-shifts");
  return { success: true };
}
