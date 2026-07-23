"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { transitionIncident } from "@/lib/db/incident-fsm";
import { emitAudit } from "@/lib/audit";
import { actionErrorMessage } from "@/lib/errors";

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
  // FSM + CAS guard + audit live in the shared transition so COMPVSS moves
  // an incident through the identical path (it previously had none at all).
  const result = await transitionIncident(supabase, session, id, parsed.data);
  if (!result.ok) throw new Error(result.error);
  revalidatePath("/studio/operations/incidents");
  revalidatePath(`/studio/operations/incidents/${id}`);
}

export type CorrectiveTaskState = { error?: string } | null;

export async function createCorrectiveTaskAction(incidentId: string): Promise<CorrectiveTaskState> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.create-corrective-tasks", "Only manager+ can create corrective tasks") };
  const supabase = await createClient();

  const { data: incident } = await supabase
    .from("incidents")
    .select("id, summary, description, severity, location, occurred_at, project_id, incident_state")
    .eq("org_id", session.orgId)
    .eq("id", incidentId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!incident) return { error: actionErrorMessage("not-found.incident", "Incident not found") };
  if (incident.incident_state === "closed") {
    return { error: actionErrorMessage("incident-is-closed-reopen-it-before-adding-corrective-work", "Incident is closed. Reopen it before adding corrective work") };
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
