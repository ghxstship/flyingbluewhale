import Link from "next/link";
import { BellOff } from "lucide-react";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { ConsoleChat, type ConsoleMessage } from "./ConsoleChat";
import { NewThreadControls } from "./NewThreadControls";
import { RoomPinButton } from "./RoomPinButton";
import { ThreadMenu } from "./ThreadMenu";
import { resolveRecordRefs } from "./record-refs";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 80;

type RoomRow = {
  id: string;
  name: string | null;
  room_kind: string;
  last_message_at: string | null;
};

type MemberRow = { room_id: string; last_read_at: string | null; pinned_at: string | null; muted_at: string | null };

/**
 * My Inbox (kit 20 Inbox M1) — the console's two-pane messaging surface.
 * Left: every room the caller belongs to, unread-badged. Right: the selected
 * thread with day dividers, record-ref chips, and an Enter-sends composer —
 * the operator never leaves the console to read a message (the old list
 * bounced to the COMPVSS shell). Same stores as /m/inbox and the portal
 * threads: chat_rooms · chat_room_members · chat_messages, RLS-gated.
 */
export default async function Page({ searchParams }: { searchParams: Promise<{ room?: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.inbox.eyebrow", undefined, "Home")}
          title={t("console.inbox.title", undefined, "My Inbox")}
        />
        <div className="page-content text-sm">
          {t("console.inbox.configureSupabase", undefined, "Configure Supabase.")}
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const sp = await searchParams;

  const { data: memberships } = await supabase
    .from("chat_room_members")
    .select("room_id, last_read_at, pinned_at, muted_at")
    .eq("user_id", session.userId);
  const memberRows = (memberships ?? []) as MemberRow[];
  const roomIds = memberRows.map((m) => m.room_id);
  const readMap = new Map(memberRows.map((m) => [m.room_id, m.last_read_at]));
  const pinnedMap = new Map(memberRows.map((m) => [m.room_id, !!m.pinned_at]));
  const mutedMap = new Map(memberRows.map((m) => [m.room_id, !!m.muted_at]));

  const { data: roomsData } = roomIds.length
    ? await supabase
        .from("chat_rooms")
        .select("id, name, room_kind, last_message_at")
        .eq("org_id", session.orgId)
        .in("id", roomIds)
        .is("deleted_at", null)
        .order("last_message_at", { ascending: false, nullsFirst: false })
    : { data: [] as RoomRow[] };
  // Pinned rooms float to the top; within each band the server already sorted
  // by last_message_at desc.
  const rooms = ((roomsData ?? []) as RoomRow[])
    .slice()
    .sort((a, b) => Number(pinnedMap.get(b.id) ?? false) - Number(pinnedMap.get(a.id) ?? false));

  // Direct rooms are unnamed — label them with the other party. One batched
  // membership + user lookup covers every direct room in the list.
  const directIds = rooms.filter((r) => r.room_kind === "direct").map((r) => r.id);
  const partnerName = new Map<string, string>();
  if (directIds.length > 0) {
    const { data: partners } = await supabase
      .from("chat_room_members")
      .select("room_id, user_id, users:users!inner(name, email)")
      .in("room_id", directIds)
      .neq("user_id", session.userId);
    for (const p of (partners ?? []) as unknown as Array<{
      room_id: string;
      users: { name: string | null; email: string | null } | null;
    }>) {
      partnerName.set(p.room_id, p.users?.name ?? p.users?.email ?? "Direct Message");
    }
  }
  const roomLabel = (r: RoomRow) =>
    r.room_kind === "direct"
      ? (partnerName.get(r.id) ?? t("console.inbox.directMessage", undefined, "Direct Message"))
      : (r.name ?? t("console.inbox.untitledRoom", undefined, "Untitled Room"));

  // Selected thread — must be one of the caller's rooms.
  const selected = sp?.room ? (rooms.find((r) => r.id === sp.room) ?? null) : null;

  let thread: ConsoleMessage[] = [];
  let refs = {};
  // last_read_at captured BEFORE the mark-read write below, so the client can
  // draw the unread jump line at the first message newer than it.
  const selectedLastRead = selected ? (readMap.get(selected.id) ?? null) : null;
  if (selected) {
    const { data: msgs } = await supabase
      .from("chat_messages")
      .select("id, author_id, body, created_at")
      .eq("room_id", selected.id)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    const ordered = ((msgs ?? []) as Array<{ id: string; author_id: string | null; body: string; created_at: string }>)
      .slice()
      .reverse();

    const authorIds = [...new Set(ordered.map((m) => m.author_id).filter((a): a is string => !!a))];
    const nameById = new Map<string, string>();
    if (authorIds.length > 0) {
      const { data: authors } = await supabase.from("users").select("id, name, email").in("id", authorIds);
      for (const a of (authors ?? []) as Array<{ id: string; name: string | null; email: string | null }>) {
        nameById.set(a.id, a.name ?? a.email ?? "");
      }
    }

    refs = await resolveRecordRefs(
      supabase,
      session.orgId,
      ordered.map((m) => m.body),
    );

    // Reactions for the visible messages, folded to per-message emoji tallies
    // (count + whether the caller reacted) for the composer.
    const reactionsByMessage = new Map<string, Map<string, { count: number; mine: boolean }>>();
    if (ordered.length > 0) {
      const { data: reactionRows } = await supabase
        .from("chat_message_reactions")
        .select("message_id, emoji, user_id")
        .in(
          "message_id",
          ordered.map((m) => m.id),
        );
      for (const r of (reactionRows ?? []) as Array<{ message_id: string; emoji: string; user_id: string }>) {
        let byEmoji = reactionsByMessage.get(r.message_id);
        if (!byEmoji) {
          byEmoji = new Map();
          reactionsByMessage.set(r.message_id, byEmoji);
        }
        const cur = byEmoji.get(r.emoji) ?? { count: 0, mine: false };
        cur.count += 1;
        if (r.user_id === session.userId) cur.mine = true;
        byEmoji.set(r.emoji, cur);
      }
    }

    thread = ordered.map((m) => ({
      id: m.id,
      authorId: m.author_id,
      authorName: m.author_id ? (nameById.get(m.author_id) ?? "") : "",
      body: m.body,
      timeText: fmt.time(m.created_at),
      dayKey: fmt.dateParts(m.created_at, { year: "numeric", month: "2-digit", day: "2-digit" }),
      dayLabel: fmt.dateParts(m.created_at, { weekday: "short", month: "short", day: "numeric" }),
      createdAt: m.created_at,
      reactions: [...(reactionsByMessage.get(m.id)?.entries() ?? [])].map(([emoji, v]) => ({
        emoji,
        count: v.count,
        mine: v.mine,
      })),
    }));

    // Mark read on render — keeps the badge honest (mirrors /m/inbox).
    await supabase
      .from("chat_room_members")
      .update({ last_read_at: new Date().toISOString() })
      .eq("room_id", selected.id)
      .eq("user_id", session.userId);
  }

  // People directory for the New DM picker (org members, minus me).
  const { data: orgMembers } = await supabase
    .from("memberships")
    .select("user_id, users:users!inner(id, name, email)")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .limit(200);
  const people = (
    (orgMembers ?? []) as unknown as Array<{
      user_id: string;
      users: { id: string; name: string | null; email: string | null } | null;
    }>
  )
    .filter((m) => m.user_id !== session.userId)
    .map((m) => ({ id: m.user_id, label: m.users?.name ?? m.users?.email ?? m.user_id }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.inbox.eyebrow", undefined, "Home")}
        title={t("console.inbox.title", undefined, "My Inbox")}
        subtitle={t("console.inbox.subtitle", undefined, "Channels and direct messages, beside your work.")}
        action={
          <NewThreadControls
            people={people}
            labels={{
              newChannel: t("console.inbox.newChannel", undefined, "+ New Channel"),
              newDm: t("console.inbox.newDm", undefined, "+ New Message"),
              channelName: t("console.inbox.channelName", undefined, "Channel Name"),
              person: t("console.inbox.person", undefined, "Person"),
              create: t("common.create", undefined, "Create"),
              start: t("console.inbox.start", undefined, "Start"),
            }}
          />
        }
      />
      <div className="page-content">
        {rooms.length === 0 ? (
          <EmptyState
            title={t("console.inbox.empty.title", undefined, "No Threads Yet")}
            description={t(
              "console.inbox.empty.description",
              undefined,
              "Start a direct message or a channel with New Message above; portal contact threads land here too.",
            )}
          />
        ) : (
          <div className="grid min-h-[60vh] grid-cols-1 gap-4 lg:grid-cols-[minmax(16rem,22rem)_1fr]">
            <ul className="space-y-2 lg:max-h-[70vh] lg:overflow-y-auto lg:pr-1">
              {rooms.map((r) => {
                const lastRead = readMap.get(r.id);
                const muted = mutedMap.get(r.id) ?? false;
                const pinned = pinnedMap.get(r.id) ?? false;
                // Muted rooms never badge — they still list, just quietly.
                const unread =
                  !muted && r.last_message_at && (!lastRead || new Date(r.last_message_at) > new Date(lastRead));
                const active = selected?.id === r.id;
                return (
                  <li key={r.id} className="group relative">
                    <Link
                      href={`/studio/inbox?room=${r.id}`}
                      aria-current={active ? "page" : undefined}
                      className={`surface flex items-start justify-between gap-3 p-3 pe-9 ${
                        active ? "border-[var(--p-accent)]" : ""
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="muted">{toTitle(r.room_kind)}</Badge>
                          <span className="truncate text-sm font-medium">{roomLabel(r)}</span>
                          {muted ? <BellOff size={12} className="shrink-0 text-[var(--p-text-3)]" /> : null}
                        </div>
                        {r.last_message_at ? (
                          <div className="mt-1 font-mono text-[10px] text-[var(--p-text-3)]">
                            {fmt.dateParts(r.last_message_at, {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </div>
                        ) : null}
                      </div>
                      {unread && !active ? (
                        <Badge variant="success">{t("console.inbox.newBadge", undefined, "New")}</Badge>
                      ) : null}
                    </Link>
                    <div className="absolute end-2 top-2.5">
                      <RoomPinButton
                        roomId={r.id}
                        pinned={pinned}
                        labels={{
                          pin: t("console.inbox.pin", undefined, "Pin To Top"),
                          unpin: t("console.inbox.unpin", undefined, "Unpin"),
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="surface flex min-h-[60vh] flex-col p-4 lg:max-h-[70vh]">
              {selected ? (
                <>
                  <div className="mb-3 flex items-center gap-2 border-b border-[var(--p-border)] pb-3">
                    <Badge variant="muted">{toTitle(selected.room_kind)}</Badge>
                    <span className="truncate text-sm font-semibold">{roomLabel(selected)}</span>
                    <span className="flex-1" />
                    <ThreadMenu
                      roomId={selected.id}
                      muted={mutedMap.get(selected.id) ?? false}
                      canLeave={selected.room_kind !== "direct"}
                      labels={{
                        menu: t("console.inbox.threadMenu", undefined, "Thread Options"),
                        mute: t("console.inbox.mute", undefined, "Mute"),
                        unmute: t("console.inbox.unmute", undefined, "Unmute"),
                        markUnread: t("console.inbox.markUnread", undefined, "Mark Unread"),
                        leave: t("console.inbox.leave", undefined, "Leave Channel"),
                        leaveConfirmTitle: t("console.inbox.leaveConfirmTitle", undefined, "Leave Channel?"),
                        leaveConfirmBody: t(
                          "console.inbox.leaveConfirmBody",
                          undefined,
                          "You'll stop receiving messages here and it drops off your list. An admin can re-add you.",
                        ),
                        cancel: t("common.cancel", undefined, "Cancel"),
                      }}
                    />
                  </div>
                  <ConsoleChat
                    roomId={selected.id}
                    userId={session.userId}
                    messages={thread}
                    refs={refs}
                    lastReadAt={selectedLastRead}
                    people={people}
                    labels={{
                      placeholder: t("console.inbox.placeholder", undefined, "Message · Enter Sends"),
                      send: t("common.send", undefined, "Send"),
                      sending: t("console.inbox.sending", undefined, "Sending…"),
                      empty: t("console.inbox.thread.empty", undefined, "No Messages Yet"),
                      emptyHint: t("console.inbox.thread.emptyHint", undefined, "Say hello to get things started."),
                      newMessages: t("console.inbox.newMessages", undefined, "New"),
                      addReaction: t("console.inbox.addReaction", undefined, "React"),
                      copy: t("console.inbox.copy", undefined, "Copy Text"),
                      copied: t("console.inbox.copied", undefined, "Copied"),
                    }}
                  />
                </>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
                  <div className="text-sm font-semibold">
                    {t("console.inbox.pickThread", undefined, "Pick A Thread")}
                  </div>
                  <p className="max-w-xs text-xs text-[var(--p-text-2)]">
                    {t(
                      "console.inbox.pickThreadHint",
                      undefined,
                      "Record IDs like INV-2026-001 and pasted console links render as chips that jump to the record.",
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
