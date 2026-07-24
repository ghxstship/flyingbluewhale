import "server-only";

import type { LooseSupabase } from "@/lib/supabase/loose";
import { createClient } from "@/lib/supabase/server";

/**
 * Messaging — channels + messages. `messages` carries NO `org_id`; it is
 * scoped exclusively through `channel_id` → `message_channels` (which IS
 * org-scoped). Callers MUST verify the channel belongs to the caller's org
 * (via getOrgScoped("message_channels", ...)) before reading/writing its
 * messages. RLS is the real boundary; these helpers are convenience reads.
 *
 * STATUS (comms audit 2026-07-24): this stack ("System B") is the planning
 * surface behind /studio/comms/channels ONLY. Live conversational chat is
 * the chat_rooms/chat_messages stack (src/lib/db/chat-send.ts) across all
 * three shells. Do not build new conversational features here — the two
 * stacks must not fork further. The satellite tables (message_mentions,
 * message_reactions, message_read_receipts) have schema but no UI; their
 * adoption-or-retirement disposition is tracked in
 * reports/COMMS_AUDIT_2026-07/.
 */

/** The channel kinds we author. Constrained by the DB CHECK on
 *  `message_channels.kind` (dm/group/project/role/ai_assistant/external_bridge) —
 *  this list mirrors that constraint exactly; any other value is rejected on insert. */
export const CHANNEL_KINDS = ["dm", "group", "project", "role", "ai_assistant", "external_bridge"] as const;
export type ChannelKind = (typeof CHANNEL_KINDS)[number];

export const CHANNEL_KIND_LABEL: Record<ChannelKind, string> = {
  dm: "Direct",
  group: "Group",
  project: "Project",
  role: "Role",
  ai_assistant: "AI Assistant",
  external_bridge: "External Bridge",
};

export function isChannelKind(value: string): value is ChannelKind {
  return (CHANNEL_KINDS as readonly string[]).includes(value);
}

export type ChannelRow = {
  id: string;
  org_id: string;
  kind: string;
  name: string | null;
  topic: string | null;
  project_id: string | null;
  external_provider: string | null;
  external_channel_id: string | null;
  archived: boolean;
  created_at: string;
};

export type MessageRow = {
  id: string;
  channel_id: string;
  thread_root_id: string | null;
  author_party_id: string | null;
  body_markdown: string;
  body_html: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
};

/**
 * Per-channel live message counts (deleted_at IS NULL) for the org's
 * channels. Returns a `channelId → count` map. One query: pull the
 * non-deleted message rows for the given channel ids and tally client-side
 * (PostgREST has no GROUP BY; this avoids N per-channel HEAD requests).
 */
export async function countMessagesByChannel(channelIds: string[]): Promise<Record<string, number>> {
  if (channelIds.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await (supabase as unknown as LooseSupabase)
    .from("messages")
    .select("channel_id")
    .in("channel_id", channelIds)
    .is("deleted_at", null)
    .limit(10000);
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as Array<{ channel_id: string }>) {
    counts[row.channel_id] = (counts[row.channel_id] ?? 0) + 1;
  }
  return counts;
}

/**
 * Party display names for message authors. `messages.author_party_id` keys
 * the party layer (src/lib/db/parties.ts), not auth.users — the channel
 * page used to print the raw uuid. One batched read.
 */
export async function resolvePartyNames(partyIds: string[]): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  const ids = [...new Set(partyIds.filter(Boolean))];
  if (ids.length === 0) return names;
  const supabase = await createClient();
  const { data } = await (supabase as unknown as LooseSupabase)
    .from("parties")
    .select("id, display_name")
    .in("id", ids);
  for (const row of (data ?? []) as Array<{ id: string; display_name: string | null }>) {
    if (row.display_name) names.set(row.id, row.display_name);
  }
  return names;
}

/** Messages for a single channel, oldest-first, non-deleted, capped. The
 *  caller must have already verified the channel is org-scoped. */
export async function listChannelMessages(channelId: string, limit = 200): Promise<MessageRow[]> {
  const supabase = await createClient();
  const { data, error } = await (supabase as unknown as LooseSupabase)
    .from("messages")
    .select("id, channel_id, thread_root_id, author_party_id, body_markdown, body_html, edited_at, deleted_at, created_at")
    .eq("channel_id", channelId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as MessageRow[];
}
