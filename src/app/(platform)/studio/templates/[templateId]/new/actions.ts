"use server";

import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { applyProjectTemplate } from "@/lib/db/templates";
import { formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z.object({
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and dashes only")
    .max(64),
});

export type ApplyResult = {
  error?: string;
  projectId?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function applyTemplateAction(templateId: string, fd: FormData): Promise<ApplyResult> {
  const session = await requireSession();
  if (!session.orgId) return { error: actionErrorMessage("user-is-not-in-an-organization", "User is not in an organization") };

  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  try {
    const result = await applyProjectTemplate({
      templateId,
      orgId: session.orgId,
      name: parsed.data.name,
      slug: parsed.data.slug,
      createdBy: session.userId,
    });
    return { projectId: result.projectId };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create project from template" };
  }
}
