import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Project, ProjectStatus } from "@/lib/supabase/types";
import type { Database } from "@/lib/supabase/database.types";

type DbProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];

export async function listProjects(orgId: string, opts?: { includeArchived?: boolean }): Promise<Project[]> {
  if (!orgId) return [];
  const supabase = await createClient();
  let q = supabase.from("projects").select("*").eq("org_id", orgId).order("updated_at", { ascending: false });
  if (!opts?.includeArchived) q = q.is("deleted_at", null);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getProject(orgId: string, projectId: string): Promise<Project | null> {
  if (!orgId || !projectId) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("org_id", orgId)
    .eq("id", projectId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return data;
}

type GeoScope = "local" | "regional" | "national" | "international";
type TourStructure = "single_stop" | "multi_stop_sequential" | "simultaneous_multi_city";
type ProductionStyle = "editorial" | "documentary" | "narrative" | "spectacle" | "intimate" | "brutalist";

export async function createProject(input: {
  orgId: string;
  slug: string;
  name: string;
  description?: string;
  /** Operational state (was `status` pre-LDP rename — column is now
   *  `project_state`). Accepts the legacy enum for back-compat. */
  projectState?: ProjectStatus;
  startDate?: string | null;
  endDate?: string | null;
  createdBy: string;
  clientId?: string | null;
  primaryVenueId?: string | null;
  budgetCents?: number | null;
  geographicScope?: GeoScope | null;
  tourStructure?: TourStructure | null;
  productionStyle?: ProductionStyle | null;
}): Promise<Project> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      org_id: input.orgId,
      slug: input.slug,
      name: input.name,
      description: input.description ?? null,
      project_state: input.projectState ?? "draft",
      start_date: input.startDate ?? null,
      end_date: input.endDate ?? null,
      created_by: input.createdBy,
      client_id: input.clientId ?? null,
      primary_venue_id: input.primaryVenueId ?? null,
      budget_cents: input.budgetCents ?? null,
      geographic_scope: input.geographicScope ?? null,
      tour_structure: input.tourStructure ?? null,
      production_style: input.productionStyle ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProject(orgId: string, projectId: string, patch: Partial<Project>): Promise<Project> {
  const supabase = await createClient();
  // Partial<Project> includes null for xpms_phase (application type) which the
  // generated DbProjectUpdate doesn't allow (DB column is NOT NULL). Cast
  // through unknown to satisfy the Supabase RejectExcessProperties constraint.
  const { data, error } = await supabase
    .from("projects")
    .update(patch as unknown as DbProjectUpdate)
    .eq("org_id", orgId)
    .eq("id", projectId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function projectStats(orgId: string) {
  const by: Record<ProjectStatus, number> = {
    draft: 0,
    active: 0,
    paused: 0,
    archived: 0,
    complete: 0,
  };
  if (!orgId) return { total: 0, byState: by };
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("project_state").eq("org_id", orgId).is("deleted_at", null);
  const rows = data ?? [];
  for (const r of rows) by[r.project_state as ProjectStatus]++;
  return { total: rows.length, byState: by };
}
