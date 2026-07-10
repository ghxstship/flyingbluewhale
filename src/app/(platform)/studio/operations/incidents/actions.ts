"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { emitAudit } from "@/lib/audit";

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
    throw new Error("Incident status changed concurrently. Refresh and retry");
  }
  revalidatePath("/studio/operations/incidents");
}

export type CorrectiveTaskState = { error?: string } | null;

/**
 * v7.8 record action — "Create Corrective Task". Closes the
 * incident → remediation loop: spawns a tasks row pre-filled from the
 * incident (title, context, project, severity-weighted priority) and
 * back-linked via an `[incident:<id>]` marker in the description
 * (tasks has no incident FK; the marker doubles as the idempotency
 * probe so a double-click reuses the first task).
 */
export async function createCorrectiveTaskAction(incidentId: string): Promise<CorrectiveTaskState> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can create corrective tasks" };
  const supabase = await createClient();

  const { data: incident } = await supabase
    .from("incidents")
    .select("id, summary, description, severity, location, occurred_at, project_id, incident_state")
    .eq("org_id", session.orgId)
    .eq("id", incidentId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!incident) return { error: "Incident not found" };
  if (incident.incident_state === "closed") {
    return { error: "Incident is closed. Reopen it before adding corrective work" };
  }

  // Idempotency: the lineage marker is unique per incident.
  const marker = `[incident:${incidentId}]`;
  const { data: existing } = await supabase
    .from("tasks")
    .select("id")
    .eq("org_id", session.orgId)
    .like("description", `%${marker}%`)
    .limit(1);
  const existingTask = existing?.[0];
  if (existingTask) {
    redirect(`/studio/tasks/${existingTask.id}`);
  }

  const contextLines = [
    incident.description?.trim() || null,
    incident.location ? `Location: ${incident.location}` : null,
    `Severity: ${incident.severity} · Occurred: ${incident.occurred_at}`,
    marker,
  ].filter(Boolean);

  const { data: task, error: insertError } = await supabase
    .from("tasks")
    .insert({
      org_id: session.orgId,
      title: `Corrective action: ${incident.summary}`.slice(0, 200),
      description: contextLines.join("\n\n"),
      project_id: incident.project_id,
      // Severity-weighted: majors/criticals land at the top of the queue.
      priority: incident.severity === "critical" || incident.severity === "major" ? 1 : 2,
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (insertError) return { error: insertError.message };

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "incident.corrective_task_created",
    targetTable: "tasks",
    targetId: task.id,
    metadata: { incidentId, severity: incident.severity },
  });

  revalidatePath("/studio/tasks");
  revalidatePath(`/studio/operations/incidents/${incidentId}`);
  redirect(`/studio/tasks/${task.id}`);
}
