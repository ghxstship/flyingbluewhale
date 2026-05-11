import Link from "next/link";
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

export default async function InboxPage() {
  if (!hasSupabase) {
    return <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">Configure Supabase.</div>;
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  // Rooms the caller belongs to. RLS guards visibility too, but the
  // explicit member-join keeps the list query tight.
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

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">Mobile</div>
      <h1 className="mt-1 text-2xl font-semibold">Inbox</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">{list.length} conversations</p>

      <ul className="mt-5 space-y-2">
        {list.length === 0 ? (
          <li>
            <EmptyState
              size="compact"
              title="No Conversations"
              description="Direct messages and channels you join appear here."
            />
          </li>
        ) : (
          list.map((r) => {
            const lastRead = readMap.get(r.id);
            const unread = r.last_message_at && (!lastRead || new Date(r.last_message_at) > new Date(lastRead));
            return (
              <li key={r.id}>
                <Link href={`/m/inbox/${r.id}`} className="surface flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="muted">{r.room_kind}</Badge>
                      {unread && <Badge variant="warning">New</Badge>}
                    </div>
                    <div className="mt-1 truncate text-sm font-semibold">{r.name ?? "Direct message"}</div>
                  </div>
                  <span className="shrink-0 font-mono text-xs text-[var(--text-muted)]">
                    {r.last_message_at ? fmt.time(r.last_message_at) : ""}
                  </span>
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
