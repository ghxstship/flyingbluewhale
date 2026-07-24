import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { resolveRecordRefs } from "@/lib/chat/record-refs";
import { ChatRoom, type ChatMessage } from "./ChatRoom";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

/**
 * /m/inbox/[roomId] — COMPVSS chat thread. Server fetches the room (org-scoped),
 * membership-gates with `notFound()`, marks the room read, and loads the latest
 * page of messages. The interactive thread + composer live in the client
 * `ChatRoom` island, which posts to the surviving `sendMessage` action and
 * mounts `RealtimeRefresh` on `chat_messages` filtered to this room.
 * Ref design: app.jsx 2085-2110.
 */
export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();

  // The room lookup, the membership gate, and the latest message page all key
  // off roomId/userId — none depends on another's result, so they resolve in
  // one round trip (RLS still scopes chat_messages to members). The notFound
  // gates are evaluated against the resolved rows.
  const [{ data: room }, { data: member }, { data: msgs }] = await Promise.all([
    supabase
      .from("chat_rooms")
      .select("id, name, room_kind")
      .eq("id", roomId)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("chat_room_members")
      .select("room_id")
      .eq("room_id", roomId)
      .eq("user_id", session.userId)
      .maybeSingle(),
    supabase
      .from("chat_messages")
      .select("id, author_id, body, attachments, created_at")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE),
  ]);
  // Room must belong to the caller's org; only members may read the thread.
  if (!room) notFound();
  if (!member) notFound();

  // Newest page first — reversed in memory for chronological display.
  const messages = ((msgs ?? []) as ChatMessage[]).slice().reverse();

  // Record-ref chips (kit 21 remediation R1) — resolve via the shared SSOT
  // for the mobile shell; console-record chips render unlinked here (no field
  // route) but keep the "this is a record" affordance. Resolved alongside the
  // mark-read write, which doesn't depend on it.
  const [refs] = await Promise.all([
    resolveRecordRefs(
      supabase,
      session.orgId,
      messages.map((m) => m.body),
      "mobile",
    ),
    // Mark the room read on render — keeps the inbox unread badge honest.
    supabase
      .from("chat_room_members")
      .update({ last_read_at: new Date().toISOString() })
      .eq("room_id", roomId)
      .eq("user_id", session.userId),
  ]);

  const isChannel = (room.room_kind ?? "") === "channel";
  const title = room.name ?? t("m.inbox.directMessage", undefined, "Direct Message");

  return (
    <div className="screen screen-anim">
      <div className="chatview">
        <Link href="/m/inbox" className="backbtn">
          {t("m.inbox.back", undefined, "Inbox")}
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          {isChannel ? (
            <span className="chan">#</span>
          ) : (
            <span className="avatar-sm">
              {(title.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")) || "?"}
            </span>
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>
            <div className="s">
              {isChannel
                ? t("m.inbox.room.channel", undefined, "Channel")
                : t("m.inbox.room.direct", undefined, "Direct Message")}
            </div>
          </div>
        </div>

        <ChatRoom
          roomId={roomId}
          userId={session.userId}
          locale={fmt.settings.locale}
          timezone={fmt.settings.timezone}
          initialMessages={messages}
          refs={refs}
          labels={{
            placeholder: t("m.inbox.room.placeholder", undefined, "Message"),
            send: t("common.send", undefined, "Send"),
            today: t("m.inbox.room.today", undefined, "Today"),
            empty: t("m.inbox.room.empty", undefined, "No Messages Yet"),
            emptyHint: t("m.inbox.room.emptyHint", undefined, "Say hello to get things started."),
            offline: t("m.offline.offlineChat", undefined, "You're offline. Messages send when you reconnect."),
            queued: t("m.offline.queued", undefined, "{n} waiting to sync"),
            syncingLabel: t("m.offline.syncing", undefined, "Syncing…"),
          }}
        />
      </div>
    </div>
  );
}
