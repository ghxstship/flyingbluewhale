"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(4000).optional().or(z.literal("")),
  starts_at: z.string().optional().or(z.literal("")),
  ends_at: z.string().optional().or(z.literal("")),
  status: z.string(),
});

export type State = { error?: string } | null;

export async function updateMeeting(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      starts_at: parsed.data.starts_at,
      ends_at: parsed.data.ends_at,
      status: parsed.data.status as "draft" | "scheduled" | "live" | "complete" | "cancelled",
    })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/meetings/${id}`);
  revalidatePath("/console/meetings");
  redirect(`/console/meetings/${id}`);
}

export async function deleteMeeting(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.from("events").delete().eq("id", id).eq("org_id", session.orgId);
  revalidatePath("/console/meetings");
  redirect("/console/meetings");
}
