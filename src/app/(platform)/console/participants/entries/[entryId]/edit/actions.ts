"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { formFail } from "@/lib/forms/fail";

const Schema = z.object({
  participant_name: z.string().min(1).max(200),
  discipline: z.string().max(120).optional(),
  event: z.string().max(120).optional(),
  entry_state: z.string().max(40).optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateEntry(entryId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("delegation_entries", session.orgId, entryId, expectedUpdatedAt, {
    participant_name: parsed.data.participant_name,
    discipline: parsed.data.discipline || null,
    event: parsed.data.event || null,
    entry_state: parsed.data.entry_state || "nominated",
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Delegation Entrie not found." };
  }
  revalidatePath(`/console/participants/entries/${entryId}`);
  revalidatePath("/console/participants/entries");
  redirect(`/console/participants/entries/${entryId}`);
}

export async function deleteEntry(entryId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.from("delegation_entries").delete().eq("id", entryId).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete delegation entry: ${error.message}`);
  revalidatePath("/console/participants/entries");
  redirect("/console/participants/entries");
}
