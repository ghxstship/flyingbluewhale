"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { assertLegendWrite } from "@/lib/legend_access";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { POST_CATEGORIES } from "@/lib/legend_community";

export type State = { error?: string; ok?: true } | null;

/** Points awarded for an accepted community contribution (shared ledger). */
const POST_POINTS = 5;

/**
 * Create a community post and credit the author contribution points to the
 * shared gamification ledger (source='legend').
 */
export async function createPostAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const denied = assertLegendWrite(session);
  if (denied) return denied;
  const parsed = z
    .object({
      title: z.string().min(1, "Title is required").max(200),
      body_html: z.string().max(20000).optional().or(z.literal("")),
      category: z.enum(POST_CATEGORIES).default("general"),
    })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid post" };
  const d = parsed.data;
  const db = (await createClient()) as unknown as LooseSupabase;

  const { data: post, error } = await db
    .from("community_posts")
    .insert({
      org_id: session.orgId,
      author_id: session.userId,
      title: d.title,
      body_html: d.body_html || "",
      category: d.category,
      post_state: "published",
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  await db.from("points_ledger").insert({
    org_id: session.orgId,
    user_id: session.userId,
    points: POST_POINTS,
    reason: "Community post",
    source: "legend",
    ref_kind: "community_post",
    ref_id: post.id,
  });

  revalidatePath("/legend/community");
  return { ok: true };
}

/**
 * Toggle a "like" reaction on a post and keep the denormalized count in sync.
 */
export async function toggleReactionAction(postId: string): Promise<{ error?: string; liked?: boolean }> {
  const session = await requireSession();
  const denied = assertLegendWrite(session);
  if (denied) return denied;
  if (!z.string().uuid().safeParse(postId).success) return { error: "Invalid post" };
  const db = (await createClient()) as unknown as LooseSupabase;

  const { data: existing } = await db
    .from("community_reactions")
    .select("id")
    .eq("org_id", session.orgId)
    .eq("post_id", postId)
    .eq("user_id", session.userId)
    .eq("kind", "like")
    .maybeSingle();

  const { data: post } = await db.from("community_posts").select("like_count").eq("id", postId).maybeSingle();
  const count = (post?.like_count as number | undefined) ?? 0;

  if (existing) {
    await db.from("community_reactions").delete().eq("id", existing.id);
    await db.from("community_posts").update({ like_count: Math.max(0, count - 1) }).eq("id", postId);
    revalidatePath("/legend/community");
    return { liked: false };
  }
  await db.from("community_reactions").insert({ org_id: session.orgId, post_id: postId, user_id: session.userId, kind: "like" });
  await db.from("community_posts").update({ like_count: count + 1 }).eq("id", postId);
  revalidatePath("/legend/community");
  return { liked: true };
}

/** Add a comment (answer) to a post and keep the denormalized count honest. */
export async function addCommentAction(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const denied = assertLegendWrite(session);
  if (denied) return denied;
  const parsed = z
    .object({ postId: z.string().uuid(), body_html: z.string().min(1, "Say something").max(20000) })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid comment" };
  const db = (await createClient()) as unknown as LooseSupabase;

  const { error } = await db.from("community_comments").insert({
    org_id: session.orgId,
    post_id: parsed.data.postId,
    author_id: session.userId,
    body_html: parsed.data.body_html,
  });
  if (error) return { error: error.message };

  const { data: post } = await db.from("community_posts").select("comment_count").eq("id", parsed.data.postId).maybeSingle();
  await db
    .from("community_posts")
    .update({ comment_count: ((post?.comment_count as number | undefined) ?? 0) + 1 })
    .eq("id", parsed.data.postId);

  revalidatePath(`/legend/community/${parsed.data.postId}`);
  return { ok: true };
}

/**
 * Accept an answer (kit 21 remediation R2, ADR-0015; Discourse/SO Q&A). Only
 * the question's author may accept, and only on a `questions`-category post.
 * Stamps `community_posts.accepted_comment_id` and credits the answerer.
 */
export async function acceptAnswerAction(postId: string, commentId: string): Promise<void> {
  const session = await requireSession();
  const denied = assertLegendWrite(session);
  if (denied) throw new Error(denied.error);
  const db = (await createClient()) as unknown as LooseSupabase;

  const { data: post } = await db
    .from("community_posts")
    .select("id, author_id, category, accepted_comment_id")
    .eq("id", postId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!post || post.author_id !== session.userId || post.category !== "questions") return;

  // Toggle: accepting the already-accepted answer clears it.
  const next = post.accepted_comment_id === commentId ? null : commentId;
  await db.from("community_posts").update({ accepted_comment_id: next }).eq("id", postId);

  if (next) {
    const { data: comment } = await db.from("community_comments").select("author_id").eq("id", commentId).maybeSingle();
    const answerer = comment?.author_id as string | undefined;
    if (answerer && answerer !== session.userId) {
      await db.from("points_ledger").insert({
        org_id: session.orgId,
        user_id: answerer,
        points: POST_POINTS,
        reason: "Accepted answer",
        source: "legend",
        ref_kind: "community_comment",
        ref_id: commentId,
      });
    }
  }
  revalidatePath(`/legend/community/${postId}`);
}
