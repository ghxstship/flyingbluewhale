"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * /m/inbox/[roomId] write actions. Every send is org-pinned and membership-
 * gated server-side (RLS guards the table too; the explicit checks make the
 * failure deterministic). Mirrors the portal chat action shape.
 */

export type State = { error?: string } | null;

const MsgSchema = z.object({
  roomId: z.string().uuid(),
  body: z.string().min(1).max(4000),
});

export async function sendMessage(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = MsgSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { roomId, body } = parsed.data;
  const supabase = await createClient();

  // Org pin — the room must belong to the caller's org.
  const { data: room } = await supabase
    .from("chat_rooms")
    .select("id, org_id")
    .eq("id", roomId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!room) return { error: "Thread not found." };

  // Membership check.
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

  await supabase.from("chat_rooms").update({ last_message_at: now }).eq("id", roomId);

  revalidatePath(`/m/inbox/${roomId}`);
  return null;
}
