"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

const Schema = z.object({
  name: z.string().min(1).max(200),
  project_id: z.string().uuid(),
  cost_database_id: z.string().uuid().optional().or(z.literal("")),
  default_markup_pct: z.string().optional(),
  default_waste_factor: z.string().optional(),
  notes: z.string().max(4000).optional(),
});

export type State = { error?: string } | null;

export async function createEstimate(_: State, fd: FormData): Promise<State> {
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

  const markup = parsed.data.default_markup_pct ? Number(parsed.data.default_markup_pct) : 0;
  const waste = parsed.data.default_waste_factor ? Number(parsed.data.default_waste_factor) : 0;
  if (Number.isNaN(markup) || markup < 0) return { error: "Markup must be ≥ 0" };
  if (Number.isNaN(waste) || waste < 0) return { error: "Waste factor must be ≥ 0" };

  const { data: row, error } = await supabase
    .from("estimates")
    .insert({
      org_id: session.orgId,
      project_id: parsed.data.project_id,
      name: parsed.data.name,
      estimate_state: "draft",
      cost_database_id: parsed.data.cost_database_id || null,
      default_markup_pct: markup,
      default_waste_factor: waste,
      notes: parsed.data.notes || null,
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/console/estimates");
  redirect(`/console/estimates/${(row as { id: string }).id}`);
}
