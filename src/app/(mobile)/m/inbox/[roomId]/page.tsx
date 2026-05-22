import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { postMessage, markRoomRead } from "../actions";
import { RealtimeRefresh } from "@/components/RealtimeRefresh";

export const dynamic = "force-dynamic";

type Msg = {
  id: string;
  author_id: string | null;
  body: string;
  created_at: string;
};

export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  if (!hasSupabase) return <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">Configure Supabase.</div>;
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

  const { data: msgs } = await supabase
    .from("chat_messages")
    .select("id, author_id, body, created_at")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true })
    .limit(200);

  // Mark room read on render — keeps the unread badge in sync without a
  // separate client effect. Side-effect inside RSC is fine for idempotent
  // touches.
  await markRoomRead({ roomId });

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <RealtimeRefresh
        channelName={`m-inbox-${roomId}`}
        table="chat_messages"
        filter={`room_id=eq.${roomId}`}
        event="INSERT"
      />
      <div className="border-b border-[var(--border-color)] px-4 pt-4 pb-3">
        <h1 className="truncate text-base font-semibold">{room.name ?? "Direct message"}</h1>
        <p className="text-xs text-[var(--text-muted)]">{room.room_kind}</p>
      </div>
      <ul className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {((msgs ?? []) as Msg[]).map((m) => {
          const mine = m.author_id === session.userId;
          return (
            <li key={m.id} className={mine ? "flex justify-end" : "flex"}>
              <div
                className={
                  mine
                    ? "max-w-[80%] rounded-lg bg-[var(--org-primary)] px-3 py-2 text-xs text-[var(--org-on-primary)]"
                    : "surface max-w-[80%] px-3 py-2 text-xs"
                }
              >
                <p className="whitespace-pre-wrap">{m.body}</p>
                <span className="mt-1 block text-[10px] opacity-70">{fmt.time(m.created_at)}</span>
              </div>
            </li>
          );
        })}
      </ul>
      <form action={postMessage} className="flex items-center gap-2 border-t border-[var(--border-color)] p-3">
        <input type="hidden" name="roomId" value={roomId} />
        <input
          type="text"
          name="body"
          placeholder="Message"
          required
          maxLength={4000}
          className="flex-1 rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2 text-sm"
        />
        <Button type="submit" size="sm">
          Send
        </Button>
      </form>
    </div>
  );
}
