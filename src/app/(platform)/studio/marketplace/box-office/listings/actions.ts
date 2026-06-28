"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import { dollarsToCents } from "@/lib/format";

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

// ── create ticket type ──────────────────────────────────────────────
const TicketTypeSchema = z.object({
  event_listing_id: z.string().uuid(),
  name: z.string().min(1).max(160),
  price: z.string().min(1).max(24),
  quantity_total: z.coerce.number().int().min(0).max(1_000_000).default(0),
  seating_zone: z.string().max(120).optional().or(z.literal("")),
});

export async function createTicketTypeAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can add ticket types" };
  const parsed = TicketTypeSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  // Confirm the listing belongs to the caller's org before inserting under it.
  const { data: listing } = await supabase
    .from("event_listings")
    .select("id")
    .eq("id", parsed.data.event_listing_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!listing) return { error: "Event listing not found" };

  const { error } = await supabase.from("event_ticket_types").insert({
    org_id: session.orgId,
    event_listing_id: parsed.data.event_listing_id,
    name: parsed.data.name,
    price_cents: dollarsToCents(parsed.data.price),
    quantity_total: parsed.data.quantity_total,
    currency: "usd",
    seating_zone: parsed.data.seating_zone || null,
  });

  if (error) return actionFail(error.message, fd);
  revalidatePath(`/studio/marketplace/box-office/listings/${parsed.data.event_listing_id}`);
  return { ok: true };
}
