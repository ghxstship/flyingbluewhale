import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type RoomRow = {
  id: string;
  name: string | null;
  room_kind: string;
  last_message_at: string | null;
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Console" title="Inbox" />
        <div className="page-content text-sm">Configure Supabase.</div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmtIntl = await getRequestFormatters();

  // ATLVS-side counterpart to /m/inbox: same chat_rooms surface, but
  // rendered inside the console shell so operators can keep chat threads
  // open beside their work. RLS already restricts to rooms the caller is
  // a member of.
  const { data: memberships } = await supabase
    .from("chat_room_members")
    .select("room_id, last_read_at")
    .eq("user_id", session.userId);

  const roomIds = ((memberships ?? []) as Array<{ room_id: string; last_read_at: string | null }>).map(
    (m) => m.room_id,
  );
  const readMap = new Map<string, string | null>(
    ((memberships ?? []) as Array<{ room_id: string; last_read_at: string | null }>).map((m) => [
      m.room_id,
      m.last_read_at,
    ]),
  );

  const { data: rooms } = roomIds.length
    ? await supabase
        .from("chat_rooms")
        .select("id, name, room_kind, last_message_at")
        .eq("org_id", session.orgId)
        .is("deleted_at", null)
        .in("id", roomIds)
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .limit(50)
    : { data: [] as RoomRow[] };

  const list = (rooms ?? []) as RoomRow[];
  const unreadCount = list.filter((r) => {
    const lastRead = readMap.get(r.id);
    return r.last_message_at && (!lastRead || new Date(r.last_message_at) > new Date(lastRead));
  }).length;

  return (
    <>
      <ModuleHeader
        eyebrow="Console"
        title="Inbox"
        subtitle={`${list.length} conversation${list.length === 1 ? "" : "s"}${unreadCount > 0 ? ` · ${unreadCount} unread` : ""}`}
      />
      <div className="page-content">
        {list.length === 0 ? (
          <EmptyState
            title="No Conversations"
            description="Direct messages and channels you join appear here. Chats are created from /m/inbox or from a portal contact thread."
          />
        ) : (
          <ul className="max-w-3xl space-y-2">
            {list.map((r) => {
              const lastRead = readMap.get(r.id);
              const unread = r.last_message_at && (!lastRead || new Date(r.last_message_at) > new Date(lastRead));
              return (
                <li key={r.id}>
                  <Link href={`/m/inbox/${r.id}`} className="surface flex items-start justify-between gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="muted">{r.room_kind}</Badge>
                        <span className="truncate text-sm font-medium">{r.name ?? "Untitled room"}</span>
                      </div>
                      {r.last_message_at && (
                        <div className="mt-1 font-mono text-[10px] text-[var(--text-muted)]">
                          {fmtIntl.dateTime(r.last_message_at)}
                        </div>
                      )}
                    </div>
                    {unread && <Badge variant="success">New</Badge>}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
