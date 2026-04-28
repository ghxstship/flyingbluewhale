"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().max(120).optional().or(z.literal("")),
  asset_tag: z.string().max(80).optional().or(z.literal("")),
  serial: z.string().max(120).optional().or(z.literal("")),
  daily_rate_cents: z.string().optional(),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export type State = { error?: string } | null;

export async function updateEquipment(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("equipment")
    .update({
      name: parsed.data.name,
      category: parsed.data.category || null,
      asset_tag: parsed.data.asset_tag || null,
      serial: parsed.data.serial || null,
      daily_rate_cents: parsed.data.daily_rate_cents ? Number(parsed.data.daily_rate_cents) : null,
      notes: parsed.data.notes || null,
    })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/production/equipment/${id}`);
  revalidatePath("/console/production/equipment");
  redirect(`/console/production/equipment/${id}`);
}
