"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  name: z.string().min(1).max(200),
  role: z.string().max(120).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  day_rate_cents: z.string().optional(),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export type State = { error?: string } | null;

export async function updateCrewMember(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("crew_members")
    .update({
      name: parsed.data.name,
      role: parsed.data.role || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      day_rate_cents: parsed.data.day_rate_cents ? Number(parsed.data.day_rate_cents) : null,
      notes: parsed.data.notes || null,
    })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/people/crew/${id}`);
  revalidatePath("/console/people/crew");
  redirect(`/console/people/crew/${id}`);
}

export async function deleteCrewMember(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.from("crew_members").delete().eq("id", id).eq("org_id", session.orgId);
  revalidatePath("/console/people/crew");
  redirect("/console/people/crew");
}
