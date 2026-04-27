"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  name: z.string().min(1).max(200),
  property: z.string().min(1).max(200),
  city: z.string().max(120).optional().or(z.literal("")),
  stakeholder_group: z.string().max(120).optional().or(z.literal("")),
  rooms_reserved: z.string().optional(),
  rooms_confirmed: z.string().optional(),
  starts_on: z.string().optional().or(z.literal("")),
  ends_on: z.string().optional().or(z.literal("")),
});

export type State = { error?: string } | null;

export async function updateBlock(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("accommodation_blocks")
    .update({
      name: parsed.data.name,
      property: parsed.data.property,
      city: parsed.data.city || null,
      stakeholder_group: parsed.data.stakeholder_group || null,
      rooms_reserved: parsed.data.rooms_reserved ? Math.max(0, parseInt(parsed.data.rooms_reserved)) : 0,
      rooms_confirmed: parsed.data.rooms_confirmed ? Math.max(0, parseInt(parsed.data.rooms_confirmed)) : 0,
      starts_on: parsed.data.starts_on || null,
      ends_on: parsed.data.ends_on || null,
    })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/accommodation/blocks/${id}`);
  revalidatePath("/console/accommodation/blocks");
  redirect(`/console/accommodation/blocks/${id}`);
}

export async function deleteBlock(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.from("accommodation_blocks").delete().eq("id", id).eq("org_id", session.orgId);
  revalidatePath("/console/accommodation/blocks");
  redirect("/console/accommodation/blocks");
}
