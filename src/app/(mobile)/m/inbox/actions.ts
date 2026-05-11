"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendPushBulk } from "@/lib/push/send";

const MsgSchema = z.object({
  roomId: z.string().uuid(),
  body: z.string().min(1).max(4000),
});

export async function postMessage(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = MsgSchema.parse(Object.fromEntries(fd));
  const supabase = await createClient();

  // Membership check — RLS gates this too but explicit guard surfaces the
  // failure before we touch the messages table.
  const { data: member } = await supabase
    .from("chat_room_members")
    .select("room_id")
    .eq("room_id", parsed.roomId)
    .eq("user_id", session.userId)
    .maybeSingle();
  if (!member) return;

  const now = new Date().toISOString();
  await supabase
    .from("chat_messages")
    .insert({ org_id: session.orgId, room_id: parsed.roomId, author_id: session.userId, body: parsed.body });
  await supabase.from("chat_rooms").update({ last_message_at: now }).eq("id", parsed.roomId);

  // Push notify room members other than the author. Service role isn't
  // needed here — RLS on chat_room_members already lets a member read
  // the membership list of rooms they belong to.
  const { data: others } = await supabase
    .from("chat_room_members")
    .select("user_id")
    .eq("room_id", parsed.roomId)
    .neq("user_id", session.userId);
  const userIds = ((others ?? []) as Array<{ user_id: string }>).map((r) => r.user_id);
  if (userIds.length > 0) {
    void sendPushBulk(userIds, {
      title: "New message",
      body: parsed.body.slice(0, 200),
      url: `/m/inbox/${parsed.roomId}`,
      tag: `chat:${parsed.roomId}`,
    });
  }

  revalidatePath(`/m/inbox/${parsed.roomId}`);
  revalidatePath("/m/inbox");
}

const ReadSchema = z.object({ roomId: z.string().uuid() });

export async function markRoomRead(input: { roomId: string }): Promise<void> {
  const session = await requireSession();
  const parsed = ReadSchema.parse(input);
  const supabase = await createClient();
  await supabase
    .from("chat_room_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("room_id", parsed.roomId)
    .eq("user_id", session.userId);
}
