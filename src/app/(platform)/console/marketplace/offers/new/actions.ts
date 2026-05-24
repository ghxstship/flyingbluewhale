"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CURRENCY } from "@/lib/i18n/config";

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
    .default(DEFAULT_CURRENCY),
  deposit_pct: z.string().default("60"),
  balance_terms: z.string().default("load_in"),
});

export type State = { error?: string } | null;

export async function createOfferAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  // Booking offers commit a fee + appear on the recipient's portal —
  // manager+ at the app layer.
  if (!isManagerPlus(session)) return { error: "Only manager+ can send booking offers" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
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
      status: "draft",
      created_by: session.userId,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/console/marketplace/offers");
  redirect(`/console/marketplace/offers/${(data as { id: string }).id}`);
}

const Transition = z.object({ offer_id: z.string().uuid() });

// Offer state machine — canonical transitions:
//   draft     → sent
//   sent      → accepted | countered | declined
//   countered → accepted | declined
//
// Each action below uses .eq("status", <expected>) (or .in("status", [...]))
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
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", parsed.data.offer_id)
    .eq("org_id", session.orgId)
    .eq("status", "draft")
    .select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "Offer can't be sent from its current state" };
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
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", parsed.data.offer_id)
    .eq("org_id", session.orgId)
    .in("status", ["sent", "countered"])
    .select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "Offer can only be accepted from sent or countered" };
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
    .update({ status: "declined" })
    .eq("id", parsed.data.offer_id)
    .eq("org_id", session.orgId)
    .in("status", ["sent", "countered"])
    .select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "Only a sent or countered offer can be declined" };
  revalidatePath(`/console/marketplace/offers/${parsed.data.offer_id}`);
  return { error: undefined };
}
