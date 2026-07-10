"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { httpFetch } from "@/lib/http";
import { formFail } from "@/lib/forms/fail";

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

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function upsertSettlementAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  // Show settlement records BO numbers + payouts — manager+ only.
  if (!isManagerPlus(session)) return { error: "Only manager+ can edit settlement records" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  // Cross-tenant FK guard on offer_id (talent_offers is the FK target).
  const { data: offer } = await supabase
    .from("talent_offers")
    .select("id")
    .eq("id", parsed.data.offer_id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!offer) return { error: "Deal not found in your organization" };

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

  // Upsert by talent_offer_id — one settlement per deal. onConflict resolves
  // against the settlements_talent_offer_id_key UNIQUE constraint (migration
  // 20260606150000), so concurrent saves collapse onto one row instead of
  // accumulating duplicates (which then blanked the detail page's .maybeSingle()
  // read). `status` is intentionally omitted: new rows take the DB default
  // 'draft', and existing rows keep their state — a re-save must not un-finalize
  // a settled deal.
  const { error } = await supabase.from("settlements").upsert(payload, { onConflict: "talent_offer_id" });
  if (error) return { error: error.message };

  revalidatePath(`/studio/bookings/deals/${parsed.data.offer_id}/settlement`);
  revalidatePath("/studio/bookings/settlements");
  return { ok: true };
}

export async function finalizeSettlementAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  // Finalize fires the Stripe transfer — manager+ only.
  if (!isManagerPlus(session)) return { error: "Only manager+ can finalize settlements" };
  const offerId = String(fd.get("offer_id") ?? "");
  if (!offerId) return { error: "Missing deal" };
  const supabase = await createClient();

  // Read settlement to inspect payout destination + balance + currency.
  // Status is read so we can refuse a re-finalize before firing the Stripe
  // transfer — Stripe's Idempotency-Key dedups the network call but won't
  // stop us re-running our own post-transfer side-effects on a stale form.
  const settlementResp = await supabase
    .from("settlements")
    .select("id, settlement_state, balance_due_cents, payout_destination, currency, stripe_transfer_id")
    .eq("talent_offer_id", offerId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!settlementResp.data) return { error: "Settlement not found" };
  const s = settlementResp.data as {
    id: string;
    settlement_state: string;
    balance_due_cents: number;
    payout_destination: string | null;
    currency: string;
    stripe_transfer_id: string | null;
  };
  if (s.settlement_state === "final") return { error: "Settlement already final" };

  // Stripe Connect transfer — only fire when:
  //   1. STRIPE_SECRET_KEY is configured (graceful no-op locally)
  //   2. settlement has payout_destination (Connect account id)
  //   3. balance_due_cents > 0
  //   4. no transfer already exists (idempotency at the action level)
  let stripeTransferId: string | null = s.stripe_transfer_id;
  if (env.STRIPE_SECRET_KEY && s.payout_destination && s.balance_due_cents > 0 && !s.stripe_transfer_id) {
    const form = new URLSearchParams();
    form.set("amount", String(s.balance_due_cents));
    form.set("currency", s.currency.toLowerCase());
    form.set("destination", s.payout_destination);
    form.set("transfer_group", `settlement:${s.id}`);
    const res = await httpFetch("https://api.stripe.com/v1/transfers", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        "content-type": "application/x-www-form-urlencoded",
        // Idempotency-Key prevents double-pay on retried clicks.
        "Idempotency-Key": `settlement:${s.id}:transfer`,
      },
      body: form.toString(),
      timeoutMs: 15000,
    });
    if (!res.ok) {
      const text = await res.text();
      return { error: `Stripe transfer failed: ${text.slice(0, 200)}` };
    }
    const transfer = (await res.json()) as { id: string };
    stripeTransferId = transfer.id;
  }

  // Conditional update: only land if status is still what we observed.
  // Without it, a concurrent finalize that beat us to the row would get
  // silently overwritten and we'd lose its finalized_by attribution.
  const { data: updated, error } = await supabase
    .from("settlements")
    .update({
      settlement_state: "final",
      finalized_at: new Date().toISOString(),
      finalized_by: session.userId,
      stripe_transfer_id: stripeTransferId,
    })
    .eq("talent_offer_id", offerId)
    .eq("org_id", session.orgId)
    .eq("settlement_state", s.settlement_state as "draft")
    .select("id");
  if (error) return { error: error.message };
  if (!updated || updated.length === 0) {
    return { error: "Settlement was finalized concurrently. Refresh and retry" };
  }
  revalidatePath(`/studio/bookings/deals/${offerId}/settlement`);
  return { ok: true };
}
