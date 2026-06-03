"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { writeInboxBulk } from "@/lib/inbox";

const Schema = z.object({
  message: z.string().min(1).max(2000),
  recipient_ids: z.string().min(1),
});

export type State = { error?: string; sent?: number } | null;

export async function broadcastDmAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can send broadcast DMs" };

  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const recipientIds = parsed.data.recipient_ids
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (recipientIds.length === 0) return { error: "Select at least one recipient" };
  if (recipientIds.length > 200) return { error: "Maximum 200 recipients per broadcast" };

  const supabase = await createClient();

  // Verify all recipients belong to the org.
  const { data: members } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .in("user_id", recipientIds);

  const validIds = new Set((members ?? []).map((m) => m.user_id));
  const safeIds = recipientIds.filter((id) => validIds.has(id));
  if (safeIds.length === 0) return { error: "No valid recipients found" };

  // Create a direct chat_room per recipient. Each room is a private
  // 1:1 between the sender and recipient — broadcast DM sends one
  // room + message per person so replies stay private.
  let sent = 0;
  for (const recipientId of safeIds) {
    const { data: room, error: roomErr } = await supabase
      .from("chat_rooms")
      .insert({
        org_id: session.orgId,
        name: null,
        room_kind: "direct",
        created_by: session.userId,
      })
      .select("id")
      .single();
    if (roomErr || !room) continue;
    const roomId = room.id;

    // Add both members.
    await supabase.from("chat_room_members").insert([
      { room_id: roomId, user_id: session.userId },
      { room_id: roomId, user_id: recipientId },
    ]);

    // Insert the message.
    const { data: msg } = await supabase
      .from("chat_messages")
      .insert({
        room_id: roomId,
        author_id: session.userId,
        org_id: session.orgId,
        body: parsed.data.message,
      })
      .select("id")
      .single();

    if (!msg) continue;
    sent++;

    // Notify recipient via inbox + push.
    await writeInboxBulk([recipientId], {
      orgId: session.orgId,
      kind: "chat_message",
      sourceType: "chat_messages",
      sourceId: msg.id,
      actorId: session.userId,
      title: "New direct message",
      body: parsed.data.message.slice(0, 120),
      href: `/m/inbox/${roomId}`,
      push: true,
    });
  }

  revalidatePath("/console/comms/broadcast");
  return { sent };
}
