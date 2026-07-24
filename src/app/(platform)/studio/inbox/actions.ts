"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestFormatters } from "@/lib/i18n/request";
import { resolveRecordRefs } from "./record-refs";
import { createChannelRoom, findOrCreateDirectRoom } from "@/lib/db/chat-rooms";
import { sendChatMessage } from "@/lib/db/chat-send";
import { actionErrorMessage } from "@/lib/errors";

/**
 * Console inbox write actions (kit 20 Inbox M-series). Mirrors the COMPVSS
 * `/m/inbox/[roomId]` action guards — org pin + explicit membership check on
 * every send (RLS backstops the table; the checks make failures
 * deterministic) — plus the console-side New Channel / New DM intakes the
 * kit's M2 contract asks for.
 */

export type State = { error?: string } | null;

const MsgSchema = z.object({
  roomId: z.string().uuid(),
  body: z.string().min(1).max(4000),
});

export async function sendConsoleMessage(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = MsgSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { roomId, body } = parsed.data;
  const supabase = await createClient();

  // Shared send (src/lib/db/chat-send.ts): guards, insert, cursor stamps,
  // and the inbox/push fan-out the console path used to skip entirely.
  const result = await sendChatMessage({
    supabase,
    orgId: session.orgId,
    authorId: session.userId,
    roomId,
    body,
  });
  if ("error" in result) {
    return {
      error:
        result.error === "Thread not found."
          ? actionErrorMessage("not-found.thread", "Thread not found.")
          : result.error === "You are not a member of this thread."
            ? actionErrorMessage("you-are-not-a-member-of-this-thread", "You are not a member of this thread.")
            : result.error,
    };
  }

  revalidatePath("/studio/inbox");
  return null;
}

const ChannelSchema = z.object({ name: z.string().min(1).max(80) });

export async function createChannelAction(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = ChannelSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();

  // Shared with /m/inbox/new (src/lib/db/chat-rooms.ts) — one create path,
  // two shells, so they can't fork the way time-off did.
  const result = await createChannelRoom(supabase, session, parsed.data.name);
  if ("error" in result) return { error: result.error };

  revalidatePath("/studio/inbox");
  redirect(`/studio/inbox?room=${result.roomId}`);
}

const DmSchema = z.object({ userId: z.string().uuid() });

export async function startDmAction(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = DmSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Pick a person" };
  const supabase = await createClient();

  // Shared find-or-create with /m/inbox/new — the org-membership check and
  // the exactly-us-two dedupe live in src/lib/db/chat-rooms.ts.
  const result = await findOrCreateDirectRoom(supabase, session, parsed.data.userId);
  if ("error" in result) return { error: result.error };

  revalidatePath("/studio/inbox");
  redirect(`/studio/inbox?room=${result.roomId}`);
}

// ── Thread management (kit 21 W5) — pin/mute/leave/mark-unread + reactions.
// All are membership-scoped: the RLS + the explicit user_id filter mean a
// caller can only ever touch their own membership row / their own reaction.

/** Toggle pinned_at on my membership — pinned rooms sort first in the list. */
export async function toggleRoomPin(roomId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("chat_room_members")
    .select("pinned_at")
    .eq("room_id", roomId)
    .eq("user_id", session.userId)
    .maybeSingle();
  if (!row) return;
  await supabase
    .from("chat_room_members")
    .update({ pinned_at: (row as { pinned_at: string | null }).pinned_at ? null : new Date().toISOString() })
    .eq("room_id", roomId)
    .eq("user_id", session.userId);
  revalidatePath("/studio/inbox");
}

/** Toggle muted_at — muted rooms drop their unread badge + sidebar count. */
export async function toggleRoomMute(roomId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("chat_room_members")
    .select("muted_at")
    .eq("room_id", roomId)
    .eq("user_id", session.userId)
    .maybeSingle();
  if (!row) return;
  await supabase
    .from("chat_room_members")
    .update({ muted_at: (row as { muted_at: string | null }).muted_at ? null : new Date().toISOString() })
    .eq("room_id", roomId)
    .eq("user_id", session.userId);
  revalidatePath("/studio/inbox");
}

/** Rewind last_read_at so the room reads as unread again (Linear "mark unread"). */
export async function markRoomUnread(roomId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase
    .from("chat_room_members")
    .update({ last_read_at: null })
    .eq("room_id", roomId)
    .eq("user_id", session.userId);
  revalidatePath("/studio/inbox");
}

/** Leave a channel — drops my membership row. Direct rooms can't be left
 *  (there's no re-invite path), so this is channel-only. */
export async function leaveRoom(roomId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { data: room } = await supabase
    .from("chat_rooms")
    .select("room_kind")
    .eq("id", roomId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!room || (room as { room_kind: string }).room_kind === "direct") return;
  await supabase.from("chat_room_members").delete().eq("room_id", roomId).eq("user_id", session.userId);
  revalidatePath("/studio/inbox");
  redirect("/studio/inbox");
}

const REACTION_EMOJI = new Set(["👍", "❤️", "🎉", "👀"]);

/** Toggle one of the four curated reactions on a message. Insert if absent,
 *  delete if present (the unique (message_id, user_id, emoji) makes it a
 *  clean upsert-or-remove). */
export async function toggleReaction(messageId: string, emoji: string): Promise<void> {
  if (!REACTION_EMOJI.has(emoji)) return;
  const session = await requireSession();
  const supabase = await createClient();

  const { data: msg } = await supabase
    .from("chat_messages")
    .select("id, org_id, room_id")
    .eq("id", messageId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!msg) return;
  const message = msg as { id: string; org_id: string; room_id: string };

  const { data: existing } = await supabase
    .from("chat_message_reactions")
    .select("id")
    .eq("message_id", messageId)
    .eq("user_id", session.userId)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing) {
    await supabase.from("chat_message_reactions").delete().eq("id", (existing as { id: string }).id);
  } else {
    await supabase.from("chat_message_reactions").insert({
      org_id: message.org_id,
      room_id: message.room_id,
      message_id: messageId,
      user_id: session.userId,
      emoji,
    });
  }
  revalidatePath("/studio/inbox");
}

// ── Thread pagination + read cursor (audit A-11 / A-36) ─────────────────────

const THREAD_PAGE_SIZE = 80;

/**
 * Mark a room read (audit A-36) — fired from the client on thread mount
 * instead of as a GET-render side effect. Membership-scoped: the explicit
 * user_id filter means a caller only ever touches their own cursor. No
 * revalidate on purpose — this is a read-cursor write; the room-list badge
 * reconciles on the next natural refresh, and revalidating here would loop
 * (render → mark read → render).
 */
export async function markRoomRead(roomId: string): Promise<void> {
  const session = await requireSession();
  const parsed = z.string().uuid().safeParse(roomId);
  if (!parsed.success) return;
  const supabase = await createClient();
  await supabase
    .from("chat_room_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("room_id", parsed.data)
    .eq("user_id", session.userId);
}

export type EarlierMessagesResult =
  | {
      messages: import("./ConsoleChat").ConsoleMessage[];
      refs: import("./record-ref-types").RecordRefMap;
      hasMore: boolean;
    }
  | { error: string };

/**
 * Cursor page of thread history older than `beforeIso` (audit A-11) — the
 * server half of the "Load earlier messages" control. Mirrors the page's
 * message shape (author names, formatted times, reactions, record-ref
 * chips) so older rows render identically to the initial window.
 */
export async function loadEarlierMessages(roomId: string, beforeIso: string): Promise<EarlierMessagesResult> {
  const session = await requireSession();
  const parsed = z
    .object({ roomId: z.string().uuid(), beforeIso: z.string().datetime({ offset: true }) })
    .safeParse({ roomId, beforeIso });
  if (!parsed.success) return { error: actionErrorMessage("invalid.cursor", "Invalid cursor") };
  const supabase = await createClient();

  // Deterministic membership check (RLS backstops the table).
  const { data: member } = await supabase
    .from("chat_room_members")
    .select("room_id")
    .eq("room_id", parsed.data.roomId)
    .eq("user_id", session.userId)
    .maybeSingle();
  if (!member) return { error: actionErrorMessage("not-a-member-of-this-room", "Not a member of this room") };

  const { data: msgs, error } = await supabase
    .from("chat_messages")
    .select("id, author_id, body, attachments, created_at")
    .eq("room_id", parsed.data.roomId)
    .lt("created_at", parsed.data.beforeIso)
    .order("created_at", { ascending: false })
    .limit(THREAD_PAGE_SIZE + 1);
  if (error) return { error: error.message };
  const raw = (msgs ?? []) as Array<{ id: string; author_id: string | null; body: string; attachments: unknown; created_at: string }>;
  const hasMore = raw.length > THREAD_PAGE_SIZE;
  const ordered = raw.slice(0, THREAD_PAGE_SIZE).reverse();
  if (ordered.length === 0) return { messages: [], refs: {}, hasMore: false };

  const authorIds = [...new Set(ordered.map((m) => m.author_id).filter((a): a is string => !!a))];
  const [fmt, authorsRes, refs, reactionsRes] = await Promise.all([
    getRequestFormatters(),
    authorIds.length > 0
      ? supabase.from("users").select("id, name, email").in("id", authorIds)
      : Promise.resolve({ data: [] }),
    resolveRecordRefs(
      supabase,
      session.orgId,
      ordered.map((m) => m.body),
      "platform",
    ),
    supabase
      .from("chat_message_reactions")
      .select("message_id, emoji, user_id")
      .in(
        "message_id",
        ordered.map((m) => m.id),
      ),
  ]);

  const nameById = new Map<string, string>();
  for (const a of (authorsRes.data ?? []) as Array<{ id: string; name: string | null; email: string | null }>) {
    nameById.set(a.id, a.name ?? a.email ?? "");
  }
  const reactionsByMessage = new Map<string, Map<string, { count: number; mine: boolean }>>();
  for (const r of ((reactionsRes as { data: unknown }).data ?? []) as Array<{
    message_id: string;
    emoji: string;
    user_id: string;
  }>) {
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

  return {
    hasMore,
    refs,
    messages: ordered.map((m) => ({
      id: m.id,
      authorId: m.author_id,
      authorName: m.author_id ? (nameById.get(m.author_id) ?? "") : "",
      body: m.body,
      attachments: m.attachments,
      timeText: fmt.time(m.created_at),
      dayKey: fmt.dateParts(m.created_at, { year: "numeric", month: "2-digit", day: "2-digit" }),
      dayLabel: fmt.dateParts(m.created_at, { weekday: "short", month: "short", day: "numeric" }),
      createdAt: m.created_at,
      reactions: [...(reactionsByMessage.get(m.id)?.entries() ?? [])].map(([emoji, v]) => ({
        emoji,
        count: v.count,
        mine: v.mine,
      })),
    })),
  };
}
