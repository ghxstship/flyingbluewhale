"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";

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
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("environmental_events", session.orgId, eventId, expectedUpdatedAt, {
    kind: parsed.data.kind,
    severity: parsed.data.severity,
    started_at: parsed.data.started_at || undefined,
    ended_at: parsed.data.ended_at || null,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Environmental Event not found." };
  }
  revalidatePath(`/console/safety/environmental/${eventId}`);
  revalidatePath("/console/safety/environmental");
  redirect(`/console/safety/environmental/${eventId}`);
}

export async function deleteEnvEvent(eventId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  // SOFT delete — environmental_events has a deleted_at column.
  // Hard delete erases compliance records that may be needed for
  // regulatory follow-up + audit. Soft-delete preserves the row;
  // .is(deleted_at, null) makes the action idempotent.
  await supabase
    .from("environmental_events")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", eventId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  revalidatePath("/console/safety/environmental");
  redirect("/console/safety/environmental");
}
