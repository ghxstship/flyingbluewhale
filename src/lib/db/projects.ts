import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Project, ProjectStatus } from "@/lib/supabase/types";

export async function listProjects(orgId: string): Promise<Project[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("org_id", orgId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getProject(orgId: string, projectId: string): Promise<Project | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("org_id", orgId)
    .eq("id", projectId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createProject(input: {
  orgId: string;
  slug: string;
  name: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: string | null;
  endDate?: string | null;
  createdBy: string;
}): Promise<Project> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      org_id: input.orgId,
      slug: input.slug,
      name: input.name,
      description: input.description ?? null,
      status: input.status ?? "draft",
      start_date: input.startDate ?? null,
      end_date: input.endDate ?? null,
      created_by: input.createdBy,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProject(orgId: string, projectId: string, patch: Partial<Project>): Promise<Project> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .update(patch)
    .eq("org_id", orgId)
    .eq("id", projectId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function projectStats(orgId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("status")
    .eq("org_id", orgId);
  const rows = data ?? [];
  const by: Record<ProjectStatus, number> = {
    draft: 0, active: 0, paused: 0, archived: 0, complete: 0,
  };
  for (const r of rows) by[r.status as ProjectStatus]++;
  return { total: rows.length, byStatus: by };
}
