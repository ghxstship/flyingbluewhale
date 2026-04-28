"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  title: z.string().min(1).max(200),
  scheduled_at: z.string().optional().or(z.literal("")),
  notes: z.string().max(4000).optional().or(z.literal("")),
});

export type State = { error?: string } | null;

export async function updateProgramReview(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("program_reviews")
    .update({
      title: parsed.data.title,
      scheduled_at: parsed.data.scheduled_at,
      notes: parsed.data.notes || null,
    })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/programs/reviews/${id}`);
  revalidatePath("/console/programs/reviews");
  redirect(`/console/programs/reviews/${id}`);
}

export async function deleteProgramReview(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.from("program_reviews").delete().eq("id", id).eq("org_id", session.orgId);
  revalidatePath("/console/programs/reviews");
  redirect("/console/programs/reviews");
}
