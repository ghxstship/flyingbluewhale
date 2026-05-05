"use client";

import { useMemo } from "react";
import { presenceChannelName } from "@/lib/realtime/channels";
import { usePresenceChannel } from "@/lib/realtime/usePresenceChannel";
import { PresenceAvatars } from "./PresenceAvatars";

/**
 * `<Presence>` — broadcasts "who is viewing this record" via Supabase Realtime
 * presence channels and renders the stacked avatars in a record header.
 *
 * Render-zero is acceptable: when nobody else is on the record, this
 * component returns null so the header doesn't pick up a phantom slot.
 *
 * Pass `currentUser` from the server (don't refetch on the client) — it
 * keeps the component a pure consumer and avoids a roundtrip per page.
 *
 * Reference: SmartSuite "Who's viewing a record" + "Real-time updates":
 *   https://help.smartsuite.com/en/articles/4752887-who-s-viewing-a-record
 *   https://help.smartsuite.com/en/articles/4763647-real-time-updates
 */
export type PresenceProps = {
  /** Postgres table name backing the record (e.g. `projects`, `daily_logs`). */
  targetTable: string;
  /** Record id. */
  targetId: string;
  /** Maximum avatars to show before condensing into "+N". Default 5. */
  max?: number;
  /** Current viewer info, resolved on the server. */
  currentUser: { userId: string; displayName: string; avatarUrl?: string };
};

export function Presence({ targetTable, targetId, max = 5, currentUser }: PresenceProps) {
  const channelName = useMemo(() => presenceChannelName(targetTable, targetId), [targetTable, targetId]);

  const { peers, isOnline } = usePresenceChannel({
    channelName,
    user: currentUser,
  });

  // Filter out our own avatar — we don't show the user themselves in the
  // viewer stack, matching the SmartSuite UX.
  const others = peers.filter((p) => p.userId !== currentUser.userId);

  if (others.length === 0) return null;

  return <PresenceAvatars peers={others} max={max} isOnline={isOnline} />;
}
