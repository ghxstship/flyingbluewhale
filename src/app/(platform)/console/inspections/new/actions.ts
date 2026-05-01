"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { nextOrgCode } from "@/lib/codes";

const Schema = z.object({
  name: z.string().min(1).max(200),
  project_id: z.string().uuid().optional().or(z.literal("")),
  template_id: z.string().uuid().optional().or(z.literal("")),
  scheduled_for: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

export type State = { error?: string } | null;

export async function createInspection(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const code = await nextOrgCode("inspections", session.orgId, "INSP");

  // Look up template category if present, plus its items so we can clone them
  // into inspection_items. This is what makes the inspection "checklist-driven".
  let category: string | null = null;
  let templateItems: Array<{ position: number; prompt: string; requires_photo: boolean }> = [];
  if (parsed.data.template_id) {
    const [{ data: tpl }, { data: items }] = await Promise.all([
      supabase.from("inspection_templates").select("category").eq("id", parsed.data.template_id).maybeSingle(),
      supabase
        .from("inspection_template_items")
        .select("position, prompt, requires_photo")
        .eq("template_id", parsed.data.template_id)
        .order("position"),
    ]);
    category = (tpl?.category as string | undefined) ?? null;
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
  if (error) return { error: error.message };

  if (templateItems.length > 0) {
    await supabase.from("inspection_items").insert(
      templateItems.map((t) => ({
        org_id: session.orgId,
        inspection_id: insp.id,
        position: t.position,
        prompt: t.prompt,
      })) as never,
    );
  }

  revalidatePath("/console/inspections");
  redirect(`/console/inspections/${insp.id}`);
}
