import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { EmptyState } from "@/components/ui/EmptyState";

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

  // Rooms the caller belongs to + their per-room read cursor.
  const { data: memberships } = await supabase
    .from("chat_room_members")
    .select("room_id, last_read_at")
    .eq("user_id", session.userId);

  const memberRows = (memberships ?? []) as Array<{ room_id: string; last_read_at: string | null }>;
  const roomIds = memberRows.map((m) => m.room_id);
  const lastReadByRoom = new Map(memberRows.map((m) => [m.room_id, m.last_read_at]));

  let rooms: RoomRow[] = [];
  let lastByRoom = new Map<string, LastMsg>();
  let unreadByRoom = new Map<string, number>();

  if (roomIds.length > 0) {
    const { data: roomData } = await supabase
      .from("chat_rooms")
      .select("id, name, room_kind, last_message_at")
      .in("id", roomIds)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("last_message_at", { ascending: false, nullsFirst: false });
    rooms = (roomData ?? []) as RoomRow[];

    // Recent messages across these rooms — enough to derive a preview + unread
    // count per room without an N+1 fan-out.
    const { data: msgData } = await supabase
      .from("chat_messages")
      .select("room_id, body, author_id, created_at")
      .in("room_id", roomIds)
      .order("created_at", { ascending: false })
      .limit(400);
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

  const channels = rooms.filter((r) => (r.room_kind ?? "") === "channel");
  const dms = rooms.filter((r) => (r.room_kind ?? "") !== "channel");

  const row = (r: RoomRow) => {
    const last = lastByRoom.get(r.id);
    const unread = unreadByRoom.get(r.id) ?? 0;
    const isChannel = (r.room_kind ?? "") === "channel";
    const stamp = last?.created_at ?? r.last_message_at;
    return (
      <Link
        key={r.id}
        href={`/m/inbox/${r.id}`}
        className="item tap"
        style={{ margin: 0, cursor: "pointer", textDecoration: "none", color: "inherit" }}
      >
        {isChannel ? (
          <span className="chan">#</span>
        ) : (
          <span className="avatar-sm">{initials(r.name)}</span>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="t">{r.name ?? t("m.inbox.directMessage", undefined, "Direct Message")}</div>
          <div
            className="s"
            style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {last?.body ?? t("m.inbox.noMessages", undefined, "No messages yet")}
          </div>
        </div>
        <span style={{ textAlign: "right", flex: "none" }}>
          {stamp && <div className="time">{fmt.relative(stamp)}</div>}
          {unread > 0 && (
            <div className="unread" style={{ marginTop: 5, marginLeft: "auto" }}>
              {unread}
            </div>
          )}
        </span>
      </Link>
    );
  };

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">
        {totalUnread} {t("m.inbox.unread", undefined, "Unread")}
      </div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.inbox.title", undefined, "My Inbox")}
      </h1>

      {rooms.length === 0 ? (
        <EmptyState
          title={t("m.inbox.emptyTitle", undefined, "No Conversations")}
          description={t("m.inbox.emptyHint", undefined, "Channels and direct messages land here.")}
        />
      ) : (
        <>
          {channels.length > 0 && (
            <div className="sech" style={{ marginTop: 0 }}>
              <h2>{t("m.inbox.channels", undefined, "Channels")}</h2>
            </div>
          )}
          {channels.map(row)}
          {dms.length > 0 && (
            <div className="sech">
              <h2>{t("m.inbox.directMessages", undefined, "Direct Messages")}</h2>
            </div>
          )}
          {dms.map(row)}
        </>
      )}
    </div>
  );
}
