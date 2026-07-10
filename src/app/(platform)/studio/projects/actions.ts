"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createProject, updateProject } from "@/lib/db/projects";
import { createClient } from "@/lib/supabase/server";
import { formFail } from "@/lib/forms/fail";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

const UUID = z.string().uuid();
const OPT_UUID = z.union([UUID, z.literal("")]).optional();
const OPT_DATE = z.string().date().optional().or(z.literal(""));
const OPT_ENUM = <T extends [string, ...string[]]>(values: T) => z.union([z.enum(values), z.literal("")]).optional();

const CreateSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  startDate: OPT_DATE,
  endDate: OPT_DATE,
  clientId: OPT_UUID,
  primaryVenueId: OPT_UUID,
  // Budget arrives as a dollar string from the form; convert to cents before
  // hitting the DB. Empty string means "no budget set", which is distinct
  // from "$0.00 budget" — the DB stores NULL for the former.
  budget: z
    .string()
    .regex(/^\d*\.?\d{0,2}$/u)
    .optional()
    .or(z.literal("")),
  geographicScope: OPT_ENUM(["local", "regional", "national", "international"]),
  tourStructure: OPT_ENUM(["single_stop", "multi_stop_sequential", "simultaneous_multi_city"]),
  productionStyle: OPT_ENUM(["editorial", "documentary", "narrative", "spectacle", "intimate", "brutalist"]),
});

export type CreateProjectState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createProjectAction(_: CreateProjectState, formData: FormData): Promise<CreateProjectState> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can create projects" };
  const parsed = CreateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return formFail(parsed.error, formData);

  const budgetCents =
    parsed.data.budget && parsed.data.budget.length > 0
      ? Math.round(Number.parseFloat(parsed.data.budget) * 100)
      : null;
  // Empty-string sentinel from an unselected `<select>` collapses to null.
  // The zod schema already validates the enum values; the cast is safe here.
  // LDP discipline: never let `""` reach the DB enum columns.
  const geoScope = parsed.data.geographicScope || null;
  const tourStr = parsed.data.tourStructure || null;
  const prodStyle = parsed.data.productionStyle || null;

  try {
    const project = await createProject({
      orgId: session.orgId,
      slug: slugify(parsed.data.name),
      name: parsed.data.name,
      description: parsed.data.description || undefined,
      startDate: parsed.data.startDate || null,
      endDate: parsed.data.endDate || null,
      createdBy: session.userId,
      clientId: parsed.data.clientId || null,
      primaryVenueId: parsed.data.primaryVenueId || null,
      budgetCents,
      geographicScope: geoScope as "local" | "regional" | "national" | "international" | null,
      tourStructure: tourStr as "single_stop" | "multi_stop_sequential" | "simultaneous_multi_city" | null,
      productionStyle: prodStyle as
        | "editorial"
        | "documentary"
        | "narrative"
        | "spectacle"
        | "intimate"
        | "brutalist"
        | null,
    });
    revalidatePath("/studio/projects");
    revalidatePath("/studio");
    redirect(`/studio/projects/${project.id}`);
  } catch (e) {
    if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) throw e;
    return { error: e instanceof Error ? e.message : "Could not create project" };
  }
}

const UpdateSchema = z.object({
  project_state: z.enum(["draft", "active", "paused", "archived", "complete"]).optional(),
  description: z.string().max(2000).optional(),
});

export async function updateProjectAction(projectId: string, formData: FormData) {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can change project state" };
  const parsed = UpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return formFail(parsed.error, formData);

  await updateProject(session.orgId, projectId, parsed.data);
  revalidatePath(`/studio/projects/${projectId}`);
  revalidatePath("/studio/projects");
  return { ok: true };
}

const BulkIds = z.array(z.string().uuid()).min(1).max(200);

export type BulkResult = { message?: string; error?: string };

/**
 * Bulk archive projects — the list-table counterpart to the per-project
 * state control. manager+ only; RLS pins every write to the session org.
 * Already-archived (or cross-org / missing / soft-deleted) rows are
 * skipped and reported. Archiving is a state move, not a delete: projects
 * anchor invoices, events, and crew, so archive keeps the history intact.
 */
export async function bulkArchiveProjects(ids: string[]): Promise<BulkResult> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "You Need Manager Access To Archive Projects" };
  const parsed = BulkIds.safeParse(ids);
  if (!parsed.success) return { error: "Invalid Selection" };
  const supabase = await createClient();

  const { data: updated, error } = await supabase
    .from("projects")
    .update({ project_state: "archived" })
    .in("id", parsed.data)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .neq("project_state", "archived")
    .select("id");
  if (error) return { error: `Could Not Archive: ${error.message}` };

  const archived = updated?.length ?? 0;
  const skipped = parsed.data.length - archived;
  revalidatePath("/studio/projects");
  revalidatePath("/studio");
  if (skipped > 0) {
    return { error: `${archived} Archived · ${skipped} Skipped (already archived or not found)` };
  }
  return { message: `${archived} ${archived === 1 ? "Project" : "Projects"} Archived` };
}
