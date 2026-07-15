import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import type { PortalHref } from "./shell-contract";

/**
 * Shared chat rooms list (ADR-0008 Move 1, Amendment 4).
 *
 * Lists the caller's chat rooms ordered by last-message-at. Same query
 * + render across COMPVSS (`/m/inbox`) and the portal crew/vendor personas.
 *
 * The portal arm returns a `PortalHref`, and the room it points at already
 * existed: `/p/[slug]/messages/[roomId]` is a complete portal-native room —
 * in fact a richer one than `/m/inbox/[roomId]` (cursor pagination, author
 * name hydration, inbox fan-out on send). The portal was deep-linking into
 * COMPVSS to render a room it already had; the only thing missing was the
 * `slug` needed to build the URL.
 */

type RoomRow = {
  id: string;
  name: string | null;
  room_kind: string;
  last_message_at: string | null;
};

type ChatProps = {
  eyebrowLabel?: string;
  titleLabel?: string;
} & (
  | { variant: "mobile"; roomHref: (roomId: string) => string }
  | { variant: "portal"; roomHref: (roomId: string) => PortalHref }
);

export async function ChatSurface({ variant, roomHref, eyebrowLabel, titleLabel }: ChatProps) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="px-4 pt-6 pb-24 text-sm text-[var(--p-text-2)]">
        {t("m.inbox.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

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

  const containerClass = variant === "mobile" ? "px-4 pt-6 pb-24" : "page-content";
  const eyebrow = eyebrowLabel ?? (variant === "mobile" ? t("m.inbox.eyebrow", undefined, "Mobile") : "Crew");
  const title = titleLabel ?? t("m.inbox.title", undefined, "Inbox");

  return (
    <div className={containerClass}>
      <div className="text-xs font-semibold tracking-wider text-[var(--p-accent)] uppercase">{eyebrow}</div>
      <h1 className="mt-1 text-2xl font-semibold">{title}</h1>
      <p className="mt-1 text-xs text-[var(--p-text-2)]">
        {t("m.inbox.count", { n: list.length }, `${list.length} conversations`)}
      </p>

      <ul className="mt-5 space-y-2">
        {list.length === 0 ? (
          <li>
            <EmptyState
              size="compact"
              title={t("m.inbox.empty.title", undefined, "No Conversations")}
              description={t(
                "m.inbox.empty.description",
                undefined,
                "Direct messages and channels you join appear here.",
              )}
            />
          </li>
        ) : (
          list.map((r) => {
            const lastRead = readMap.get(r.id);
            const unread = r.last_message_at && (!lastRead || new Date(r.last_message_at) > new Date(lastRead));
            return (
              <li key={r.id}>
                <Link href={roomHref(r.id)} className="surface flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="muted">{r.room_kind}</Badge>
                      {unread && <Badge variant="warning">{t("m.inbox.unreadBadge", undefined, "New")}</Badge>}
                    </div>
                    <div className="mt-1 truncate text-sm font-semibold">
                      {r.name ?? t("m.inbox.directMessage", undefined, "Direct message")}
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-xs text-[var(--p-text-2)]">
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
