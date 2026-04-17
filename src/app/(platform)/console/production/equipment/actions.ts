"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dollarsToCents } from "@/lib/format";

const Schema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  asset_tag: z.string().optional(),
  serial: z.string().optional(),
  daily_rate: z.string().optional(),
});

export type State = { error?: string } | null;

export async function createEquipmentAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid" };
  const supabase = await createClient();
  const { error } = await supabase.from("equipment").insert({
    org_id: session.orgId,
    name: parsed.data.name,
    category: parsed.data.category || null,
    asset_tag: parsed.data.asset_tag || null,
    serial: parsed.data.serial || null,
    daily_rate_cents: parsed.data.daily_rate ? dollarsToCents(parsed.data.daily_rate) : null,
  });
  if (error) return { error: error.message };
  revalidatePath("/console/production/equipment");
  redirect("/console/production/equipment");
}
