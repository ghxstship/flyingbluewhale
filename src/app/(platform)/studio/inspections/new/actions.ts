"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { nextOrgCode } from "@/lib/codes";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  name: z.string().min(1).max(200),
  project_id: z.string().uuid().optional().or(z.literal("")),
  template_id: z.string().uuid().optional().or(z.literal("")),
  scheduled_for: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createInspection(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  // Cross-tenant FK guard on the optional project_id.
  const projectId = parsed.data.project_id || null;
  if (projectId) {
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!project) return { error: "Project not found in your organization" };
  }

  const code = await nextOrgCode("inspections", session.orgId, "INSP");

  // Look up template category if present, plus its items so we can clone them
  // into inspection_items. This is what makes the inspection "checklist-driven".
  // Cross-tenant FK guard on template_id — fetched WITH .eq("org_id") so a
  // user can't pull another tenant's template prompts into their org.
  let category: string | null = null;
  let templateItems: Array<{ position: number; prompt: string; requires_photo: boolean }> = [];
  if (parsed.data.template_id) {
    const [{ data: tpl }, { data: items }] = await Promise.all([
      supabase
        .from("inspection_templates")
        .select("category")
        .eq("id", parsed.data.template_id)
        .eq("org_id", session.orgId)
        .maybeSingle(),
      supabase
        .from("inspection_template_items")
        .select("position, prompt, requires_photo")
        .eq("template_id", parsed.data.template_id)
        .eq("org_id", session.orgId)
        .order("position"),
    ]);
    if (!tpl) return { error: "Template not found in your organization" };
    category = (tpl.category as string | undefined) ?? null;
    templateItems = (items ?? []) as never;
  }

  const { data: insp, error } = await supabase
    .from("inspections")
    .insert({
      org_id: session.orgId,
      code,
      name: parsed.data.name,
      project_id: parsed.data.project_id || null,
      template_id: parsed.data.template_id || null,
      category,
      scheduled_for: parsed.data.scheduled_for || null,
      notes: parsed.data.notes || null,
      created_by: session.userId,
      inspector_id: session.userId,
    } as never)
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);

  if (templateItems.length > 0) {
    const { error: insertError } = await supabase.from("inspection_items").insert(
      templateItems.map((t) => ({
        org_id: session.orgId,
        inspection_id: insp.id,
        position: t.position,
        prompt: t.prompt,
      })) as never,
    );
    if (insertError) return actionFail(insertError.message, fd);
  }

  revalidatePath("/studio/inspections");
  redirect(`/studio/inspections/${insp.id}`);
}
