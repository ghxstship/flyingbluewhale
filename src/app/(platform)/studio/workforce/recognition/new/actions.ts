"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { writeInbox } from "@/lib/inbox";

const Schema = z.object({
  to_user_id: z.string().uuid(),
  message: z.string().min(1).max(500),
  value_tag: z.string().max(40).optional().or(z.literal("")),
});

/**
 * Desktop counterpart to src/app/(mobile)/m/kudos/actions.ts#createKudos.
 * Same write + push fan-out; separate action so the desktop redirect
 * after success returns to /studio/workforce/recognition (the admin
 * landing) rather than the mobile /m/kudos feed.
 */
export async function createKudosFromConsole(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  if (parsed.data.to_user_id === session.userId) return;
  const supabase = await createClient();

  // Recipient must be an active org member — same gate as the mobile action.
  const { data: member } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("org_id", session.orgId)
    .eq("user_id", parsed.data.to_user_id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!member) return;

  const { error, data: post } = await supabase
    .from("recognition_posts")
    .insert({
      org_id: session.orgId,
      from_user_id: session.userId,
      to_user_id: parsed.data.to_user_id,
      message: parsed.data.message,
      value_tag: parsed.data.value_tag || null,
      points: 0,
      visibility_state: "public",
    })
    .select("id")
    .single();
  if (error) throw new Error(`Could not create recognition post: ${error.message}`);

  if (post) {
    void writeInbox({
      userId: parsed.data.to_user_id,
      orgId: session.orgId,
      kind: "kudos",
      sourceType: "recognition_posts",
      sourceId: (post as { id: string }).id,
      actorId: session.userId,
      title: "You got kudos",
      body: parsed.data.message,
      href: "/m/feed",
    });
  }

  revalidatePath("/studio/workforce/recognition");
  revalidatePath("/m/feed");
}
