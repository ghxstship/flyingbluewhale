"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
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
