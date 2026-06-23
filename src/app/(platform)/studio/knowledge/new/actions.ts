"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";

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

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createKnowledgeArticleAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const tags = (parsed.data.tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const slug = parsed.data.slug.toLowerCase();
  const { error } = await supabase.from("kb_articles").insert({
    org_id: session.orgId,
    slug,
    title: parsed.data.title,
    body_markdown: parsed.data.body_markdown,
    tags: tags as never,
    author_id: session.userId,
    version: 1,
  });
  if (error) return actionFail(error.message, fd);
  revalidatePath("/studio/knowledge");
  redirect(`/studio/knowledge/${slug}`);
}
