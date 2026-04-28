"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  narrative: z.string().min(1).max(8000),
  subject_ref: z.string().max(200).optional().or(z.literal("")),
  status: z.string(),
});

export type State = { error?: string } | null;

export async function updateSafeguardingReport(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("safeguarding_reports")
    .update({
      narrative: parsed.data.narrative,
      subject_ref: parsed.data.subject_ref || null,
      status: parsed.data.status,
    })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/safety/safeguarding/${id}`);
  revalidatePath("/console/safety/safeguarding");
  redirect(`/console/safety/safeguarding/${id}`);
}

export async function deleteSafeguardingReport(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.from("safeguarding_reports").delete().eq("id", id).eq("org_id", session.orgId);
  revalidatePath("/console/safety/safeguarding");
  redirect("/console/safety/safeguarding");
}
