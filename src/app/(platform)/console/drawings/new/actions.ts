"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

const Schema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  project_id: z.string().uuid(),
  discipline: z.string().max(16).optional(),
  initial_version_label: z.string().max(64).optional(),
});

export type State = { error?: string } | null;

export async function createSheetSet(_: State, fd: FormData): Promise<State> {
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

  const { data: set, error } = await supabase
    .from("sheet_sets")
    .insert({
      org_id: session.orgId,
      project_id: parsed.data.project_id,
      name: parsed.data.name,
      description: parsed.data.description || null,
      discipline: parsed.data.discipline || null,
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  const setId = (set as { id: string }).id;

  if (parsed.data.initial_version_label && parsed.data.initial_version_label.trim()) {
    const { data: version, error: vErr } = await supabase
      .from("sheet_set_versions")
      .insert({
        org_id: session.orgId,
        sheet_set_id: setId,
        version_label: parsed.data.initial_version_label.trim(),
        set_state: "draft",
      })
      .select("id")
      .single();
    if (vErr) return { error: vErr.message };

    await supabase
      .from("sheet_sets")
      .update({ current_version_id: (version as { id: string }).id })
      .eq("id", setId)
      .eq("org_id", session.orgId);
  }

  revalidatePath("/console/drawings");
  redirect(`/console/drawings/${setId}`);
}
