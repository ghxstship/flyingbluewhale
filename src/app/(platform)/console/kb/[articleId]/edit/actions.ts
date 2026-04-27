"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  title: z.string().min(1).max(300),
  slug: z.string().min(1).max(160),
  body_markdown: z.string(),
  tags: z.string().optional(),
});

export type State = { error?: string } | null;

export async function updateArticle(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const tagList = parsed.data.tags
    ? parsed.data.tags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const supabase = await createClient();
  const { error } = await supabase
    .from("kb_articles")
    .update({
      title: parsed.data.title,
      slug: parsed.data.slug,
      body_markdown: parsed.data.body_markdown,
      tags: tagList,
    })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/kb/${id}`);
  revalidatePath("/console/kb");
  redirect(`/console/kb/${id}`);
}

export async function deleteArticle(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.from("kb_articles").delete().eq("id", id).eq("org_id", session.orgId);
  revalidatePath("/console/kb");
  redirect("/console/kb");
}
