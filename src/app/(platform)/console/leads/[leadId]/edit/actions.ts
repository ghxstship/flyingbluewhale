"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  source: z.string().max(120).optional().or(z.literal("")),
  estimated_value_cents: z.string().optional(),
  notes: z.string().max(4000).optional().or(z.literal("")),
});

export type State = { error?: string } | null;

export async function updateLead(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      source: parsed.data.source || null,
      estimated_value_cents: parsed.data.estimated_value_cents
        ? Math.round(Number(parsed.data.estimated_value_cents))
        : null,
      notes: parsed.data.notes || null,
    })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/leads/${id}`);
  revalidatePath("/console/leads");
  redirect(`/console/leads/${id}`);
}

export async function deleteLead(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.from("leads").delete().eq("id", id).eq("org_id", session.orgId);
  revalidatePath("/console/leads");
  redirect("/console/leads");
}
