"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  description: z.string().max(500).optional().or(z.literal("")),
  started_at: z.string().min(1),
  ended_at: z.string().optional().or(z.literal("")),
  duration_minutes: z.string().optional(),
  billable: z.string().optional(),
});

export type State = { error?: string } | null;

export async function updateTimeEntry(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("time_entries")
    .update({
      description: parsed.data.description || null,
      started_at: new Date(parsed.data.started_at).toISOString(),
      ended_at: parsed.data.ended_at ? new Date(parsed.data.ended_at).toISOString() : null,
      duration_minutes: parsed.data.duration_minutes ? Number(parsed.data.duration_minutes) : null,
      billable: parsed.data.billable === "on" || parsed.data.billable === "true",
    })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/finance/time/${id}`);
  revalidatePath("/console/finance/time");
  redirect(`/console/finance/time/${id}`);
}

export async function deleteTimeEntry(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.from("time_entries").delete().eq("id", id).eq("org_id", session.orgId);
  revalidatePath("/console/finance/time");
  redirect("/console/finance/time");
}
