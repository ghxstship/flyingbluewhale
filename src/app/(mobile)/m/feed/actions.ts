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
