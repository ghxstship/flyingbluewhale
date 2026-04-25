"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  category: z.string().max(80).optional(),
});

export type State = { error?: string } | null;

export async function createRiskAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase.from("risks").insert({
    org_id: session.orgId,
    title: parsed.data.title,
    description: parsed.data.description || null,
    category: parsed.data.category || null,
    created_by: session.userId,
  });
  if (error) return { error: error.message };
  revalidatePath("/console/programs/risk");
  redirect("/console/programs/risk");
}
