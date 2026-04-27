"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional().or(z.literal("")),
  due_at: z.string().optional().or(z.literal("")),
});

export type State = { error?: string } | null;

export async function updateFabrication(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("fabrication_orders")
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      due_at: parsed.data.due_at || null,
    })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/production/fabrication/${id}`);
  revalidatePath("/console/production/fabrication");
  redirect(`/console/production/fabrication/${id}`);
}
