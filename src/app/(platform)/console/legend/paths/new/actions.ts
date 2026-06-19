"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional().or(z.literal("")),
  target_role: z.string().max(120).optional().or(z.literal("")),
  estimated_hours: z.string().optional().transform((v) => (v && !isNaN(Number(v)) ? Number(v) : null)),
  is_required: z.string().optional().transform((v) => v === "on"),
});

export type State = { error?: string; ok?: true } | null;

export async function createTrainingPathAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can manage training paths" };

  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("training_paths")
    .insert({
      org_id: session.orgId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      target_role: parsed.data.target_role || null,
      estimated_hours: parsed.data.estimated_hours,
      is_required: parsed.data.is_required,
      created_by: session.userId,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/console/legend/paths");
  redirect(`/console/legend/paths/${data.id}`);
}
