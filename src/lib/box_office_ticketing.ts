import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Read helpers for the GVTEWAY first-party box-office (organizer console).
 *
 * SSOT rule: the money breakdown (gross/fees/refunds/net) is NEVER recomputed
 * from raw rows — it is read from the `v_event_revenue` view via
 * `getEventRevenue`. `net = gross - fees - refunds` is derived on top of the
 * view's figures, nowhere else.
 *
 * Every helper is org-scoped (`.eq("org_id", orgId)`); RLS enforces the same
 * boundary, so these two layers agree by construction.
 */

type Client = SupabaseClient<Database>;

export type FirstPartyListing = Database["public"]["Tables"]["event_listings"]["Row"];
export type TicketType = Database["public"]["Tables"]["event_ticket_types"]["Row"];
export type RevenueOrder = Database["public"]["Tables"]["revenue_orders"]["Row"];
export type EventTicket = Database["public"]["Tables"]["event_tickets"]["Row"];
export type EventPayout = Database["public"]["Tables"]["event_payouts"]["Row"];
export type EventRevenue = Database["public"]["Views"]["v_event_revenue"]["Row"];

/** First-party event listings for the org (fulfillment = 'first_party'). */
export async function listFirstPartyListings(supabase: Client, orgId: string): Promise<FirstPartyListing[]> {
  const { data } = await supabase
    .from("event_listings")
    .select("*")
    .eq("org_id", orgId)
    .eq("fulfillment", "first_party")
    .is("deleted_at", null)
    .order("starts_at", { ascending: false, nullsFirst: false });
  return data ?? [];
}

/** A single first-party listing scoped to the org (null if not found). */
export async function getListing(supabase: Client, orgId: string, id: string): Promise<FirstPartyListing | null> {
  const { data } = await supabase
    .from("event_listings")
    .select("*")
    .eq("id", id)
    .eq("org_id", orgId)
    .eq("fulfillment", "first_party")
    .is("deleted_at", null)
    .maybeSingle();
  return data ?? null;
}

/** Ticket types for a listing, ordered for display. */
export async function listTicketTypes(supabase: Client, listingId: string): Promise<TicketType[]> {
  const { data } = await supabase
    .from("event_ticket_types")
    .select("*")
    .eq("event_listing_id", listingId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  return data ?? [];
}

/**
 * The money breakdown for a listing, read from `v_event_revenue`.
 * This is the ONLY source for gross/fees/refunds/net — pages must not
 * recompute these from orders or ticket rows.
 */
export async function getEventRevenue(
  supabase: Client,
  orgId: string,
  listingId: string,
): Promise<EventRevenue | null> {
  const { data } = await supabase
    .from("v_event_revenue")
    .select("*")
    .eq("org_id", orgId)
    .eq("event_listing_id", listingId)
    .maybeSingle();
  return data ?? null;
}

/** Revenue orders for a listing (most recent first). */
export async function listOrders(supabase: Client, orgId: string, listingId: string): Promise<RevenueOrder[]> {
  const { data } = await supabase
    .from("revenue_orders")
    .select("*")
    .eq("org_id", orgId)
    .eq("event_listing_id", listingId)
    .is("deleted_at", null)
    .order("placed_at", { ascending: false })
    .limit(500);
  return data ?? [];
}

/** Issued tickets for a listing. */
export async function listTickets(supabase: Client, listingId: string): Promise<EventTicket[]> {
  const { data } = await supabase
    .from("event_tickets")
    .select("*")
    .eq("event_listing_id", listingId)
    .is("deleted_at", null)
    .order("issued_at", { ascending: false })
    .limit(500);
  return data ?? [];
}

/** Payouts for a listing (most recent schedule first). */
export async function listPayouts(supabase: Client, orgId: string, listingId: string): Promise<EventPayout[]> {
  const { data } = await supabase
    .from("event_payouts")
    .select("*")
    .eq("org_id", orgId)
    .eq("event_listing_id", listingId)
    .order("scheduled_for", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** Net = gross - fees - refunds, derived on top of the view figures. */
export function netCentsFrom(rev: EventRevenue | null): number {
  if (!rev) return 0;
  return (rev.gross_cents ?? 0) - (rev.fees_cents ?? 0) - (rev.refunds_cents ?? 0);
}
