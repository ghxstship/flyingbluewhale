import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Session } from "@/lib/auth";

/**
 * Chat-room creation — shared by the console inbox (`/studio/inbox`) and the
 * COMPVSS field inbox (`/m/inbox`).
 *
 * Extracted so the two shells can't fork the way time-off did (the mobile
 * action grew its own approve that skipped the balance RPC — see
 * src/lib/db/time-off.ts). The room stores are the same tables in both
 * shells; only navigation differs, so navigation stays with the caller and
 * everything else lives here.
 *
 * The console's actions predate this module and still carry their own copy;
 * converging them is flagged, not done here — that file is actively edited
 * territory (kit 21 W5 pin/mute) and a merge conflict helps nobody.
 */
export type RoomResult = { roomId: string } | { error: string };

/** Create a named channel with the caller as owner. */
export async function createChannelRoom(
  supabase: SupabaseClient,
  session: Session,
  name: string,
): Promise<RoomResult> {
  const { data: roomRow, error } = await supabase
    .from("chat_rooms")
    .insert({
      org_id: session.orgId,
      room_kind: "channel",
      name,
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
  return { roomId };
}

/**
 * Find the existing 1:1 direct room with `otherId`, or create it. The other
 * party must be a live member of the caller's org — no cross-org DMs.
 */
export async function findOrCreateDirectRoom(
  supabase: SupabaseClient,
  session: Session,
  otherId: string,
): Promise<RoomResult> {
  if (otherId === session.userId) return { error: "Pick someone other than yourself" };

  const { data: otherMember } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("org_id", session.orgId)
    .eq("user_id", otherId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!otherMember) return { error: "That person is not in this workspace" };

  // Find-or-create: an existing direct room both of us belong to.
  const { data: myRooms } = await supabase
    .from("chat_room_members")
    .select("room_id")
    .eq("user_id", session.userId);
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
      if (existing) return { roomId: existing };
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
  return { roomId };
}
