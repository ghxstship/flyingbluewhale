"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/i, "Lowercase letters, digits, dashes only"),
  title: z.string().min(1).max(200),
  body_markdown: z.string().min(1).max(50_000),
  tags: z.string().optional(),
});

export type State = { error?: string } | null;

export async function createKbArticleAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const tags = (parsed.data.tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const { data, error } = await supabase
    .from("kb_articles")
    .insert({
      org_id: session.orgId,
      slug: parsed.data.slug.toLowerCase(),
      title: parsed.data.title,
      body_markdown: parsed.data.body_markdown,
      tags: tags as never,
      author_id: session.userId,
      version: 1,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/console/kb");
  redirect(`/console/kb/${data.id}`);
}
