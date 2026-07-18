import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { InboxView, type InboxRow } from "./InboxView";

export const dynamic = "force-dynamic";

type RoomRow = {
  id: string;
  name: string | null;
  room_kind: string | null;
  last_message_at: string | null;
};

type LastMsg = { room_id: string; body: string; created_at: string };

/**
 * /m/inbox — COMPVSS My Inbox. Server-fetches the chat rooms the caller is a
 * member of (org-scoped), hydrates each with its last message and an unread
 * count (messages created after the member's `last_read_at`). Rows are the kit
 * `.item` / `.chan` / `.avatar-sm` / `.unread` treatment, linking to the room.
 * Ref design: app.jsx 2039-2084.
 */
export default async function InboxPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();

  // Rooms the caller belongs to + their per-room read cursor and the kit 31
  // swipe stores (flag + archive live on the membership row). Archived rooms
  // leave the list entirely — the swipe's 5s undo bar is the way back.
  const { data: memberships } = await supabase
    .from("chat_room_members")
    .select("room_id, last_read_at, flagged_at, archived_at")
    .eq("user_id", session.userId)
    .limit(200);

  const memberRows = (memberships ?? []) as Array<{
    room_id: string;
    last_read_at: string | null;
    flagged_at: string | null;
    archived_at: string | null;
  }>;
  const roomIds = memberRows.filter((m) => m.archived_at == null).map((m) => m.room_id);
  const lastReadByRoom = new Map(memberRows.map((m) => [m.room_id, m.last_read_at]));
  const flaggedRooms = new Set(memberRows.filter((m) => m.flagged_at != null).map((m) => m.room_id));

  let rooms: RoomRow[] = [];
  let lastByRoom = new Map<string, LastMsg>();
  let unreadByRoom = new Map<string, number>();

  if (roomIds.length > 0) {
    // The room list and the recent-message page both key off roomIds and are
    // independent — one round trip. Recent messages are enough to derive a
    // preview + unread count per room without an N+1 fan-out.
    const [{ data: roomData }, { data: msgData }] = await Promise.all([
      supabase
        .from("chat_rooms")
        .select("id, name, room_kind, last_message_at")
        .in("id", roomIds)
        .eq("org_id", session.orgId)
        .is("deleted_at", null)
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .limit(200),
      supabase
        .from("chat_messages")
        .select("room_id, body, author_id, created_at")
        .in("room_id", roomIds)
        .order("created_at", { ascending: false })
        .limit(400),
    ]);
    rooms = (roomData ?? []) as RoomRow[];
    const msgs = (msgData ?? []) as Array<LastMsg & { author_id: string | null }>;

    for (const m of msgs) {
      if (!lastByRoom.has(m.room_id)) lastByRoom.set(m.room_id, m);
      const readAt = lastReadByRoom.get(m.room_id);
      const isUnread =
        m.author_id !== session.userId && (!readAt || new Date(m.created_at) > new Date(readAt));
      if (isUnread) unreadByRoom.set(m.room_id, (unreadByRoom.get(m.room_id) ?? 0) + 1);
    }
  }

  const totalUnread = [...unreadByRoom.values()].reduce((a, b) => a + b, 0);
  const initials = (name: string | null) =>
    (name ?? "?")
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?";

  const viewRows: InboxRow[] = rooms.map((r) => {
    const last = lastByRoom.get(r.id);
    const stampIso = last?.created_at ?? r.last_message_at;
    return {
      id: r.id,
      name: r.name ?? t("m.inbox.directMessage", undefined, "Direct Message"),
      kind: (r.room_kind ?? "") === "channel" ? "channel" : "dm",
      last: last?.body ?? t("m.inbox.noMessages", undefined, "No messages yet"),
      time: stampIso ? fmt.relative(stampIso) : "",
      stamp: stampIso ? new Date(stampIso).getTime() : 0,
      unread: unreadByRoom.get(r.id) ?? 0,
      initials: initials(r.name),
      flagged: flaggedRooms.has(r.id),
    };
  });

  return (
    <InboxView
      rows={viewRows}
      eyebrow={t("m.inbox.unreadEyebrow", { count: totalUnread }, `${totalUnread} Unread`)}
      title={t("m.inbox.title", undefined, "My Inbox")}
    />
  );
}
