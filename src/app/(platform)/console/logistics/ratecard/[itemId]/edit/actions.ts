"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";

const Schema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().min(1).max(80),
  description: z.string().max(2000).optional().or(z.literal("")),
  unit_price_cents: z.string().optional(),
  currency: z.string().min(1).max(3),
  catalog: z.string().min(1).max(80),
});

export type State = { error?: string } | null;

export async function updateRateCardItem(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("rate_card_items", session.orgId, id, expectedUpdatedAt, {
    name: parsed.data.name,
    sku: parsed.data.sku,
    description: parsed.data.description || null,
    unit_price_cents: parsed.data.unit_price_cents ? Number(parsed.data.unit_price_cents) : 0,
    currency: parsed.data.currency,
    catalog: parsed.data.catalog,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Rate Card Item not found." };
  }
  revalidatePath(`/console/logistics/ratecard/${id}`);
  revalidatePath("/console/logistics/ratecard");
  redirect(`/console/logistics/ratecard/${id}`);
}

export async function deleteRateCardItem(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.from("rate_card_items").delete().eq("id", id).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete rate card item: ${error.message}`);
  revalidatePath("/console/logistics/ratecard");
  redirect("/console/logistics/ratecard");
}
