"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const StatusSchema = z.enum(["open", "investigating", "resolved", "closed"]);

export type IncidentStatus = z.infer<typeof StatusSchema>;

/**
 * Update an incident's status only — used by the Kanban board's onMove
 * handler. Org-scoped via the session.
 */
export async function setIncidentStatus(id: string, to: IncidentStatus): Promise<void> {
  const parsed = StatusSchema.safeParse(to);
  if (!parsed.success) throw new Error("Invalid incident status");
  const session = await requireSession();
  const supabase = await createClient();
  const patch: Record<string, unknown> = { status: parsed.data };
  if (parsed.data === "closed") {
    patch.closed_at = new Date().toISOString();
  }
  const { error } = await supabase
    .from("incidents")
    .update(patch as never)
    .eq("org_id", session.orgId)
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/console/operations/incidents");
}
