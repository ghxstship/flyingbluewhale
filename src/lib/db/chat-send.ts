import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { writeInbox, writeInboxBulk } from "@/lib/inbox";

/**
 * Shared chat send — the one write path behind the console inbox
 * (`/studio/inbox`), the COMPVSS field inbox (`/m/inbox/[roomId]`) and the
 * portal AM threads (`/p/[slug]/messages/[roomId]`).
 *
 * Before this module the three shells had forked: only the portal action
 * fanned out to the recipients' inbox/push, and only the console stamped the
 * sender's own read cursor (so a console user's sent message flipped their
 * own room unread in the other shells). Every send now does all four steps:
 *
 *   1. org-pin + membership guard (RLS backstops; explicit checks make the
 *      failure deterministic),
 *   2. insert the message,
 *   3. bump `chat_rooms.last_message_at` AND stamp the author's own
 *      `chat_room_members.last_read_at`,
 *   4. fan out one inbox row (+ preference-gated push, kind `chat`) per
 *      other member — mentioned members get a distinct "mentioned you"
 *      title.
 *
 * Mentions: the composers insert literal `@Display Name` text (there is no
 * mention store — ADR-0014 defers it), so a mention is detected by matching
 * each member's display name against the body. Purely additive: a matched
 * member is notified with mention framing; unmatched `@text` stays plain.
 */

export type ChatSendResult = { messageId: string } | { error: string };

export async function sendChatMessage(opts: {
  supabase: SupabaseClient;
  orgId: string;
  authorId: string;
  roomId: string;
  body: string;
}): Promise<ChatSendResult> {
  const { supabase, orgId, authorId, roomId, body } = opts;

  const { data: room } = await supabase
    .from("chat_rooms")
    .select("id, org_id, room_kind, name")
    .eq("id", roomId)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!room) return { error: "Thread not found." };
  const roomRow = room as { id: string; room_kind: string; name: string | null };

  const { data: members } = await supabase
    .from("chat_room_members")
    .select("user_id")
    .eq("room_id", roomId);
  const memberIds = ((members ?? []) as Array<{ user_id: string }>).map((m) => m.user_id);
  if (!memberIds.includes(authorId)) return { error: "You are not a member of this thread." };

  const now = new Date().toISOString();
  const { data: msg, error: msgError } = await supabase
    .from("chat_messages")
    .insert({ org_id: orgId, room_id: roomId, author_id: authorId, body })
    .select("id")
    .single();
  if (msgError || !msg) return { error: msgError?.message ?? "Could not send message" };
  const messageId = (msg as { id: string }).id;

  await Promise.all([
    supabase.from("chat_rooms").update({ last_message_at: now }).eq("id", roomId),
    // Stamp the sender's own cursor so their own message never reads as
    // unread to them in any shell.
    supabase
      .from("chat_room_members")
      .update({ last_read_at: now })
      .eq("room_id", roomId)
      .eq("user_id", authorId),
  ]);

  // ── Fan-out to the other members ─────────────────────────────────────────
  const otherIds = memberIds.filter((id) => id !== authorId);
  if (otherIds.length > 0) {
    // One name lookup serves both the notification title and mention
    // detection. Fire-and-forget from the caller's perspective would hide
    // real failures behind a green send, so the lookup + writes are awaited;
    // writeInbox itself treats push as best-effort.
    const { data: users } = await supabase
      .from("users")
      .select("id, name, email")
      .is("deleted_at", null)
      .in("id", [authorId, ...otherIds]);
    const nameById = new Map<string, string>();
    for (const u of (users ?? []) as Array<{ id: string; name: string | null; email: string | null }>) {
      nameById.set(u.id, u.name ?? u.email ?? "Someone");
    }
    const authorName = nameById.get(authorId) ?? "Someone";
    const roomLabel =
      roomRow.room_kind === "direct" ? null : (roomRow.name ?? "a channel");
    const title = roomLabel ? `${authorName} in ${roomLabel}` : authorName;

    const mentioned = new Set(
      otherIds.filter((id) => {
        const name = nameById.get(id);
        return !!name && body.includes(`@${name}`);
      }),
    );
    const plain = otherIds.filter((id) => !mentioned.has(id));

    // Chat recipients read on the field inbox; the bell + push resolve the
    // cross-shell absolute URL (same convention the portal fan-out set).
    const href = `/m/inbox/${roomId}`;
    const base = {
      orgId,
      kind: "chat" as const,
      sourceType: "chat_messages",
      sourceId: messageId,
      actorId: authorId,
      body,
      href,
    };
    await Promise.all([
      plain.length > 0 ? writeInboxBulk(plain, { ...base, title }) : Promise.resolve(null),
      ...[...mentioned].map((userId) =>
        writeInbox({ ...base, userId, title: `${authorName} mentioned you` }),
      ),
    ]);
  }

  return { messageId };
}
