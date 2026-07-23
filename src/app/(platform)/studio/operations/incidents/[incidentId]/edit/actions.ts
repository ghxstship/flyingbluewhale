"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z.object({
  summary: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  severity: z.enum(["near_miss", "minor", "major", "critical"]),
  incident_state: z.enum(["open", "investigating", "resolved", "closed"]),
  location: z.string().max(200).optional(),
  occurred_at: z.string().optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateIncident(incidentId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("incidents", session.orgId, incidentId, expectedUpdatedAt, {
    summary: parsed.data.summary,
    description: parsed.data.description || null,
    severity: parsed.data.severity,
    incident_state: parsed.data.incident_state,
    location: parsed.data.location || null,
    occurred_at: parsed.data.occurred_at || undefined,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : actionErrorMessage("not-found.incident-2", "Incident not found.") };
  }
  revalidatePath(`/studio/operations/incidents/${incidentId}`);
  revalidatePath("/studio/operations/incidents");
  redirect(`/studio/operations/incidents/${incidentId}`);
}

export async function deleteIncident(incidentId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  // SOFT delete (A-21) — `incidents` is in SOFT_DELETABLE_TABLES; preserves
  // the record for Trash/undo and keeps safety history intact. The
  // .is("deleted_at", null) filter makes the action idempotent.
  const { error } = await supabase
    .from("incidents")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", incidentId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (error) throw new Error(`Could not delete incident: ${error.message}`);
  revalidatePath("/studio/operations/incidents");
  // No redirect — DeleteForm's undo flow navigates client-side after
  // showing the "Deleted" toast with its Undo action (REC-14).
}
