"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  name: z.string().min(1).max(200),
  day_of: z.string().optional().or(z.literal("")),
  state: z.string(),
});

export type State = { error?: string } | null;

export async function updateRoster(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("rosters")
    .update({
      name: parsed.data.name,
      day_of: parsed.data.day_of,
      state: parsed.data.state as "draft" | "published" | "locked",
    })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/workforce/rosters/${id}`);
  revalidatePath("/console/workforce/rosters");
  redirect(`/console/workforce/rosters/${id}`);
}

export async function deleteRoster(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.from("rosters").delete().eq("id", id).eq("org_id", session.orgId);
  revalidatePath("/console/workforce/rosters");
  redirect("/console/workforce/rosters");
}
