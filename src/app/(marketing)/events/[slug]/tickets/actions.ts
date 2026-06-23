"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { httpFetch } from "@/lib/http";
import { urlFor } from "@/lib/urls";
import type { LooseSupabase } from "@/lib/supabase/loose";

export type State = { error?: string; ok?: true } | null;

function svc(): LooseSupabase {
  return createServiceClient() as unknown as LooseSupabase;
}

type TicketTypeRow = {
  id: string;
  org_id: string;
  name: string;
  price_cents: number;
  currency: string;
  sales_state: string;
  event_listing_id: string;
};

/**
 * Buy tickets — reuses the store/cart Stripe Checkout Sessions pattern
 * (src/app/(marketing)/marketplace/store/actions.ts:startCheckout): builds line
 * items from the selected ticket types, records a pending revenue_orders row,
 * creates a hosted Checkout session, and redirects. The Stripe webhook flips
 * the order to paid (payment_intent.succeeded).
 */
export async function buyTicketsAction(_: State, fd: FormData): Promise<State> {
  if (!env.STRIPE_SECRET_KEY) return { error: "Ticketing checkout is not configured." };

  const slug = String(fd.get("slug") ?? "");
  const buyerEmail = z.string().email().safeParse(fd.get("buyer_email"));
  if (!slug) return { error: "Missing event." };
  if (!buyerEmail.success) return { error: "Enter a valid email." };

  const supabase = svc();
  const { data: listing } = await supabase
    .from("event_listings")
    .select("id, org_id, title, slug")
    .eq("slug", slug)
    .eq("listing_state", "published")
    .maybeSingle();
  if (!listing) return { error: "This event is not available." };
  const lst = listing as { id: string; org_id: string; title: string; slug: string };

  const { data: ticketData } = await supabase
    .from("event_ticket_types")
    .select("id, org_id, name, price_cents, currency, sales_state, event_listing_id")
    .eq("event_listing_id", lst.id)
    .is("deleted_at", null);
  const ticketTypes = (ticketData ?? []) as TicketTypeRow[];

  // Authoritative line items from server-side prices; quantities from the form.
  const lines = ticketTypes
    .map((tt) => {
      const qty = Number(fd.get(`qty_${tt.id}`) ?? 0);
      return { tt, qty: Number.isFinite(qty) ? Math.max(0, Math.min(20, Math.trunc(qty))) : 0 };
    })
    .filter((l) => l.qty > 0 && l.tt.sales_state === "on_sale");

  if (lines.length === 0) return { error: "Select at least one ticket." };

  const currency = lines[0]!.tt.currency || "usd";
  const subtotal = lines.reduce((sum, l) => sum + l.tt.price_cents * l.qty, 0);

  // Pending order — the webhook converts it on payment success.
  const { data: order } = await supabase
    .from("revenue_orders")
    .insert({
      org_id: lst.org_id,
      order_source: "box_office",
      reference: `TIX-${lst.slug}`,
      buyer_email: buyerEmail.data,
      subtotal_cents: subtotal,
      total_cents: subtotal,
      currency,
      order_state: "pending",
      event_listing_id: lst.id,
    })
    .select("id")
    .single();
  const orderId = (order as { id: string } | null)?.id ?? "";

  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("customer_email", buyerEmail.data);
  lines.forEach((line, i) => {
    form.set(`line_items[${i}][quantity]`, String(line.qty));
    form.set(`line_items[${i}][price_data][currency]`, currency.toLowerCase());
    form.set(`line_items[${i}][price_data][product_data][name]`, `${lst.title} — ${line.tt.name}`);
    form.set(`line_items[${i}][price_data][unit_amount]`, String(line.tt.price_cents));
  });
  form.set("success_url", urlFor("marketing", `/events/${lst.slug}/tickets?checkout=success`));
  form.set("cancel_url", urlFor("marketing", `/events/${lst.slug}/tickets?checkout=cancelled`));
  form.set("metadata[revenue_order_id]", orderId);
  form.set("metadata[org_id]", lst.org_id);

  const res = await httpFetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
    timeoutMs: 10000,
  });
  if (!res.ok) return { error: "Could not start checkout. Please try again." };
  const session = (await res.json()) as { id: string; url: string };

  if (orderId) {
    await supabase.from("revenue_orders").update({ checkout_session_id: session.id }).eq("id", orderId);
  }
  redirect(session.url);
}
