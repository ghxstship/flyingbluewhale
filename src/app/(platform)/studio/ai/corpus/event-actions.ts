"use server";

import { revalidatePath } from "next/cache";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { kbVerification, isEventSyncable } from "@/lib/kb/verification";
import { postEmbedSource } from "@/lib/ai/embed-client";
import { emitAudit } from "@/lib/audit";
import { log } from "@/lib/log";
import { actionErrorMessage } from "@/lib/errors";

/**
 * L-P5 — event-scoped corpus sync actions (the knowledge grounding seam).
 *
 * "Sync to event" registers a VERIFIED kb article into one project's grounded
 * corpus (project_corpus_links) and (re-)embeds it through the existing
 * /api/v1/ai/embed-source endpoint — the same single write path the corpus
 * reindex walk uses. The embed is idempotent per (model, content hash), so
 * refresh after an edit re-embeds while an unchanged sync is a no-op.
 *
 * Verified-only gate: only an article whose verification is CURRENT (not
 * stale, not unverified) is event-syncable — the answer at the gate only
 * grounds on knowledge someone recently vouched for. Enforced server-side
 * here, mirrored in the UI copy.
 *
 * Requires migration 20260723150000_event_corpus_links; pre-application the
 * insert fails and the action reports it plainly.
 */

export type EventSyncState = { error?: string; ok?: true } | null;

const REVALIDATE = ["/studio/ai/corpus", "/studio/knowledge"];

type ArticleRow = {
  id: string;
  slug: string;
  title: string | null;
  body_markdown: string | null;
  verified_at: string | null;
  review_interval_days: number | null;
};

/**
 * Sync (or refresh) a verified kb article into a project's event corpus.
 * Upserts the link, re-embeds the article text, stamps last_synced_at.
 */
export async function syncArticleToEvent(articleId: string, projectId: string): Promise<EventSyncState> {
  const session = await requireSession();
  if (!isManagerPlus(session)) {
    return { error: actionErrorMessage("manager-role-or-higher-required", "Manager role or higher required.") };
  }
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { data: articleRow } = await supabase
    .from("kb_articles")
    .select("id, slug, title, body_markdown, verified_at, review_interval_days")
    .eq("id", articleId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  const article = articleRow as ArticleRow | null;
  if (!article) return { error: actionErrorMessage("not-found.kb-article", "Kb Article not found.") };

  // Verified-only gate — stale or unverified knowledge never grounds an event.
  const verification = kbVerification(article.verified_at, article.review_interval_days ?? 180, Date.now());
  if (!isEventSyncable(verification)) {
    return {
      error: actionErrorMessage("only-verified-articles-are-event-syncable", "Only verified articles can be synced to an event. Verify (or re-verify) the article first."),
    };
  }

  const { data: projectRow } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!projectRow) return { error: actionErrorMessage("not-found.project-3", "Project not found.") };

  const { error: linkError } = await supabase.from("project_corpus_links").upsert(
    {
      org_id: session.orgId,
      project_id: projectId,
      source_type: "kb_article",
      source_id: article.id,
      synced_by: session.userId,
    },
    { onConflict: "org_id,project_id,source_type,source_id" },
  );
  if (linkError) {
    log.error("corpus.event_link.failed", { err: linkError.message });
    return {
      error: actionErrorMessage(
        "event-corpus-sync-unavailable",
        "Event corpus sync is not available yet (pending migration).",
      ),
    };
  }

  // Re-embed through the canonical write path. Idempotent on unchanged text.
  const text = [article.title ?? "", article.body_markdown ?? ""].filter(Boolean).join("\n\n");
  const embedded = text
    ? await postEmbedSource({ sourceType: "kb_article", sourceId: article.id, text })
    : { error: actionErrorMessage("article-has-no-text-to-embed", "Article has no text to embed.") };
  if (!embedded.error) {
    await supabase
      .from("project_corpus_links")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("org_id", session.orgId)
      .eq("project_id", projectId)
      .eq("source_type", "kb_article")
      .eq("source_id", article.id);
  }

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "corpus.event_sync",
    targetTable: "project_corpus_links",
    targetId: article.id,
    metadata: { projectId, embedded: !embedded.error, ...(embedded.error ? { embedError: embedded.error } : {}) },
  });

  for (const p of REVALIDATE) revalidatePath(p);
  revalidatePath(`/studio/knowledge/${article.slug}`);

  if (embedded.error) {
    // Link registered but the embed failed (commonly: no provider key).
    return { error: `Linked, but embedding failed. ${embedded.error}` };
  }
  return { ok: true };
}

/** Remove a source from a project's event corpus (hard delete of the link). */
export async function removeCorpusLink(projectId: string, sourceType: string, sourceId: string): Promise<EventSyncState> {
  const session = await requireSession();
  if (!isManagerPlus(session)) {
    return { error: actionErrorMessage("manager-role-or-higher-required", "Manager role or higher required.") };
  }
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { error } = await supabase
    .from("project_corpus_links")
    .delete()
    .eq("org_id", session.orgId)
    .eq("project_id", projectId)
    .eq("source_type", sourceType)
    .eq("source_id", sourceId);
  if (error) {
    return {
      error: actionErrorMessage(
        "event-corpus-sync-unavailable",
        "Event corpus sync is not available yet (pending migration).",
      ),
    };
  }

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "corpus.event_unsync",
    targetTable: "project_corpus_links",
    targetId: sourceId,
    metadata: { projectId, sourceType },
  });

  for (const p of REVALIDATE) revalidatePath(p);
  return { ok: true };
}

/** Form-shaped wrapper for the corpus page's add form (article + project selects). */
export async function syncArticleFromForm(formData: FormData): Promise<void> {
  const articleId = String(formData.get("articleId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  if (!articleId || !projectId) return;
  await syncArticleToEvent(articleId, projectId);
}

/** Void wrapper for per-row Refresh forms (re-embed + bump last_synced_at). */
export async function refreshLinkAction(articleId: string, projectId: string): Promise<void> {
  await syncArticleToEvent(articleId, projectId);
}

/** Void wrapper for per-row Remove forms. */
export async function removeLinkAction(projectId: string, sourceType: string, sourceId: string): Promise<void> {
  await removeCorpusLink(projectId, sourceType, sourceId);
}
