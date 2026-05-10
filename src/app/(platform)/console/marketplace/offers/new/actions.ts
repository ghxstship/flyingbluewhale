"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

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
  deposit_pct: z.string().default("60"),
  balance_terms: z.string().default("load_in"),
});

export type State = { error?: string } | null;

export async function createOfferAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const feeCents = Math.round(Number(parsed.data.fee.replace(/[$,]/g, "")) * 100);
  if (!Number.isFinite(feeCents) || feeCents <= 0) return { error: "Invalid fee" };

  const { data, error } = await supabase
    .from("talent_offers")
    .insert({
      org_id: session.orgId,
      talent_profile_id: parsed.data.talent_profile_id,
      project_id: parsed.data.project_id || null,
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

export async function sendOfferAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Transition.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Missing offer" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("talent_offers")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", parsed.data.offer_id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/marketplace/offers/${parsed.data.offer_id}`);
  return { error: undefined };
}

export async function acceptOfferAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Transition.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Missing offer" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("talent_offers")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", parsed.data.offer_id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/marketplace/offers/${parsed.data.offer_id}`);
  return { error: undefined };
}

export async function declineOfferAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Transition.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Missing offer" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("talent_offers")
    .update({ status: "declined" })
    .eq("id", parsed.data.offer_id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/marketplace/offers/${parsed.data.offer_id}`);
  return { error: undefined };
}
