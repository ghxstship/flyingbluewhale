"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";

const Schema = z.object({
  summary: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  severity: z.enum(["near_miss", "minor", "major", "critical"]),
  status: z.enum(["open", "investigating", "resolved", "closed"]),
  location: z.string().max(200).optional(),
  occurred_at: z.string().optional(),
});

export type State = { error?: string } | null;

export async function updateIncident(incidentId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("incidents", session.orgId, incidentId, expectedUpdatedAt, {
    summary: parsed.data.summary,
    description: parsed.data.description || null,
    severity: parsed.data.severity,
    status: parsed.data.status,
    location: parsed.data.location || null,
    occurred_at: parsed.data.occurred_at || undefined,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Incident not found." };
  }
  revalidatePath(`/console/operations/incidents/${incidentId}`);
  revalidatePath("/console/operations/incidents");
  redirect(`/console/operations/incidents/${incidentId}`);
}

export async function deleteIncident(incidentId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.from("incidents").delete().eq("id", incidentId).eq("org_id", session.orgId);
  revalidatePath("/console/operations/incidents");
  redirect("/console/operations/incidents");
}
