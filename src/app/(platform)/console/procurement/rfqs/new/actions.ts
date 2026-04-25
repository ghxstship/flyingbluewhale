"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  due_at: z.string().optional(),
});

export type State = { error?: string } | null;

export async function createRfqAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rfqs")
    .insert({
      org_id: session.orgId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      due_at: parsed.data.due_at || null,
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/console/procurement/rfqs");
  redirect(`/console/procurement/rfqs/${data.id}`);
}
