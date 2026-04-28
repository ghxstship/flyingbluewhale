"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  kind: z.string().min(1).max(60),
  severity: z.string().min(1).max(40),
  started_at: z.string().optional(),
  ended_at: z.string().optional(),
});

export type State = { error?: string } | null;

export async function updateEnvEvent(eventId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("environmental_events")
    .update({
      kind: parsed.data.kind,
      severity: parsed.data.severity,
      started_at: parsed.data.started_at || undefined,
      ended_at: parsed.data.ended_at || null,
    })
    .eq("id", eventId)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/safety/environmental/${eventId}`);
  revalidatePath("/console/safety/environmental");
  redirect(`/console/safety/environmental/${eventId}`);
}

export async function deleteEnvEvent(eventId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.from("environmental_events").delete().eq("id", eventId).eq("org_id", session.orgId);
  revalidatePath("/console/safety/environmental");
  redirect("/console/safety/environmental");
}
