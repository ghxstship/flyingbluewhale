"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(40),
  country: z.string().max(120).optional().or(z.literal("")),
  contact_email: z.string().email().optional().or(z.literal("")),
  contact_phone: z.string().max(40).optional().or(z.literal("")),
});

export type State = { error?: string } | null;

export async function updateDelegation(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("delegations")
    .update({
      name: parsed.data.name,
      code: parsed.data.code,
      country: parsed.data.country || null,
      contact_email: parsed.data.contact_email || null,
      contact_phone: parsed.data.contact_phone || null,
    })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/participants/delegations/${id}`);
  revalidatePath("/console/participants/delegations");
  redirect(`/console/participants/delegations/${id}`);
}

export async function deleteDelegation(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.from("delegations").delete().eq("id", id).eq("org_id", session.orgId);
  revalidatePath("/console/participants/delegations");
  redirect("/console/participants/delegations");
}
