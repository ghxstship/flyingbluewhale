"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";

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
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("ticket_types", session.orgId, id, expectedUpdatedAt, {
    name: parsed.data.name,
    channel: parsed.data.channel,
    price_cents: parsed.data.price_cents ? Number(parsed.data.price_cents) : 0,
    currency: parsed.data.currency,
    allocation: parsed.data.allocation ? Number(parsed.data.allocation) : 0,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Ticket Type not found." };
  }
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
