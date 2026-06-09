"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { writeInboxBulk } from "@/lib/inbox";
import { projectIdFromSlug } from "@/lib/db/advancing";

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
  const { data: room } = await supabase
    .from("chat_rooms")
    .select("id, org_id")
    .eq("id", roomId)
    .eq("org_id", project.org_id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!room) throw new Error("Thread not found");

  // Membership check — RLS gates this too but explicit guard surfaces the
  // failure before we touch the messages table.
  const { data: member } = await supabase
    .from("chat_room_members")
    .select("room_id")
    .eq("room_id", roomId)
    .eq("user_id", session.userId)
    .maybeSingle();
  if (!member) throw new Error("You are not a member of this thread");

  const now = new Date().toISOString();
  const { data: msg, error: msgError } = await supabase
    .from("chat_messages")
    .insert({ org_id: project.org_id, room_id: roomId, author_id: session.userId, body })
    .select("id")
    .single();
  if (msgError) throw new Error(`Could not send message: ${msgError.message}`);
  const { error: roomError } = await supabase.from("chat_rooms").update({ last_message_at: now }).eq("id", roomId);
  if (roomError) throw new Error(`Could not update room: ${roomError.message}`);

  // Notify room members other than the author — same fan-out as the mobile
  // post action. The other side of an AM thread is org staff, whose chat
  // surface is /m/inbox, so the href stays mobile-side.
  const { data: others } = await supabase
    .from("chat_room_members")
    .select("user_id")
    .eq("room_id", roomId)
    .neq("user_id", session.userId);
  const userIds = ((others ?? []) as Array<{ user_id: string }>).map((r) => r.user_id);
  if (userIds.length > 0 && msg) {
    void writeInboxBulk(userIds, {
      orgId: project.org_id,
      kind: "chat",
      sourceType: "chat_messages",
      sourceId: (msg as { id: string }).id,
      actorId: session.userId,
      title: "New message",
      body,
      href: `/m/inbox/${roomId}`,
    });
  }

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
