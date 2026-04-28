"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  person_name: z.string().min(1).max(200),
  person_email: z.string().email().optional().or(z.literal("")),
  vetting: z.string(),
  valid_from: z.string().optional().or(z.literal("")),
  valid_to: z.string().optional().or(z.literal("")),
});

export type State = { error?: string } | null;

export async function updateVettingApp(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("accreditations")
    .update({
      person_name: parsed.data.person_name,
      person_email: parsed.data.person_email || null,
      vetting: parsed.data.vetting as "pending" | "in_progress" | "clear" | "flagged" | "failed",
      valid_from: parsed.data.valid_from || null,
      valid_to: parsed.data.valid_to || null,
    })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/accreditation/vetting/${id}`);
  revalidatePath("/console/accreditation/vetting");
  redirect(`/console/accreditation/vetting/${id}`);
}

export async function deleteVettingApp(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.from("accreditations").delete().eq("id", id).eq("org_id", session.orgId);
  revalidatePath("/console/accreditation/vetting");
  redirect("/console/accreditation/vetting");
}
