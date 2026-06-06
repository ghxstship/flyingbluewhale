"use server";

import { revalidatePath } from "next/cache";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendPushTo } from "@/lib/push/send";

export type State = { error?: string } | null;

export async function decideClaimAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Manager+ required" };

  const claimId = String(fd.get("claim_id") ?? "");
  const decision = String(fd.get("decision") ?? "");
  const listingId = String(fd.get("listing_id") ?? "");
  if (!claimId || !["approved", "declined"].includes(decision)) return { error: "Invalid input" };

  const supabase = await createClient();
  const { data: claim, error: fetchErr } = await supabase
    .from("open_shift_claims")
    .select("id, user_id, listing_id")
    .eq("id", claimId)
    .eq("org_id", session.orgId)
    .maybeSingle();

  if (fetchErr || !claim) return { error: "Claim not found" };

  const { error } = await supabase
    .from("open_shift_claims")
    .update({ claim_state: decision, decided_by: session.userId, decided_at: new Date().toISOString() })
    .eq("id", claimId)
    .eq("org_id", session.orgId)
    .eq("claim_state", "pending");

  if (error) return { error: error.message };

  // If approved, mark listing filled when max_claims reached
  if (decision === "approved") {
    const { data: listing } = await supabase
      .from("open_shift_listings")
      .select("id, max_claims, title, role")
      .eq("id", listingId)
      .eq("org_id", session.orgId)
      .maybeSingle();

    if (listing) {
      const { count } = await supabase
        .from("open_shift_claims")
        .select("*", { count: "exact", head: true })
        .eq("listing_id", listingId)
        .eq("claim_state", "approved");

      const approvedCount = count ?? 0;
      if (approvedCount >= (listing as { max_claims: number }).max_claims) {
        await supabase
          .from("open_shift_listings")
          .update({ listing_state: "filled" })
          .eq("id", listingId)
          .eq("org_id", session.orgId);
      }

      // Push result to the claimant
      const l = listing as { title: string; role: string };
      await sendPushTo((claim as { user_id: string }).user_id, {
        title: decision === "approved" ? "Shift confirmed" : "Shift claim declined",
        body: decision === "approved"
          ? `You've been confirmed for ${l.role} — ${l.title}`
          : `Your claim for ${l.role} — ${l.title} was not approved this time`,
        url: "/m/open-shifts",
        kind: "open_shift",
        scope: "mobile",
        orgId: session.orgId,
      });
    }
  }

  revalidatePath(`/console/workforce/open-shifts/${listingId}`);
  return null;
}

export async function cancelListingAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Manager+ required" };

  const listingId = String(fd.get("listing_id") ?? "");
  if (!listingId) return { error: "Missing listing" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("open_shift_listings")
    .update({ listing_state: "cancelled" })
    .eq("id", listingId)
    .eq("org_id", session.orgId)
    .in("listing_state", ["open", "filled"]);

  if (error) return { error: error.message };
  revalidatePath("/console/workforce/open-shifts");
  revalidatePath(`/console/workforce/open-shifts/${listingId}`);
  return null;
}
