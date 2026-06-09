"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createProject, updateProject } from "@/lib/db/projects";
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
    revalidatePath("/console/projects");
    revalidatePath("/console");
    redirect(`/console/projects/${project.id}`);
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
  revalidatePath(`/console/projects/${projectId}`);
  revalidatePath("/console/projects");
  return { ok: true };
}
