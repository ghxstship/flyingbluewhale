import "server-only";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Constants } from "@/lib/supabase/database.types";
import type { DeliverableType } from "@/lib/supabase/types";
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

  const admin = createServiceClient();
  const insertProject = {
    org_id: opts.orgId,
    name: opts.name,
    slug: opts.slug,
    // LDP rename: the column is `project_state` — the old `status` key hit a
    // nonexistent column and 42703'd every template apply (masked by the
    // LooseSupabase cast this helper used to compile through).
    project_state: "draft" as const,
    created_by: opts.createdBy,
    // Provenance: which blueprint materialized this project (migration
    // 20260724134607). Not in the generated types yet — hence the cast below.
    template_id: opts.templateId,
  };
  const { data: project, error: pErr } = await admin
    .from("projects")
    .insert(insertProject as never)
    .select("id")
    .single();
  if (pErr || !project) throw new Error(pErr?.message ?? "Failed to create project from template");
  const projectId = (project as { id: string }).id;

  // Best-effort seed: write deliverables + tasks where the schema allows it.
  // Skip on unknown tables — the project is created either way.
  if (tpl.blueprint.deliverables?.length) {
    // `deliverables` has no kind/description/created_by columns — the doc-spec
    // type lives in the `type` enum column and free-form context in `data`.
    // Blueprint kinds are unvalidated strings; coerce unknowns to "custom".
    const deliverableTypes: readonly string[] = Constants.public.Enums.deliverable_type;
    const rows = tpl.blueprint.deliverables.map((d) => ({
      org_id: opts.orgId,
      project_id: projectId,
      title: d.title,
      type: (deliverableTypes.includes(d.kind) ? d.kind : "custom") as DeliverableType,
      data: d.description ? { description: d.description } : {},
    }));
    await admin.from("deliverables").insert(rows).select("id");
  }
  if (tpl.blueprint.tasks?.length) {
    const rows = tpl.blueprint.tasks.map((t) => ({
      org_id: opts.orgId,
      project_id: projectId,
      title: t.title,
      description: t.description ?? null,
      task_state: "todo" as const,
      created_by: opts.createdBy,
    }));
    await admin.from("tasks").insert(rows).select("id");
  }

  return { projectId };
}
