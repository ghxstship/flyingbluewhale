"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { postEmbedSource } from "@/lib/ai/embed-client";
import { STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { actionFail, formFail } from "@/lib/forms/fail";

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

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateKnowledgeArticle(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const tagList = parsed.data.tags
    ? parsed.data.tags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const supabase = await createClient();
  const slug = parsed.data.slug.toLowerCase();
  // Sea Trial FINDING-022: optimistic concurrency. kb_articles is keyed by
  // slug (not id), so the standard helper doesn't apply — same pattern
  // inlined.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  if (!expectedUpdatedAt) return { error: STALE_ROW_MESSAGE };
  const expectedVersion = Number(fd.get("_version") ?? 0) || 0;
  const { data, error } = await supabase
    .from("kb_articles")
    .update({
      title: parsed.data.title,
      slug,
      body_markdown: parsed.data.body_markdown,
      tags: tagList as never,
      version: expectedVersion + 1,
    })
    .eq("slug", parsed.data.slug_current)
    .eq("org_id", session.orgId)
    .eq("updated_at", expectedUpdatedAt)
    .select("id")
    .maybeSingle();
  if (error) return actionFail(error.message, fd);
  if (!data) return { error: STALE_ROW_MESSAGE };

  // L-P5 event corpus: if this article is synced into any event's corpus,
  // re-embed the edited text so grounded answers track the change (the embed
  // path is idempotent per content hash). Best-effort — on failure the corpus
  // panel shows "Edited since sync" and offers Refresh.
  try {
    const loose = supabase as unknown as LooseSupabase;
    const { data: links, error: linksError } = await loose
      .from("project_corpus_links")
      .select("project_id")
      .eq("org_id", session.orgId)
      .eq("source_type", "kb_article")
      .eq("source_id", data.id);
    const text = [parsed.data.title, parsed.data.body_markdown].filter(Boolean).join("\n\n");
    if (!linksError && (links ?? []).length > 0 && text) {
      const embedded = await postEmbedSource({ sourceType: "kb_article", sourceId: data.id, text });
      if (!embedded.error) {
        await loose
          .from("project_corpus_links")
          .update({ last_synced_at: new Date().toISOString() })
          .eq("org_id", session.orgId)
          .eq("source_type", "kb_article")
          .eq("source_id", data.id);
      }
    }
  } catch {
    // Pending migration or embed provider missing — derived staleness covers it.
  }

  revalidatePath(`/studio/knowledge/${slug}`);
  if (slug !== parsed.data.slug_current) revalidatePath(`/studio/knowledge/${parsed.data.slug_current}`);
  revalidatePath("/studio/knowledge");
  redirect(`/studio/knowledge/${slug}`);
}

export async function deleteKnowledgeArticle(slug: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.from("kb_articles").delete().eq("slug", slug).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete kb article: ${error.message}`);
  revalidatePath("/studio/knowledge");
  redirect("/studio/knowledge");
}
