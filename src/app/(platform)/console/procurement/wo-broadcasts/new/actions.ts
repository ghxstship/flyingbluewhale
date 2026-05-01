"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { nextOrgCode } from "@/lib/codes";

const Schema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  project_id: z.string().uuid().optional().or(z.literal("")),
  category: z.string().max(80).optional(),
  budget: z.string().optional(),
  needed_by: z.string().optional(),
});

export type State = { error?: string } | null;

export async function createBroadcast(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const code = await nextOrgCode("work_order_broadcasts", session.orgId, "WOB");

  const { data, error } = await supabase
    .from("work_order_broadcasts")
    .insert({
      org_id: session.orgId,
      code,
      title: parsed.data.title,
      description: parsed.data.description || null,
      project_id: parsed.data.project_id || null,
      category: parsed.data.category || null,
      budget_cents: parsed.data.budget ? Math.round(Number(parsed.data.budget) * 100) : null,
      needed_by: parsed.data.needed_by || null,
      created_by: session.userId,
    } as never)
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/console/procurement/wo-broadcasts");
  redirect(`/console/procurement/wo-broadcasts/${data.id}`);
}
