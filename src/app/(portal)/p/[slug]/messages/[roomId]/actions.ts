"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { sendChatMessage } from "@/lib/db/chat-send";

/**
 * Portal-native chat actions for /p/[slug]/messages/[roomId]. Mirrors the
 * mobile inbox actions (src/app/(mobile)/m/inbox/actions.ts) but pins every
 * write to the slug's project org so a portal session can never post into a
 * room outside the portal it's standing in.
 */

const MsgSchema = z.object({
  slug: z.string().min(1),
  roomId: z.string().uuid(),
  body: z.string().min(1).max(4000),
});

export async function postPortalMessage(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = MsgSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  const { slug, roomId, body } = parsed.data;
  const supabase = await createClient();

  // Org pin — the room must belong to the same org as the slug's project.
  const project = await projectIdFromSlug(slug);
  if (!project) throw new Error("Unknown project");
  // Shared send (src/lib/db/chat-send.ts): guards, insert, cursor stamps,
  // inbox/push fan-out. The org pin uses the slug's project org so a portal
  // session can never post into a room outside the portal it stands in.
  const result = await sendChatMessage({
    supabase,
    orgId: project.org_id,
    authorId: session.userId,
    roomId,
    body,
  });
  if ("error" in result) throw new Error(result.error);

  revalidatePath(`/p/${slug}/messages/${roomId}`);
  revalidatePath(`/p/${slug}/messages`);
}

const ReadSchema = z.object({ roomId: z.string().uuid() });

export async function markPortalRoomRead(input: { roomId: string }): Promise<void> {
  const session = await requireSession();
  const parsed = ReadSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  const supabase = await createClient();
  const { error } = await supabase
    .from("chat_room_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("room_id", parsed.data.roomId)
    .eq("user_id", session.userId);
  if (error) throw new Error(`Could not mark room read: ${error.message}`);
}
