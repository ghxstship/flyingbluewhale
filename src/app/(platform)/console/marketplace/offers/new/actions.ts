"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import { writeInbox } from "@/lib/inbox";
import { log } from "@/lib/log";
import { DEPOSIT_PCT_DEFAULT, BALANCE_TERMS_DEFAULT } from "@/lib/payment-terms";

const Schema = z.object({
  talent_profile_id: z.string().uuid(),
  project_id: z.string().uuid().optional().or(z.literal("")),
  performance_date: z.string().min(1),
  slot_start: z.string().optional().or(z.literal("")),
  slot_end: z.string().optional().or(z.literal("")),
  fee: z.string().min(1),
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .default("USD"),
  deposit_pct: z.string().default(String(DEPOSIT_PCT_DEFAULT)),
  balance_terms: z.string().default(BALANCE_TERMS_DEFAULT),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createOfferAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  // Booking offers commit a fee + appear on the recipient's portal —
  // manager+ at the app layer.
  if (!isManagerPlus(session)) return { error: "Only manager+ can send booking offers" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const feeCents = Math.round(Number(parsed.data.fee.replace(/[$,]/g, "")) * 100);
  if (!Number.isFinite(feeCents) || feeCents <= 0) return { error: "Invalid fee" };

  // Cross-tenant FK guards on talent_profile_id (required) +
  // project_id (optional). The talent profile is the load-bearing
  // reference — without the gate a user could send an offer to
  // another org's roster, which the recipient sees in their portal.
  const { data: talent } = await supabase
    .from("talent_profiles")
    .select("id")
    .eq("id", parsed.data.talent_profile_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!talent) return { error: "Talent profile not found in your organization" };

  const projectId = parsed.data.project_id || null;
  if (projectId) {
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!project) return { error: "Project not found in your organization" };
  }

  const { data, error } = await supabase
    .from("talent_offers")
    .insert({
      org_id: session.orgId,
      talent_profile_id: parsed.data.talent_profile_id,
      project_id: projectId,
      performance_date: parsed.data.performance_date,
      slot_start: parsed.data.slot_start || null,
      slot_end: parsed.data.slot_end || null,
      fee_cents: feeCents,
      currency: parsed.data.currency,
      deposit_pct: Math.min(100, Math.max(0, Math.round(Number(parsed.data.deposit_pct)))),
      balance_terms: parsed.data.balance_terms,
      talent_offer_state: "draft",
      created_by: session.userId,
    })
    .select("id")
    .single();

  if (error) return actionFail(error.message, fd);
  revalidatePath("/console/marketplace/offers");
  redirect(`/console/marketplace/offers/${(data as { id: string }).id}`);
}

const Transition = z.object({ offer_id: z.string().uuid() });

/**
 * Tell the talent an org-side transition happened — sends used to land
 * silently and acts only saw the new state by revisiting /me/offers.
 * In-app only (no marketplace PushKind exists in the catalog yet).
 * Best-effort: a notify failure never rolls back the transition.
 */
async function notifyTalentOfTransition(args: {
  offerId: string;
  orgId: string;
  actorId: string;
  title: string;
  decision: string;
}): Promise<void> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("talent_offers")
      .select("id, performance_date, talent_profiles!inner(user_id)")
      .eq("id", args.offerId)
      .eq("org_id", args.orgId)
      .maybeSingle();
    const row = data as unknown as {
      performance_date: string;
      talent_profiles: { user_id: string | null };
    } | null;
    const talentUserId = row?.talent_profiles?.user_id;
    if (!talentUserId) return; // unclaimed profile — nobody to ping
    await writeInbox({
      userId: talentUserId,
      orgId: args.orgId,
      kind: "talent_offer",
      sourceType: "talent_offers",
      sourceId: args.offerId,
      actorId: args.actorId,
      title: args.title,
      body: `Your booking offer for ${row.performance_date} was ${args.decision}.`,
      href: "/me/offers",
      push: false,
    });
  } catch (e) {
    log.warn("talent_offer.transition_notify_failed", {
      offerId: args.offerId,
      err: e instanceof Error ? e.message : String(e),
    });
  }
}

// Offer state machine — canonical transitions:
//   draft     → sent
//   sent      → accepted | countered | declined
//   countered → accepted | declined
//
// Each action below uses .eq("talent_offer_state", <expected>) (or .in("talent_offer_state", [...]))
// as the conditional guard so a stale UI or a direct API call can't skip
// states. The .select("id") confirms a row was actually updated — without
// it, an out-of-state transition silently succeeds with no rows affected
// and the caller thinks the offer moved.

export async function sendOfferAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Transition.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Missing offer" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("talent_offers")
    .update({ talent_offer_state: "sent", sent_at: new Date().toISOString() })
    .eq("id", parsed.data.offer_id)
    .eq("org_id", session.orgId)
    .eq("talent_offer_state", "draft")
    .select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "Offer can't be sent from its current state" };
  await notifyTalentOfTransition({
    offerId: parsed.data.offer_id,
    orgId: session.orgId,
    actorId: session.userId,
    title: "Booking Offer Received",
    decision: "sent",
  });
  revalidatePath(`/console/marketplace/offers/${parsed.data.offer_id}`);
  return { error: undefined };
}

export async function acceptOfferAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Transition.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Missing offer" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("talent_offers")
    .update({ talent_offer_state: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", parsed.data.offer_id)
    .eq("org_id", session.orgId)
    .in("talent_offer_state", ["sent", "countered"])
    .select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "Offer can only be accepted from sent or countered" };
  await notifyTalentOfTransition({
    offerId: parsed.data.offer_id,
    orgId: session.orgId,
    actorId: session.userId,
    title: "Booking Offer Accepted",
    decision: "marked accepted",
  });
  revalidatePath(`/console/marketplace/offers/${parsed.data.offer_id}`);
  return { error: undefined };
}

export async function declineOfferAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Transition.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Missing offer" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("talent_offers")
    .update({ talent_offer_state: "declined" })
    .eq("id", parsed.data.offer_id)
    .eq("org_id", session.orgId)
    .in("talent_offer_state", ["sent", "countered"])
    .select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "Only a sent or countered offer can be declined" };
  await notifyTalentOfTransition({
    offerId: parsed.data.offer_id,
    orgId: session.orgId,
    actorId: session.userId,
    title: "Booking Offer Declined",
    decision: "declined",
  });
  revalidatePath(`/console/marketplace/offers/${parsed.data.offer_id}`);
  return { error: undefined };
}
