"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { formFail } from "@/lib/forms/fail";

const Schema = z.object({
  description: z.string().max(500).optional().or(z.literal("")),
  started_at: z.string().min(1),
  ended_at: z.string().optional().or(z.literal("")),
  duration_minutes: z.string().optional(),
  billable: z.string().optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateTimeEntry(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("time_entries", session.orgId, id, expectedUpdatedAt, {
    description: parsed.data.description || null,
    started_at: new Date(parsed.data.started_at).toISOString(),
    ended_at: parsed.data.ended_at ? new Date(parsed.data.ended_at).toISOString() : null,
    duration_minutes: parsed.data.duration_minutes ? Number(parsed.data.duration_minutes) : null,
    billable: parsed.data.billable === "on" || parsed.data.billable === "true",
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Time Entrie not found." };
  }
  revalidatePath(`/studio/finance/time/${id}`);
  revalidatePath("/studio/finance/time");
  redirect(`/studio/finance/time/${id}`);
}

export async function deleteTimeEntry(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.from("time_entries").delete().eq("id", id).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete time entry: ${error.message}`);
  revalidatePath("/studio/finance/time");
  redirect("/studio/finance/time");
}
