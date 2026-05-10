import "server-only";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import type { ProjectTemplate, TemplateCategory } from "@/lib/templates/types";
import { coerceBlueprint } from "@/lib/templates/types";

/**
 * Project templates server helpers — Phase 6.3 of the SmartSuite parity roadmap.
 * RLS gates visibility (global templates + own-org templates).
 */

function rowToTemplate(r: Record<string, unknown>): ProjectTemplate {
  return {
    id: r.id as string,
    orgId: (r.org_id as string | null) ?? null,
    slug: r.slug as string,
    name: r.name as string,
    description: (r.description as string | null) ?? null,
    category: (r.category as TemplateCategory) ?? "custom",
    tagline: (r.tagline as string | null) ?? null,
    coverImage: (r.cover_image as string | null) ?? null,
    blueprint: coerceBlueprint(r.blueprint),
    enabled: Boolean(r.enabled),
    isOfficial: Boolean(r.is_official),
    createdBy: (r.created_by as string | null) ?? null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

export async function listProjectTemplates(
  opts: { orgId?: string | null; category?: TemplateCategory } = {},
): Promise<ProjectTemplate[]> {
  const supabase = await createClient();
  let q = supabase
    .from("project_templates")
    .select("*")
    .eq("enabled", true)
    .order("is_official", { ascending: false })
    .order("name", { ascending: true });
  if (opts.category) q = q.eq("category", opts.category);
  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map(rowToTemplate);
}

export async function getProjectTemplate(opts: { id: string }): Promise<ProjectTemplate | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("project_templates").select("*").eq("id", opts.id).maybeSingle();
  return data ? rowToTemplate(data as Record<string, unknown>) : null;
}

/**
 * Materialize a template into a real project. Service-role for cross-table writes.
 * Returns the new project's id.
 */
export async function applyProjectTemplate(opts: {
  templateId: string;
  orgId: string;
  name: string;
  slug: string;
  createdBy: string;
}): Promise<{ projectId: string }> {
  const tpl = await getProjectTemplate({ id: opts.templateId });
  if (!tpl) throw new Error("Template not found");
  // Either a global template (orgId === null) or one owned by this org.
  if (tpl.orgId !== null && tpl.orgId !== opts.orgId) throw new Error("Template not available for this organization");

  const admin = createServiceClient() as unknown as LooseSupabase;
  const insertProject = {
    org_id: opts.orgId,
    name: opts.name,
    slug: opts.slug,
    status: "draft" as const,
    created_by: opts.createdBy,
  };
  const { data: project, error: pErr } = await admin.from("projects").insert(insertProject).select("id").single();
  if (pErr || !project) throw new Error(pErr?.message ?? "Failed to create project from template");
  const projectId = (project as { id: string }).id;

  // Best-effort seed: write deliverables + tasks where the schema allows it.
  // Skip on unknown tables — the project is created either way.
  if (tpl.blueprint.deliverables?.length) {
    const rows = tpl.blueprint.deliverables.map((d) => ({
      org_id: opts.orgId,
      project_id: projectId,
      title: d.title,
      kind: d.kind,
      description: d.description ?? null,
      created_by: opts.createdBy,
    }));
    await admin.from("deliverables").insert(rows).select("id");
  }
  if (tpl.blueprint.tasks?.length) {
    const rows = tpl.blueprint.tasks.map((t) => ({
      org_id: opts.orgId,
      project_id: projectId,
      title: t.title,
      description: t.description ?? null,
      status: "todo",
      created_by: opts.createdBy,
    }));
    await admin.from("tasks").insert(rows).select("id");
  }

  return { projectId };
}
