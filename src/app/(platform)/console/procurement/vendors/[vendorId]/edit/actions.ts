"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  name: z.string().min(1).max(200),
  category: z.string().max(120).optional().or(z.literal("")),
  contact_email: z.string().email().optional().or(z.literal("")),
  contact_phone: z.string().max(40).optional().or(z.literal("")),
  coi_expires_at: z.string().optional().or(z.literal("")),
  notes: z.string().max(4000).optional().or(z.literal("")),
});

export type State = { error?: string } | null;

export async function updateVendor(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("vendors")
    .update({
      name: parsed.data.name,
      category: parsed.data.category || null,
      contact_email: parsed.data.contact_email || null,
      contact_phone: parsed.data.contact_phone || null,
      coi_expires_at: parsed.data.coi_expires_at || null,
      notes: parsed.data.notes || null,
    })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/procurement/vendors/${id}`);
  revalidatePath("/console/procurement/vendors");
  redirect(`/console/procurement/vendors/${id}`);
}

export async function deleteVendor(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.from("vendors").delete().eq("id", id).eq("org_id", session.orgId);
  revalidatePath("/console/procurement/vendors");
  redirect("/console/procurement/vendors");
}
