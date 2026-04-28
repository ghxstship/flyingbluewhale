"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  contact_email: z.string().email().optional().or(z.literal("")),
  contact_phone: z.string().max(40).optional().or(z.literal("")),
  website: z.string().max(300).optional().or(z.literal("")),
  notes: z.string().max(4000).optional().or(z.literal("")),
});

export type State = { error?: string } | null;

export async function updateClient(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({
      name: parsed.data.name,
      contact_email: parsed.data.contact_email || null,
      contact_phone: parsed.data.contact_phone || null,
      website: parsed.data.website || null,
      notes: parsed.data.notes || null,
    })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/clients/${id}`);
  revalidatePath("/console/clients");
  redirect(`/console/clients/${id}`);
}

export async function deleteClient(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.from("clients").delete().eq("id", id).eq("org_id", session.orgId);
  revalidatePath("/console/clients");
  redirect("/console/clients");
}
