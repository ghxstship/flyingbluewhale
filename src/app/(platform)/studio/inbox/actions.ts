"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Console inbox write actions (kit 20 Inbox M-series). Mirrors the COMPVSS
 * `/m/inbox/[roomId]` action guards — org pin + explicit membership check on
 * every send (RLS backstops the table; the checks make failures
 * deterministic) — plus the console-side New Channel / New DM intakes the
 * kit's M2 contract asks for.
 */

export type State = { error?: string } | null;

const MsgSchema = z.object({
  roomId: z.string().uuid(),
  body: z.string().min(1).max(4000),
});

export async function sendConsoleMessage(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = MsgSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { roomId, body } = parsed.data;
  const supabase = await createClient();

  const { data: room } = await supabase
    .from("chat_rooms")
    .select("id, org_id")
    .eq("id", roomId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!room) return { error: "Thread not found." };

  const { data: member } = await supabase
    .from("chat_room_members")
    .select("room_id")
    .eq("room_id", roomId)
    .eq("user_id", session.userId)
    .maybeSingle();
  if (!member) return { error: "You are not a member of this thread." };

  const now = new Date().toISOString();
  const { error: msgError } = await supabase
    .from("chat_messages")
    .insert({ org_id: session.orgId, room_id: roomId, author_id: session.userId, body });
  if (msgError) return { error: msgError.message };

  await Promise.all([
    supabase.from("chat_rooms").update({ last_message_at: now }).eq("id", roomId),
    supabase
      .from("chat_room_members")
      .update({ last_read_at: now })
      .eq("room_id", roomId)
      .eq("user_id", session.userId),
  ]);

  revalidatePath("/studio/inbox");
  return null;
}

const ChannelSchema = z.object({ name: z.string().min(1).max(80) });

export async function createChannelAction(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = ChannelSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();

  const { data: roomRow, error } = await supabase
    .from("chat_rooms")
    .insert({
      org_id: session.orgId,
      room_kind: "channel",
      name: parsed.data.name,
      created_by: session.userId,
      last_message_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error || !roomRow) return { error: error?.message ?? "Could not create the channel" };
  const roomId = (roomRow as { id: string }).id;

  const { error: memberError } = await supabase
    .from("chat_room_members")
    .insert({ room_id: roomId, user_id: session.userId, member_role: "owner" });
  if (memberError) return { error: memberError.message };

  revalidatePath("/studio/inbox");
  redirect(`/studio/inbox?room=${roomId}`);
}

const DmSchema = z.object({ userId: z.string().uuid() });

export async function startDmAction(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = DmSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Pick a person" };
  const otherId = parsed.data.userId;
  if (otherId === session.userId) return { error: "Pick someone other than yourself" };
  const supabase = await createClient();

  // The other party must be a member of this org — no cross-org DMs.
  const { data: otherMember } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("org_id", session.orgId)
    .eq("user_id", otherId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!otherMember) return { error: "That person is not in this workspace" };

  // Find-or-create: an existing direct room whose membership is exactly us two.
  const { data: myRooms } = await supabase.from("chat_room_members").select("room_id").eq("user_id", session.userId);
  const myRoomIds = ((myRooms ?? []) as Array<{ room_id: string }>).map((r) => r.room_id);

  if (myRoomIds.length > 0) {
    const { data: directRooms } = await supabase
      .from("chat_rooms")
      .select("id")
      .eq("org_id", session.orgId)
      .eq("room_kind", "direct")
      .is("deleted_at", null)
      .in("id", myRoomIds);
    const directIds = ((directRooms ?? []) as Array<{ id: string }>).map((r) => r.id);
    if (directIds.length > 0) {
      const { data: partners } = await supabase
        .from("chat_room_members")
        .select("room_id, user_id")
        .in("room_id", directIds)
        .eq("user_id", otherId);
      const existing = ((partners ?? []) as Array<{ room_id: string }>)[0]?.room_id;
      if (existing) redirect(`/studio/inbox?room=${existing}`);
    }
  }

  const { data: roomRow, error } = await supabase
    .from("chat_rooms")
    .insert({
      org_id: session.orgId,
      room_kind: "direct",
      created_by: session.userId,
      last_message_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error || !roomRow) return { error: error?.message ?? "Could not start the conversation" };
  const roomId = (roomRow as { id: string }).id;

  const { error: memberError } = await supabase.from("chat_room_members").insert([
    { room_id: roomId, user_id: session.userId, member_role: "owner" },
    { room_id: roomId, user_id: otherId, member_role: "member" },
  ]);
  if (memberError) return { error: memberError.message };

  revalidatePath("/studio/inbox");
  redirect(`/studio/inbox?room=${roomId}`);
}

// ── Thread management (kit 21 W5) — pin/mute/leave/mark-unread + reactions.
// All are membership-scoped: the RLS + the explicit user_id filter mean a
// caller can only ever touch their own membership row / their own reaction.

/** Toggle pinned_at on my membership — pinned rooms sort first in the list. */
export async function toggleRoomPin(roomId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("chat_room_members")
    .select("pinned_at")
    .eq("room_id", roomId)
    .eq("user_id", session.userId)
    .maybeSingle();
  if (!row) return;
  await supabase
    .from("chat_room_members")
    .update({ pinned_at: (row as { pinned_at: string | null }).pinned_at ? null : new Date().toISOString() })
    .eq("room_id", roomId)
    .eq("user_id", session.userId);
  revalidatePath("/studio/inbox");
}

/** Toggle muted_at — muted rooms drop their unread badge + sidebar count. */
export async function toggleRoomMute(roomId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("chat_room_members")
    .select("muted_at")
    .eq("room_id", roomId)
    .eq("user_id", session.userId)
    .maybeSingle();
  if (!row) return;
  await supabase
    .from("chat_room_members")
    .update({ muted_at: (row as { muted_at: string | null }).muted_at ? null : new Date().toISOString() })
    .eq("room_id", roomId)
    .eq("user_id", session.userId);
  revalidatePath("/studio/inbox");
}

/** Rewind last_read_at so the room reads as unread again (Linear "mark unread"). */
export async function markRoomUnread(roomId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase
    .from("chat_room_members")
    .update({ last_read_at: null })
    .eq("room_id", roomId)
    .eq("user_id", session.userId);
  revalidatePath("/studio/inbox");
}

/** Leave a channel — drops my membership row. Direct rooms can't be left
 *  (there's no re-invite path), so this is channel-only. */
export async function leaveRoom(roomId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { data: room } = await supabase
    .from("chat_rooms")
    .select("room_kind")
    .eq("id", roomId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!room || (room as { room_kind: string }).room_kind === "direct") return;
  await supabase.from("chat_room_members").delete().eq("room_id", roomId).eq("user_id", session.userId);
  revalidatePath("/studio/inbox");
  redirect("/studio/inbox");
}

const REACTION_EMOJI = new Set(["👍", "❤️", "🎉", "👀"]);

/** Toggle one of the four curated reactions on a message. Insert if absent,
 *  delete if present (the unique (message_id, user_id, emoji) makes it a
 *  clean upsert-or-remove). */
export async function toggleReaction(messageId: string, emoji: string): Promise<void> {
  if (!REACTION_EMOJI.has(emoji)) return;
  const session = await requireSession();
  const supabase = await createClient();

  const { data: msg } = await supabase
    .from("chat_messages")
    .select("id, org_id, room_id")
    .eq("id", messageId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!msg) return;
  const message = msg as { id: string; org_id: string; room_id: string };

  const { data: existing } = await supabase
    .from("chat_message_reactions")
    .select("id")
    .eq("message_id", messageId)
    .eq("user_id", session.userId)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing) {
    await supabase.from("chat_message_reactions").delete().eq("id", (existing as { id: string }).id);
  } else {
    await supabase.from("chat_message_reactions").insert({
      org_id: message.org_id,
      room_id: message.room_id,
      message_id: messageId,
      user_id: session.userId,
      emoji,
    });
  }
  revalidatePath("/studio/inbox");
}
