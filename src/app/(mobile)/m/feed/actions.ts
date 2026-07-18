"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * /m/feed write actions. createPost inserts a recognition_post (the community
 * feed's own post type) scoped to the caller's org. RLS re-checked server-side.
 */

export type State = { error?: string } | null;

/** Kit 32 A5 — the single "like" reaction. */
const LIKE_EMOJI = "👍";

const LikeSchema = z.object({
  // The feed merges two backing tables; the row id is prefixed at read time.
  kind: z.enum(["kudos", "ann"]),
  id: z.string().uuid(),
  on: z.enum(["1", "0"]),
});

export type LikeState = { ok?: true; error?: string } | null;

/**
 * Kit 32 A5 — toggle the caller's like on a feed post. Kudos posts store
 * reactions in `recognition_reactions`; announcements in the kit-32
 * `announcement_reactions` twin. Both are one-row-per (subject, user, emoji),
 * so the toggle is an idempotent insert / delete. RLS enforces org membership
 * + self-authorship server-side; a stale client can't like into another org.
 */
export async function toggleFeedLike(_prev: LikeState, fd: FormData): Promise<LikeState> {
  const session = await requireSession();
  const parsed = LikeSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { kind, id, on } = parsed.data;
  const supabase = await createClient();

  if (kind === "kudos") {
    if (on === "1") {
      const { error } = await supabase
        .from("recognition_reactions")
        .upsert(
          { post_id: id, user_id: session.userId, emoji: LIKE_EMOJI },
          { onConflict: "post_id,user_id,emoji", ignoreDuplicates: true },
        );
      if (error) return { error: error.message };
    } else {
      const { error } = await supabase
        .from("recognition_reactions")
        .delete()
        .eq("post_id", id)
        .eq("user_id", session.userId)
        .eq("emoji", LIKE_EMOJI);
      if (error) return { error: error.message };
    }
  } else {
    if (on === "1") {
      const { error } = await supabase
        .from("announcement_reactions")
        .upsert(
          { announcement_id: id, user_id: session.userId, emoji: LIKE_EMOJI },
          { onConflict: "announcement_id,user_id,emoji", ignoreDuplicates: true },
        );
      if (error) return { error: error.message };
    } else {
      const { error } = await supabase
        .from("announcement_reactions")
        .delete()
        .eq("announcement_id", id)
        .eq("user_id", session.userId)
        .eq("emoji", LIKE_EMOJI);
      if (error) return { error: error.message };
    }
  }

  revalidatePath("/m/feed");
  return { ok: true };
}

const PostSchema = z.object({
  message: z.string().min(1).max(2000),
});

export async function createPost(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = PostSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();

  // recognition_posts.to_user_id is NOT NULL — a community "update" has no
  // recipient, so we self-attribute (author = subject). This keeps the post a
  // valid recognition row without fabricating a separate feed table.
  const { error } = await supabase.from("recognition_posts").insert({
    org_id: session.orgId,
    from_user_id: session.userId,
    to_user_id: session.userId,
    message: parsed.data.message,
    visibility_state: "public",
  });
  if (error) return { error: error.message };

  revalidatePath("/m/feed");
  return null;
}
