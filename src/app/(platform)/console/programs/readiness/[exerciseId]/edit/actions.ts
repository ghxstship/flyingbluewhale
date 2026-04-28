"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  name: z.string().min(1).max(200),
  kind: z.string().min(1).max(80),
  scheduled_at: z.string().optional().or(z.literal("")),
});

export type State = { error?: string } | null;

export async function updateReadinessExercise(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("readiness_exercises")
    .update({
      name: parsed.data.name,
      kind: parsed.data.kind,
      scheduled_at: parsed.data.scheduled_at || null,
    })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/programs/readiness/${id}`);
  revalidatePath("/console/programs/readiness");
  redirect(`/console/programs/readiness/${id}`);
}

export async function deleteReadinessExercise(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.from("readiness_exercises").delete().eq("id", id).eq("org_id", session.orgId);
  revalidatePath("/console/programs/readiness");
  redirect("/console/programs/readiness");
}
