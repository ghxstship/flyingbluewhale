"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().min(1).max(80),
  description: z.string().max(2000).optional().or(z.literal("")),
  unit_price_cents: z.string().optional(),
  currency: z.string().min(1).max(3),
});

export type State = { error?: string } | null;

export async function updateHospitalityPackage(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("rate_card_items")
    .update({
      name: parsed.data.name,
      sku: parsed.data.sku,
      description: parsed.data.description || null,
      unit_price_cents: parsed.data.unit_price_cents ? Number(parsed.data.unit_price_cents) : 0,
      currency: parsed.data.currency,
    })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/commercial/hospitality/${id}`);
  revalidatePath("/console/commercial/hospitality");
  redirect(`/console/commercial/hospitality/${id}`);
}

export async function deleteHospitalityPackage(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.from("rate_card_items").delete().eq("id", id).eq("org_id", session.orgId);
  revalidatePath("/console/commercial/hospitality");
  redirect("/console/commercial/hospitality");
}
