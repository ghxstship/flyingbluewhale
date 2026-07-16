"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createChannelRoom, findOrCreateDirectRoom } from "@/lib/db/chat-rooms";

export type State = { error?: string } | null;

const ReadSchema = z.object({
  roomId: z.string().uuid(),
  read: z.enum(["1", ""]),
});

/**
 * Toggle my read cursor on a room (the kit inbox's swipe Read/Unread action).
 *
 * "Read" stamps `last_read_at = now`; "unread" clears it, which makes every
 * message in the room count as unread again — the same trick every mail
 * client's mark-unread uses. Own-membership only: the explicit `user_id`
 * filter means the worst a crafted call can do is mark the caller's own
 * cursor, and RLS agrees.
 */
export async function setRoomRead(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = ReadSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request." };
  const supabase = await createClient();

  const { error } = await supabase
    .from("chat_room_members")
    .update({ last_read_at: parsed.data.read === "1" ? new Date().toISOString() : null })
    .eq("room_id", parsed.data.roomId)
    .eq("user_id", session.userId);
  if (error) return { error: error.message };

  revalidatePath("/m/inbox");
  return null;
}

const ChannelSchema = z.object({ name: z.string().trim().min(1).max(80) });

/** New channel (the compose screen's Channel segment). */
export async function createMobileChannel(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = ChannelSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Name the channel." };
  const supabase = await createClient();

  const result = await createChannelRoom(supabase, session, parsed.data.name);
  if ("error" in result) return { error: result.error };

  revalidatePath("/m/inbox");
  redirect(`/m/inbox/${result.roomId}`);
}

const DmSchema = z.object({ userId: z.string().uuid() });

/** New DM (the compose screen's Direct Message segment). Find-or-create. */
export async function startMobileDm(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = DmSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Pick a person." };
  const supabase = await createClient();

  const result = await findOrCreateDirectRoom(supabase, session, parsed.data.userId);
  if ("error" in result) return { error: result.error };

  revalidatePath("/m/inbox");
  redirect(`/m/inbox/${result.roomId}`);
}
