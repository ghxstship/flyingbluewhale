"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { writeInbox } from "@/lib/inbox";

const REACTION_EMOJIS = ["👏", "🙌", "🔥", "💯", "🚀", "❤️"] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

const Schema = z.object({
  to_user_id: z.string().uuid(),
  message: z.string().min(1).max(500),
  value_tag: z.string().max(40).optional().or(z.literal("")),
});

export async function createKudos(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = Schema.parse(Object.fromEntries(fd));
  if (parsed.to_user_id === session.userId) return;
  const supabase = await createClient();

  // Recipient must be an active org member. Without this any user could
  // hand kudos to someone outside the org by guessing their UUID.
  const { data: member } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("org_id", session.orgId)
    .eq("user_id", parsed.to_user_id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!member) return;

  const { data: post } = await supabase
    .from("recognition_posts")
    .insert({
      org_id: session.orgId,
      from_user_id: session.userId,
      to_user_id: parsed.to_user_id,
      message: parsed.message,
      value_tag: parsed.value_tag || null,
      points: 0,
      visibility_state: "public",
    })
    .select("id")
    .single();

  // Notify the recipient — lands in /me/notifications/inbox AND fires
  // push, gated by the kudos preference matrix. Source-keyed so retries
  // don't duplicate.
  if (post) {
    void writeInbox({
      userId: parsed.to_user_id,
      orgId: session.orgId,
      kind: "kudos",
      sourceType: "recognition_posts",
      sourceId: (post as { id: string }).id,
      actorId: session.userId,
      title: "You got kudos",
      body: parsed.message,
      href: "/m/kudos",
    });
  }

  revalidatePath("/m/kudos");
}

const ReactSchema = z.object({
  post_id: z.string().uuid(),
  emoji: z.enum(REACTION_EMOJIS),
});

// Toggle: if the (post, user, emoji) row exists, remove it; else insert.
// recognition_reactions PK is (post_id, user_id, emoji) so this is the
// natural like/unlike pattern without needing a separate "remove" route.
export async function toggleReaction(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = ReactSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;

  const supabase = await createClient();
  // Ensure the post is in the caller's org — recognition_posts.org_id
  // gates reactions transitively, but a pre-check produces clean UX
  // on tampered hidden inputs.
  const { data: post } = await supabase
    .from("recognition_posts")
    .select("id")
    .eq("id", parsed.data.post_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!post) return;

  const { data: existing } = await supabase
    .from("recognition_reactions")
    .select("post_id")
    .eq("post_id", parsed.data.post_id)
    .eq("user_id", session.userId)
    .eq("emoji", parsed.data.emoji)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("recognition_reactions")
      .delete()
      .eq("post_id", parsed.data.post_id)
      .eq("user_id", session.userId)
      .eq("emoji", parsed.data.emoji);
  } else {
    await supabase.from("recognition_reactions").insert({
      post_id: parsed.data.post_id,
      user_id: session.userId,
      emoji: parsed.data.emoji,
    });
  }

  revalidatePath("/m/kudos");
}
