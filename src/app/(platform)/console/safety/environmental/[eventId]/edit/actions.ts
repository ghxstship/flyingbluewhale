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
  // Hard delete — environmental_events has no deleted_at column. The
  // earlier soft-delete attempt was based on a flawed grep that
  // misattributed deleted_at to this table; the schema confirms no
  // such column exists. If retention requirements change, the right
  // fix is a migration to ADD deleted_at first, then switch behavior.
  const { error } = await supabase.from("environmental_events").delete().eq("id", eventId).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete environmental event: ${error.message}`);
  revalidatePath("/console/safety/environmental");
  redirect("/console/safety/environmental");
}
