"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  code: z.string().min(1).max(40),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

export type State = { error?: string } | null;

export async function createQuestionnaire(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prequalification_questionnaires")
    .insert({
      org_id: session.orgId,
      code: parsed.data.code,
      name: parsed.data.name,
      description: parsed.data.description || null,
      created_by: session.userId,
    } as never)
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return { error: `Code "${parsed.data.code}" already in use.` };
    return { error: error.message };
  }
  revalidatePath("/console/procurement/prequalification/questionnaires");
  redirect(`/console/procurement/prequalification/questionnaires/${data.id}`);
}
