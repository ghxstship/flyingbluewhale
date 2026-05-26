"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

const Schema = z.object({
  section_number: z.string().min(1).max(64),
  title: z.string().min(1).max(200),
  project_id: z.string().uuid(),
  format: z
    .enum(["masterformat_2026", "masterformat_1995", "uniformat_2_2", "nrm2", "custom"])
    .default("masterformat_2026"),
  division: z.string().max(120).optional(),
  body_md: z.string().max(200000).optional(),
});

export type State = { error?: string } | null;

export async function createSpecSection(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", parsed.data.project_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) return { error: "Project not found in your organization" };

  const { data: row, error } = await supabase
    .from("spec_sections")
    .insert({
      org_id: session.orgId,
      project_id: parsed.data.project_id,
      format: parsed.data.format,
      section_number: parsed.data.section_number.trim(),
      title: parsed.data.title,
      division: parsed.data.division || null,
      body_md: parsed.data.body_md || null,
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/console/specs");
  redirect(`/console/specs/${(row as { id: string }).id}`);
}
