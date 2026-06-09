"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { writeInbox, writeInboxBulk } from "@/lib/inbox";
import { log } from "@/lib/log";

/**
 * Talent-side booking-offer actions.
 *
 * Authorization: the session user must be the offer's talent —
 * `talent_profiles.user_id` linked via `talent_offers.talent_profile_id`.
 * RLS gives the recipient SELECT (`talent_offers_recipient_select`) but
 * UPDATE is org-member-only, so after verifying ownership on the
 * user-scoped read we apply the transition with the service client.
 *
 * Counter-offers are intentionally absent: `talent_offers` has no
 * counter-note or counter-amount columns — a counter is modeled as a new
 * versioned row (`previous_offer_id` + `version`), and the recipient
 * RLS has no INSERT path. Org-side authoring stays the only way to
 * produce a countered state.
 */

export type State = { error?: string; ok?: true } | null;

const Schema = z.object({ offer_id: z.string().uuid() });

type OwnOffer = {
  id: string;
  org_id: string;
  status: string;
  performance_date: string;
  created_by: string | null;
  act_name: string;
};

async function loadOwnOffer(offerId: string, userId: string): Promise<OwnOffer | { error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("talent_offers")
    .select("id, org_id, status, performance_date, created_by, talent_profiles!inner(user_id, act_name)")
    .eq("id", offerId)
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "Offer not found" };
  const row = data as unknown as {
    id: string;
    org_id: string;
    status: string;
    performance_date: string;
    created_by: string | null;
    talent_profiles: { user_id: string | null; act_name: string };
  };
  // The recipient-select policy already scopes visibility, but an org
  // member of the sending org can also read — gate explicitly on the
  // talent link so only the offer's talent can act here.
  if (row.talent_profiles.user_id !== userId) return { error: "This offer is not addressed to you" };
  return {
    id: row.id,
    org_id: row.org_id,
    status: row.status,
    performance_date: row.performance_date,
    created_by: row.created_by,
    act_name: row.talent_profiles.act_name,
  };
}

/** Best-effort in-app ping to the org side after a talent decision. */
async function notifyOrgOfDecision(offer: OwnOffer, actorId: string, decision: "accepted" | "declined"): Promise<void> {
  try {
    const title = decision === "accepted" ? "Booking Offer Accepted" : "Booking Offer Declined";
    const entry = {
      orgId: offer.org_id,
      kind: "talent_offer" as const,
      sourceType: "talent_offers",
      sourceId: offer.id,
      actorId,
      title,
      body: `${offer.act_name} ${decision} the offer for ${offer.performance_date}.`,
      href: `/console/marketplace/offers/${offer.id}`,
      push: false,
    };
    if (offer.created_by) {
      await writeInbox({ userId: offer.created_by, ...entry });
      return;
    }
    // Sender unknown — fan out to org owners/admins instead.
    if (isServiceClientAvailable()) {
      const service = createServiceClient();
      const { data: admins } = await service
        .from("memberships")
        .select("user_id")
        .eq("org_id", offer.org_id)
        .in("role", ["owner", "admin"])
        .is("deleted_at", null);
      const ids = ((admins ?? []) as Array<{ user_id: string }>).map((a) => a.user_id);
      if (ids.length > 0) await writeInboxBulk(ids, entry);
    }
  } catch (e) {
    log.warn("talent_offer.decision_notify_failed", {
      offerId: offer.id,
      decision,
      err: e instanceof Error ? e.message : String(e),
    });
  }
}

async function decide(prevState: State, fd: FormData, decision: "accepted" | "declined"): Promise<State> {
  void prevState;
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Missing offer" };

  const offer = await loadOwnOffer(parsed.data.offer_id, session.userId);
  if ("error" in offer) return { error: offer.error };

  if (!isServiceClientAvailable()) {
    return { error: "Offer decisions are not available in this environment" };
  }

  // State-machine guard: talent may only decide an open offer
  // (sent or countered). The conditional UPDATE re-checks server-side so
  // a stale tab can't redo a decided offer; `.select` confirms a row
  // actually flipped.
  const service = createServiceClient();
  const patch: { status: "accepted" | "declined"; accepted_at?: string } =
    decision === "accepted" ? { status: "accepted", accepted_at: new Date().toISOString() } : { status: "declined" };
  const { data: updated, error } = await service
    .from("talent_offers")
    .update(patch)
    .eq("id", parsed.data.offer_id)
    .in("status", ["sent", "countered"])
    .select("id");
  if (error) return { error: error.message };
  if (!updated || updated.length === 0) {
    return { error: "Only a sent or countered offer can be decided" };
  }

  await notifyOrgOfDecision(offer, session.userId, decision);

  revalidatePath("/me/offers");
  return { ok: true };
}

export async function acceptOfferAction(prevState: State, fd: FormData): Promise<State> {
  return decide(prevState, fd, "accepted");
}

export async function declineOfferAction(prevState: State, fd: FormData): Promise<State> {
  return decide(prevState, fd, "declined");
}
