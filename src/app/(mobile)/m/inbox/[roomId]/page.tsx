import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { markRoomRead } from "../actions";
import { ChatRoom, type ChatMessage } from "./ChatRoom";

export const dynamic = "force-dynamic";

// Keep in sync with MESSAGES_PAGE_SIZE in ChatRoom.tsx.
const PAGE_SIZE = 50;

export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="px-4 pt-6 pb-24 text-sm text-[var(--p-text-2)]">
        {t("m.common.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  const { roomId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data: room } = await supabase
    .from("chat_rooms")
    .select("id, name, room_kind")
    .eq("id", roomId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!room) notFound();

  // Newest page first — descending + limit, reversed in memory for display.
  // Older history loads on demand via the "Load Older" cursor in <ChatRoom>.
  const { data: msgs } = await supabase
    .from("chat_messages")
    .select("id, author_id, body, created_at")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  const latestPage = ((msgs ?? []) as ChatMessage[]).slice().reverse();
  const hasOlder = (msgs ?? []).length === PAGE_SIZE;

  // Mark room read on render — keeps the unread badge in sync without a
  // separate client effect. Side-effect inside RSC is fine for idempotent
  // touches.
  await markRoomRead({ roomId });

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="border-b border-[var(--p-border)] px-4 pt-4 pb-3">
        <h1 className="truncate text-base font-semibold">
          {room.name ?? t("m.inbox.room.directMessage", undefined, "Direct message")}
        </h1>
        <p className="text-xs text-[var(--p-text-2)]">{room.room_kind}</p>
      </div>
      <ChatRoom
        roomId={roomId}
        userId={session.userId}
        locale={fmt.settings.locale}
        timezone={fmt.settings.timezone}
        initialMessages={latestPage}
        initialHasOlder={hasOlder}
        emptyTitle={t("m.inbox.room.emptyTitle", undefined, "No Messages Yet")}
        emptyDescription={t("m.inbox.room.emptyDescription", undefined, "Say hello to get things started.")}
        labels={{
          placeholder: t("m.inbox.room.messagePlaceholder", undefined, "Message"),
          send: t("common.send", undefined, "Send"),
          loadOlder: t("m.inbox.room.loadOlder", undefined, "Load Older"),
          loadingOlder: t("m.inbox.room.loadingOlder", undefined, "Loading…"),
        }}
      />
    </div>
  );
}
