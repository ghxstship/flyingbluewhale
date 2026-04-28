"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(160),
  body_markdown: z.string().min(1).max(40000),
});

export type State = { error?: string } | null;

export async function updateTrainingCourse(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("kb_articles")
    .update({
      title: parsed.data.title,
      slug: parsed.data.slug,
      body_markdown: parsed.data.body_markdown,
    })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/workforce/training/${id}`);
  revalidatePath("/console/workforce/training");
  redirect(`/console/workforce/training/${id}`);
}

export async function deleteTrainingCourse(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.from("kb_articles").delete().eq("id", id).eq("org_id", session.orgId);
  revalidatePath("/console/workforce/training");
  redirect("/console/workforce/training");
}
