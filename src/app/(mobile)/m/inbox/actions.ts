"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { writeInboxBulk } from "@/lib/inbox";

const MsgSchema = z.object({
  roomId: z.string().uuid(),
  body: z.string().min(1).max(4000),
});

/** Row echoed back to the client island so it can reconcile its optimistic entry. */
export type SentMessage = {
  id: string;
  author_id: string | null;
  body: string;
  created_at: string;
};

export type State = { error?: string; sent?: SentMessage } | null;

export async function postMessage(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = MsgSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();

  // Membership check — RLS gates this too but explicit guard surfaces the
  // failure before we touch the messages table.
  const { data: member } = await supabase
    .from("chat_room_members")
    .select("room_id")
    .eq("room_id", parsed.data.roomId)
    .eq("user_id", session.userId)
    .maybeSingle();
  if (!member) return { error: "You are not a member of this room." };

  const now = new Date().toISOString();
  const { data: msg, error: msgError } = await supabase
    .from("chat_messages")
    .insert({ org_id: session.orgId, room_id: parsed.data.roomId, author_id: session.userId, body: parsed.data.body })
    .select("id, author_id, body, created_at")
    .single();
  if (msgError) return { error: `Could not send message: ${msgError.message}` };
  const { error: roomError } = await supabase
    .from("chat_rooms")
    .update({ last_message_at: now })
    .eq("id", parsed.data.roomId);
  if (roomError) return { error: `Could not update room: ${roomError.message}` };

  // Notify room members other than the author. Lands in /me/notifications/inbox
  // AND fires push, gated by the chat preference matrix.
  const { data: others } = await supabase
    .from("chat_room_members")
    .select("user_id")
    .eq("room_id", parsed.data.roomId)
    .neq("user_id", session.userId);
  const userIds = ((others ?? []) as Array<{ user_id: string }>).map((r) => r.user_id);
  if (userIds.length > 0 && msg) {
    void writeInboxBulk(userIds, {
      orgId: session.orgId,
      kind: "chat",
      sourceType: "chat_messages",
      sourceId: (msg as { id: string }).id,
      actorId: session.userId,
      title: "New message",
      body: parsed.data.body,
      href: `/m/inbox/${parsed.data.roomId}`,
    });
  }

  // The room view itself is owned by the ChatRoom client island (optimistic
  // append + realtime INSERT subscription) — only the inbox list needs a
  // server revalidate for last-message/unread ordering.
  revalidatePath("/m/inbox");

  return { sent: msg as SentMessage };
}

const ReadSchema = z.object({ roomId: z.string().uuid() });

export async function markRoomRead(input: { roomId: string }): Promise<void> {
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
