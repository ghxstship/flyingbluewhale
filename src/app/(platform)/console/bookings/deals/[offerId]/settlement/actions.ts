"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

const NumStr = z.string().optional().or(z.literal(""));
const toCents = (v: string | undefined): number => {
  if (!v) return 0;
  const n = Number(v.replace(/[$,]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0;
};
const toInt = (v: string | undefined): number => {
  if (!v) return 0;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
};

const Schema = z.object({
  offer_id: z.string().uuid(),
  show_date: z.string().min(1),
  gross_box_office: NumStr,
  sales_tax: NumStr,
  amusement_tax: NumStr,
  cc_fee: NumStr,
  paid_attendance: NumStr,
  comp_count: NumStr,
  walkout_count: NumStr,
  bar_revenue: NumStr,
  merch_revenue: NumStr,
  other_revenue: NumStr,
  artist_payout: NumStr,
  agent_commission: NumStr,
  support_act_payout: NumStr,
  deposit_received: NumStr,
});

export type State = { error?: string; ok?: true } | null;

export async function upsertSettlementAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const payload = {
    org_id: session.orgId,
    talent_offer_id: parsed.data.offer_id,
    show_date: parsed.data.show_date,
    gross_box_office_cents: toCents(parsed.data.gross_box_office),
    sales_tax_cents: toCents(parsed.data.sales_tax),
    amusement_tax_cents: toCents(parsed.data.amusement_tax),
    cc_fee_cents: toCents(parsed.data.cc_fee),
    paid_attendance: toInt(parsed.data.paid_attendance),
    comp_count: toInt(parsed.data.comp_count),
    walkout_count: toInt(parsed.data.walkout_count),
    bar_revenue_cents: toCents(parsed.data.bar_revenue),
    merch_revenue_cents: toCents(parsed.data.merch_revenue),
    other_revenue_cents: toCents(parsed.data.other_revenue),
    artist_payout_cents: toCents(parsed.data.artist_payout),
    agent_commission_cents: toCents(parsed.data.agent_commission),
    support_act_payout_cents: toCents(parsed.data.support_act_payout),
    deposit_received_cents: toCents(parsed.data.deposit_received),
  };

  // Upsert by talent_offer_id — one settlement per deal.
  const existing = await supabase
    .from("settlements")
    .select("id")
    .eq("talent_offer_id", parsed.data.offer_id)
    .eq("org_id", session.orgId)
    .maybeSingle();

  if (existing.data) {
    const { error } = await supabase
      .from("settlements")
      .update(payload)
      .eq("id", (existing.data as { id: string }).id)
      .eq("org_id", session.orgId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("settlements").insert({ ...payload, status: "draft" });
    if (error) return { error: error.message };
  }

  revalidatePath(`/console/bookings/deals/${parsed.data.offer_id}/settlement`);
  revalidatePath("/console/bookings/settlements");
  return { ok: true };
}

export async function finalizeSettlementAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const offerId = String(fd.get("offer_id") ?? "");
  if (!offerId) return { error: "Missing deal" };
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { error } = await supabase
    .from("settlements")
    .update({ status: "final", finalized_at: new Date().toISOString(), finalized_by: session.userId })
    .eq("talent_offer_id", offerId)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/bookings/deals/${offerId}/settlement`);
  return { ok: true };
}
