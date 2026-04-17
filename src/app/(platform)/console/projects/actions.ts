"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createProject, updateProject } from "@/lib/db/projects";

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);

const CreateSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  startDate: z.string().date().optional().or(z.literal("")),
  endDate: z.string().date().optional().or(z.literal("")),
});

export type CreateProjectState = { error?: string } | null;

export async function createProjectAction(_: CreateProjectState, formData: FormData): Promise<CreateProjectState> {
  const session = await requireSession();
  const parsed = CreateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const project = await createProject({
      orgId: session.orgId,
      slug: slugify(parsed.data.name),
      name: parsed.data.name,
      description: parsed.data.description || undefined,
      startDate: parsed.data.startDate || null,
      endDate: parsed.data.endDate || null,
      createdBy: session.userId,
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
  status: z.enum(["draft", "active", "paused", "archived", "complete"]).optional(),
  description: z.string().max(2000).optional(),
});

export async function updateProjectAction(projectId: string, formData: FormData) {
  const session = await requireSession();
  const parsed = UpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  await updateProject(session.orgId, projectId, parsed.data);
  revalidatePath(`/console/projects/${projectId}`);
  revalidatePath("/console/projects");
  return { ok: true };
}
