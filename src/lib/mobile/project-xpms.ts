import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * XPMS-compliant COMPVSS field project datasets (kit 34 v3.2/v3.6). The
 * Projects hub — Project Tasks · Project Calendar · Milestones · Timeline — is
 * the field expression of the ATLVS Coordinate Matrix. Every project record
 * carries the XPMS spine (`xpms_atom_id` · `urid` → department/discipline/
 * category · 9-gate `phase` · `coordinate`). These are the ALL-CREW SSOT
 * datasets; `My Tasks` / `My Calendar` are the personal slice on `tasks` /
 * `events`, not here.
 *
 * Reads are org-scoped (RLS enforces) and further scoped to the hub's project
 * context (`resolveProjectContext`) — the live/active project, else the org's
 * most recent.
 */

export type ProjectTask = {
  id: string;
  xpms_atom_id: string;
  urid: string;
  department: string;
  discipline: string;
  category: string;
  phase: string;
  coordinate: string;
  title: string;
  sub: string | null;
  priority: "High" | "Medium" | "Low";
  status: "Open" | "In progress" | "Blocked" | "Done";
  assignee: string | null;
  assignee_id: string | null;
  location: string | null;
  trade: string | null;
  company: string | null;
  due: string | null;
  logged: string | null;
  archived: boolean;
};

export type ProjectEvent = {
  id: string;
  xpms_atom_id: string;
  urid: string;
  department: string;
  dept_code: string;
  phase: string;
  title: string;
  sub: string | null;
  event_date: string;
  event_iso: string;
  owner: string | null;
  status: "Scheduled" | "Upcoming" | "Done";
};

export type ProjectMilestone = {
  id: string;
  title: string;
  phase: "Advance" | "Load-In" | "Show Days" | "Load-Out";
  milestone_date: string;
  owner: string | null;
  status: "Done" | "At Risk" | "On Track" | "Upcoming";
};

export type ProjectContext = { id: string; name: string; phase: string | null } | null;

/**
 * The project the Projects hub reads. An org can carry many projects at once;
 * the hub shows the one with live XPMS field work. Preference order (a single
 * indexed pass): active projects first, then the one with the most
 * project-tasks (the field crew's current build), then the most recent start.
 * This self-heals — as a real org opens project work on its active show, the
 * hub follows the data rather than a stale "newest" heuristic.
 */
export const resolveProjectContext = cache(async (orgId: string): Promise<ProjectContext> => {
  const supabase = await createClient();
  const [projRes, taskRes] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, xpms_phase, project_state, start_date, created_at")
      .eq("org_id", orgId)
      .is("deleted_at", null),
    supabase.from("project_tasks").select("project_id").eq("org_id", orgId),
  ]);
  const projects = projRes.data ?? [];
  if (!projects.length) return null;
  const taskCount = new Map<string, number>();
  for (const t of taskRes.data ?? []) taskCount.set(t.project_id, (taskCount.get(t.project_id) ?? 0) + 1);
  const ranked = [...projects].sort((a, b) => {
    const activeDiff = (a.project_state === "active" ? 0 : 1) - (b.project_state === "active" ? 0 : 1);
    if (activeDiff) return activeDiff;
    const nDiff = (taskCount.get(b.id) ?? 0) - (taskCount.get(a.id) ?? 0);
    if (nDiff) return nDiff;
    const s = String(b.start_date ?? "").localeCompare(String(a.start_date ?? ""));
    if (s) return s;
    return String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""));
  });
  const p = ranked[0]!;
  return { id: p.id, name: p.name, phase: p.xpms_phase };
});

export async function listProjectTasks(orgId: string, projectId: string): Promise<ProjectTask[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_tasks")
    .select(
      "id, xpms_atom_id, urid, department, discipline, category, phase, coordinate, title, sub, priority, status:task_state, assignee, assignee_id, location, trade, company, due, logged, archived",
    )
    .eq("org_id", orgId)
    .eq("project_id", projectId)
    .eq("archived", false)
    .order("id", { ascending: true });
  return (data ?? []) as ProjectTask[];
}

export async function listProjectEvents(orgId: string, projectId: string): Promise<ProjectEvent[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_events")
    .select("id, xpms_atom_id, urid, department, dept_code, phase, title, sub, event_date, event_iso, owner, status:event_state")
    .eq("org_id", orgId)
    .eq("project_id", projectId)
    .order("event_iso", { ascending: true });
  return (data ?? []) as ProjectEvent[];
}

export async function listProjectMilestones(orgId: string, projectId: string): Promise<ProjectMilestone[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_milestones")
    .select("id, title, phase, milestone_date, owner, status:milestone_state")
    .eq("org_id", orgId)
    .eq("project_id", projectId)
    .order("id", { ascending: true });
  return (data ?? []) as ProjectMilestone[];
}

/** The 4 field phases (Timeline) — coarser than the 9 XPMS gates; milestones
 *  roll up to these. Order is the field lifecycle advance → load-out. */
export const FIELD_PHASES = ["Advance", "Load-In", "Show Days", "Load-Out"] as const;
