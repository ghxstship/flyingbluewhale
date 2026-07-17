"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type State = { error?: string } | null;

const SPACE_KINDS = ["team", "trade", "location", "club"] as const;

const RoomId = z.object({ roomId: z.string().uuid() });

/**
 * Join a space. RLS enforces the real rule (self-join is allowed only for
 * `room_kind = 'space'` rooms in my org — migration 20260716120000); the
 * checks here exist to return a readable error instead of a bare RLS denial.
 */
export async function joinSpace(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = RoomId.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid space." };
  const supabase = await createClient();

  const { data: room } = await supabase
    .from("chat_rooms")
    .select("id, room_kind")
    .eq("id", parsed.data.roomId)
    .eq("org_id", session.orgId)
    .eq("room_kind", "space")
    .is("deleted_at", null)
    .maybeSingle();
  if (!room) return { error: "Space not found." };

  const { error } = await supabase
    .from("chat_room_members")
    .insert({ room_id: parsed.data.roomId, user_id: session.userId, member_role: "member" });
  // Already a member reads as success, not failure — the join button was stale.
  if (error && !/duplicate key/i.test(error.message)) return { error: error.message };

  revalidatePath("/m/spaces");
  revalidatePath(`/m/spaces/${parsed.data.roomId}`);
  return null;
}

/** Leave a space — deletes my own membership row (RLS: own-row delete). */
export async function leaveSpace(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = RoomId.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid space." };
  const supabase = await createClient();

  const { error } = await supabase
    .from("chat_room_members")
    .delete()
    .eq("room_id", parsed.data.roomId)
    .eq("user_id", session.userId);
  if (error) return { error: error.message };

  revalidatePath("/m/spaces");
  revalidatePath(`/m/spaces/${parsed.data.roomId}`);
  return null;
}

const CreateSpace = z.object({
  name: z.string().trim().min(1).max(80),
  kind: z.enum(SPACE_KINDS),
  about: z.string().trim().max(500).optional(),
});

/**
 * Create a space. The kit's New Space FAB is a prototype stub (it toasts
 * "Name it, pick who's in, and post" and creates nothing) — this is the real
 * version of what that stub describes, not an extra feature.
 */
export async function createSpace(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = CreateSpace.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Name the space." };
  const supabase = await createClient();

  const { data: roomRow, error } = await supabase
    // soft-delete-exempt: insert-returning — .select("id") reads back the row just created
    .from("chat_rooms")
    .insert({
      org_id: session.orgId,
      room_kind: "space",
      space_kind: parsed.data.kind,
      name: parsed.data.name,
      about: parsed.data.about || null,
      created_by: session.userId,
      last_message_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error || !roomRow) return { error: error?.message ?? "Could not create the space" };
  const roomId = (roomRow as { id: string }).id;

  const { error: memberError } = await supabase
    .from("chat_room_members")
    .insert({ room_id: roomId, user_id: session.userId, member_role: "owner" });
  if (memberError) return { error: memberError.message };

  revalidatePath("/m/spaces");
  redirect(`/m/spaces/${roomId}`);
}
