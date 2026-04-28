"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  name: z.string().min(1).max(200),
  channel: z.string().min(1).max(80),
  price_cents: z.string().optional(),
  currency: z.string().min(1).max(3),
  allocation: z.string().optional(),
});

export type State = { error?: string } | null;

export async function updateTicketType(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("ticket_types")
    .update({
      name: parsed.data.name,
      channel: parsed.data.channel,
      price_cents: parsed.data.price_cents ? Number(parsed.data.price_cents) : 0,
      currency: parsed.data.currency,
      allocation: parsed.data.allocation ? Number(parsed.data.allocation) : 0,
    })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/commercial/tickets/${id}`);
  revalidatePath("/console/commercial/tickets");
  redirect(`/console/commercial/tickets/${id}`);
}

export async function deleteTicketType(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.from("ticket_types").delete().eq("id", id).eq("org_id", session.orgId);
  revalidatePath("/console/commercial/tickets");
  redirect("/console/commercial/tickets");
}
