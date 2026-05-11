"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  offer_id: z.string().uuid(),
  partner_name: z.string().min(1).max(200),
  partner_org_id: z.string().uuid().optional().or(z.literal("")),
  split_pct: z.string().min(1),
  bonus_terms: z.string().max(2000).optional().or(z.literal("")),
  contact_email: z.string().email().optional().or(z.literal("")),
});

export type State = { error?: string; ok?: true } | null;

export async function addCoProPartnerAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  // Co-pro splits divide deal revenue between orgs — manager+ only.
  if (!isManagerPlus(session)) return { error: "Only manager+ can edit co-pro partnerships" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const split = Math.min(100, Math.max(0, Number(parsed.data.split_pct)));
  if (!Number.isFinite(split)) return { error: "Invalid split %" };

  // Cross-tenant FK guard on offer_id (talent_offers is org-scoped).
  // partner_org_id is intentionally a different org (cross-org partnership)
  // — do NOT scope it to session.orgId.
  const { data: offer } = await supabase
    .from("talent_offers")
    .select("id")
    .eq("id", parsed.data.offer_id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!offer) return { error: "Deal not found in your organization" };

  // Total split sanity — reject if cumulative > 100%.
  const existingResp = await supabase
    .from("co_pro_partnerships")
    .select("split_pct")
    .eq("talent_offer_id", parsed.data.offer_id)
    .eq("org_id", session.orgId);
  const existing = ((existingResp.data ?? []) as Array<{ split_pct: number }>).reduce(
    (s, r) => s + Number(r.split_pct ?? 0),
    0,
  );
  if (existing + split > 100) {
    return { error: `Cumulative split would exceed 100% (currently ${existing}%)` };
  }

  const { error } = await supabase.from("co_pro_partnerships").insert({
    org_id: session.orgId,
    talent_offer_id: parsed.data.offer_id,
    partner_org_id: parsed.data.partner_org_id || null,
    partner_name: parsed.data.partner_name,
    split_pct: split,
    bonus_terms: parsed.data.bonus_terms || null,
    contact_email: parsed.data.contact_email || null,
  });
  if (error) return { error: error.message };
  revalidatePath(`/console/bookings/deals/${parsed.data.offer_id}`);
  return { ok: true };
}

export async function removeCoProPartnerAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can edit co-pro partnerships" };
  const id = String(fd.get("partnership_id") ?? "");
  const offerId = String(fd.get("offer_id") ?? "");
  if (!id) return { error: "Missing partnership" };
  const supabase = await createClient();
  const { error } = await supabase.from("co_pro_partnerships").delete().eq("id", id).eq("org_id", session.orgId);
  if (error) return { error: error.message };
  if (offerId) revalidatePath(`/console/bookings/deals/${offerId}`);
  return { ok: true };
}
