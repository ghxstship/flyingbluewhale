"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  name: z.string().min(1).max(160),
  channel: z.string().max(40).optional(),
  price_cents: z.coerce.number().int().min(0).max(1_000_000_000).default(0),
  currency: z.string().min(3).max(3).default("USD"),
  allocation: z.coerce.number().int().min(0).max(10_000_000).default(0),
});

export type State = { error?: string } | null;

export async function createTicketType(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ticket_types")
    .insert({
      org_id: session.orgId,
      name: parsed.data.name,
      channel: parsed.data.channel || "public",
      price_cents: parsed.data.price_cents,
      currency: parsed.data.currency.toUpperCase(),
      allocation: parsed.data.allocation,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/console/commercial/tickets");
  redirect(`/console/commercial/tickets/${data.id}`);
}
