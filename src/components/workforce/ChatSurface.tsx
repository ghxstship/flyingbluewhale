import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import type { PortalHref } from "./shell-contract";

/**
 * Shared chat rooms list (ADR-0008 Move 1, Amendments 4 + 5).
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
 *
 * ## Why there is no `projectId` here (ADR-0008 Amendment 5 — settled twice)
 *
 * `DirectorySurface` and `FeedSurface` take a `projectId` that is REQUIRED on
 * the `variant: "portal"` arm. This surface deliberately does not, and that is
 * not an omission — Amendment 1 audited it and said "no change", Amendment 4
 * re-flagged it as "the last unscoped shared surface", and Amendment 5 settled
 * it. If you are about to add one, read this first.
 *
 * Amendment 1's rule exists because of its precondition: `memberships` and
 * `announcements` are org-wide reads with **no per-row grant**, so RLS has
 * nothing to key on ("`memberships_select` permits any org member") and the
 * app is the only place a boundary can live. Project scope was the nearest
 * available line, and the compiler was the last place to hold it.
 *
 * Chat is the opposite shape. A room is reachable only through an explicit
 * `chat_room_members` row — a positive, per-row, deliberate grant. The
 * boundary lives in RLS (`private.is_room_member`), a layer BELOW these props,
 * which is why the query below filters on membership and not on a project:
 *
 *   • Membership is strictly FINER than project scope. Being on a project does
 *     not entitle you to a DM between two other people on it. Scoping by
 *     project would leak (rooms in your project you were never added to) and
 *     over-hide (rooms you WERE added to that span projects — most of them).
 *   • `chat_rooms` has no `project_id` at all, and "which project does a DM
 *     belong to?" has no honest answer. (Same schema fact as Amendment 2's
 *     Kudos deletion, different outcome: `recognition_posts` had no project_id
 *     AND no membership grant, so it had no boundary at any layer. Chat has a
 *     better one already.)
 *
 * Amendment 5 is also where membership became a real boundary rather than a
 * claimed one: until `20260715180000_chat_membership_boundary.sql`, any org
 * member could INSERT their own `chat_room_members` row into any room and read
 * it, so "you only see rooms you were added to" was false. Note that a
 * `projectId` prop here would have fixed exactly none of that — the attack is a
 * PostgREST call and never renders this component.
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
