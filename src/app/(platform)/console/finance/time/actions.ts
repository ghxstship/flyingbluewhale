"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  started_at: z.string().min(1),
  ended_at: z.string().optional().or(z.literal("")),
  description: z.string().max(500).optional(),
  project_id: z.string().uuid().optional().or(z.literal("")),
  billable: z.string().optional(),
});

export type State = { error?: string } | null;

export async function createTimeEntryAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid" };
  const supabase = await createClient();
  const started = new Date(parsed.data.started_at);
  const ended = parsed.data.ended_at ? new Date(parsed.data.ended_at) : null;
  const duration = ended ? Math.max(0, Math.round((ended.getTime() - started.getTime()) / 60000)) : null;
  const { error } = await supabase.from("time_entries").insert({
    org_id: session.orgId, user_id: session.userId,
    started_at: started.toISOString(),
    ended_at: ended?.toISOString() ?? null,
    duration_minutes: duration,
    description: parsed.data.description || null,
    project_id: parsed.data.project_id || null,
    billable: parsed.data.billable === "on",
  });
  if (error) return { error: error.message };
  revalidatePath("/console/finance/time");
  redirect("/console/finance/time");
}
