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
});

export type State = { error?: string } | null;

export async function createBaseline(_: State, fd: FormData): Promise<State> {
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
    .from("schedule_baselines")
    .insert({
      org_id: session.orgId,
      project_id: parsed.data.project_id,
      name: parsed.data.name,
      description: parsed.data.description || null,
      baseline_state: "draft",
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/console/schedule/baselines");
  redirect(`/console/schedule/baselines/${(row as { id: string }).id}`);
}
