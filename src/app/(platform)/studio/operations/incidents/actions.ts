"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const StatusSchema = z.enum(["open", "investigating", "resolved", "closed"]);

export type IncidentStatus = z.infer<typeof StatusSchema>;

// Incident FSM: open → investigating → resolved → closed. Re-opening
// from resolved/closed back to investigating is operationally common
// (incident pops back up). Closed is terminal.
const INCIDENT_TRANSITIONS: Record<IncidentStatus, readonly IncidentStatus[]> = {
  open: ["investigating", "resolved", "closed"],
  investigating: ["open", "resolved", "closed"],
  resolved: ["investigating", "closed"],
  closed: [],
};

/**
 * Update an incident's status only — used by the Kanban board's onMove
 * handler. Org-scoped via the session.
 */
export async function setIncidentStatus(id: string, to: IncidentStatus): Promise<void> {
  const parsed = StatusSchema.safeParse(to);
  if (!parsed.success) throw new Error("Invalid incident status");
  const session = await requireSession();
  const supabase = await createClient();

  // Read current incident_state so we can validate the transition AND scope the
  // conditional update — Kanban drag-drop is the canonical
  // double-trigger path and we don't want a stale board to "re-open" an
  // incident that ops already closed.
  const { data: row } = await supabase
    .from("incidents")
    .select("incident_state")
    .eq("org_id", session.orgId)
    .eq("id", id)
    .maybeSingle();
  if (!row) throw new Error("Incident not found");
  const current = (row as { incident_state: IncidentStatus }).incident_state;
  const allowed = INCIDENT_TRANSITIONS[current] ?? [];
  if (current !== parsed.data && !allowed.includes(parsed.data)) {
    throw new Error(`Cannot move ${current} → ${parsed.data}. Allowed: ${allowed.join(", ") || "(terminal)"}`);
  }

  const patch: Record<string, unknown> = { incident_state: parsed.data };
  if (parsed.data === "closed") {
    patch.closed_at = new Date().toISOString();
  }
  const { data: updated, error } = await supabase
    .from("incidents")
    .update(patch as never)
    .eq("org_id", session.orgId)
    .eq("id", id)
    .eq("incident_state", current as "open")
    .select("id");
  if (error) throw new Error(error.message);
  if (!updated || updated.length === 0) {
    throw new Error("Incident status changed concurrently — refresh and retry");
  }
  revalidatePath("/studio/operations/incidents");
}
