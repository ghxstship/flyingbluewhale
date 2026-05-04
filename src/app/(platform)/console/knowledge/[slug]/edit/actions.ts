"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  slug_current: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9-]+$/i, "Lowercase letters, digits, dashes only"),
  title: z.string().min(1).max(300),
  body_markdown: z.string(),
  tags: z.string().optional(),
});

export type State = { error?: string } | null;

export async function updateKnowledgeArticle(_: State, fd: FormData): Promise<State> {
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
  const slug = parsed.data.slug.toLowerCase();
  const { error } = await supabase
    .from("kb_articles")
    .update({
      title: parsed.data.title,
      slug,
      body_markdown: parsed.data.body_markdown,
      tags: tagList as never,
    })
    .eq("slug", parsed.data.slug_current)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/knowledge/${slug}`);
  if (slug !== parsed.data.slug_current) revalidatePath(`/console/knowledge/${parsed.data.slug_current}`);
  revalidatePath("/console/knowledge");
  redirect(`/console/knowledge/${slug}`);
}

export async function deleteKnowledgeArticle(slug: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.from("kb_articles").delete().eq("slug", slug).eq("org_id", session.orgId);
  revalidatePath("/console/knowledge");
  redirect("/console/knowledge");
}
