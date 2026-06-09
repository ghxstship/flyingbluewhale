"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";

const Schema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  severity: z.string().max(40),
  scheduled_at: z.string().optional(),
});

export type State = { error?: string } | null;

export async function updateAlert(alertId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("crisis_alerts", session.orgId, alertId, expectedUpdatedAt, {
    title: parsed.data.title,
    body: parsed.data.body,
    severity: parsed.data.severity,
    scheduled_at: parsed.data.scheduled_at || null,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Crisis Alert not found." };
  }
  revalidatePath(`/console/safety/crisis/${alertId}`);
  revalidatePath("/console/safety/crisis");
  redirect(`/console/safety/crisis/${alertId}`);
}

export async function deleteAlert(alertId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.from("crisis_alerts").delete().eq("id", alertId).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete crisis alert: ${error.message}`);
  revalidatePath("/console/safety/crisis");
  redirect("/console/safety/crisis");
}
