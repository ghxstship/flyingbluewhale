"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  topic: z.string().min(1).max(200),
  project_id: z.string().uuid().optional().or(z.literal("")),
  scheduled_for: z.string(),
  notes: z.string().max(2000).optional(),
});

export type State = { error?: string } | null;

export async function createBriefing(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("safety_briefings")
    .insert({
      org_id: session.orgId,
      topic: parsed.data.topic,
      project_id: parsed.data.project_id || null,
      scheduled_for: parsed.data.scheduled_for,
      notes: parsed.data.notes || null,
      briefer_id: session.userId,
      created_by: session.userId,
    } as never)
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/console/safety/briefings");
  redirect(`/console/safety/briefings/${data.id}`);
}
