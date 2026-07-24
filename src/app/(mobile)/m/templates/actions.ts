"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { recordTemplateVersion } from "@/lib/templates/versions";
import { log } from "@/lib/log";

/**
 * COMPVSS · Templates (kit 31, live-test resolution #15) — server actions for
 * the org + project template library over `field_templates` (migration
 * 20260718013147). Reads are org-member; every shaping write (create, promote,
 * duplicate, archive) is manager-band, matching the table RLS. "Use" is the
 * one member act and goes through the SECURITY DEFINER `use_field_template`
 * RPC so the usage counter can move without a manager-band row UPDATE.
 */

// A "use server" module may export ONLY async functions — exporting a value
// (or even a type) makes Next throw "A 'use server' file can only export async
// functions, found object." at runtime, 500-ing EVERY action in the file. These
// three are used only inside this module, so they stay module-local.
type State = { error?: string; fieldErrors?: Record<string, string> } | null;

type TemplateCategory =
  | "roster"
  | "advance"
  | "checklist"
  | "contract"
  | "task_list"
  | "schedule"
  | "onboarding"
  | "budget";

/** Kit form option label → stored category slug. */
const CATEGORY_BY_LABEL: Record<string, TemplateCategory> = {
  Roster: "roster",
  Advance: "advance",
  Checklist: "checklist",
  Contract: "contract",
  "Task List": "task_list",
  Schedule: "schedule",
  Onboarding: "onboarding",
  Budget: "budget",
};

const SOURCE_BY_LABEL: Record<string, string> = {
  Blank: "blank",
  "Current Project Data": "project_data",
  "Duplicate Existing Template": "duplicate",
};

const CreateInput = z.object({
  name: z.string().min(1, "Name the template.").max(200),
  cat: z.string().min(1, "Pick a category."),
  scope: z.enum(["Project", "Org"]),
  source: z.string().optional(),
  notes: z.string().max(4000).optional(),
});

export async function createFieldTemplate(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Creating templates is a manager action." };

  const scalars = Object.fromEntries(Array.from(fd.entries()).filter(([, v]) => typeof v === "string"));
  const parsed = CreateInput.safeParse(scalars);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) if (i.path[0]) fieldErrors[String(i.path[0])] = i.message;
    return { error: "Please fix the errors below.", fieldErrors };
  }
  const v = parsed.data;
  const category = CATEGORY_BY_LABEL[v.cat];
  if (!category) return { error: "Please fix the errors below.", fieldErrors: { cat: "Pick a category." } };

  const supabase = await createClient();

  // Project-library templates attach to the org's current ACTIVE project
  // (most recently updated), same resolution the Home spine uses. No active
  // project → the template lands in the org library, stated to the caller.
  let projectId: string | null = null;
  if (v.scope === "Project") {
    const { data: proj } = await supabase
      .from("projects")
      .select("id")
      .eq("org_id", session.orgId)
      .eq("project_state", "active")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    projectId = (proj as { id: string } | null)?.id ?? null;
  }

  const { data: created, error } = await supabase
    .from("field_templates")
    .insert({
      org_id: session.orgId,
      project_id: projectId,
      name: v.name,
      category,
      summary: v.notes || null,
      source: SOURCE_BY_LABEL[v.source ?? ""] ?? "blank",
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) {
    log.error("m.templates.create_failed", { err: error.message });
    return { error: error.message };
  }

  await recordTemplateVersion(supabase, {
    orgId: session.orgId,
    family: "field",
    templateId: (created as { id: string }).id,
    snapshot: { name: v.name, category, summary: v.notes || null, config: {}, project_id: projectId },
    changedBy: session.userId,
  });

  revalidatePath("/m/templates");
  return null;
}

const Id = z.string().uuid();

export async function applyFieldTemplate(id: string): Promise<{ error?: string; uses?: number }> {
  await requireSession();
  const parsed = Id.safeParse(id);
  if (!parsed.success) return { error: "Bad template id." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("use_field_template", { p_template_id: parsed.data });
  if (error) {
    log.error("m.templates.use_failed", { err: error.message });
    return { error: error.message };
  }
  revalidatePath("/m/templates");
  return { uses: data as number };
}

export async function duplicateFieldTemplate(id: string): Promise<{ error?: string }> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Duplicating templates is a manager action." };
  const parsed = Id.safeParse(id);
  if (!parsed.success) return { error: "Bad template id." };
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("field_templates")
    .select("name, category, summary, config, project_id")
    .eq("id", parsed.data)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!row) return { error: "Template not found." };
  const r = row as { name: string; category: string; summary: string | null; config: unknown; project_id: string | null };

  const { data: copy, error } = await supabase
    .from("field_templates")
    .insert({
      org_id: session.orgId,
      project_id: r.project_id,
      name: `${r.name} (Copy)`,
      category: r.category,
      summary: r.summary,
      config: (r.config ?? {}) as Record<string, never>,
      source: "duplicate",
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  await recordTemplateVersion(supabase, {
    orgId: session.orgId,
    family: "field",
    templateId: (copy as { id: string }).id,
    snapshot: {
      name: `${r.name} (Copy)`,
      category: r.category,
      summary: r.summary,
      config: r.config ?? {},
      project_id: r.project_id,
    },
    changedBy: session.userId,
  });

  revalidatePath("/m/templates");
  return {};
}

/** Project template → org library (kit "Promote To Org"). */
export async function promoteFieldTemplate(id: string): Promise<{ error?: string }> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Promoting templates is a manager action." };
  const parsed = Id.safeParse(id);
  if (!parsed.success) return { error: "Bad template id." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("field_templates")
    .update({ project_id: null })
    .eq("id", parsed.data)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (error) return { error: error.message };
  revalidatePath("/m/templates");
  return {};
}

export async function archiveFieldTemplate(id: string): Promise<{ error?: string }> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Archiving templates is a manager action." };
  const parsed = Id.safeParse(id);
  if (!parsed.success) return { error: "Bad template id." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("field_templates")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath("/m/templates");
  return {};
}

/** Undo for a just-archived template (the 5s UndoBar). */
export async function restoreFieldTemplate(id: string): Promise<{ error?: string }> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Restoring templates is a manager action." };
  const parsed = Id.safeParse(id);
  if (!parsed.success) return { error: "Bad template id." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("field_templates")
    .update({ deleted_at: null })
    .eq("id", parsed.data)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath("/m/templates");
  return {};
}
