"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type PresentUser = {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  joinedAt: number;
};

/**
 * Subscribe to a Supabase Realtime presence channel and track the current user.
 *
 * The channel is keyed by `userId` so multiple tabs from the same user
 * collapse into a single presence entry. Cleanup on unmount unsubscribes
 * the channel; without that, the connection leaks across navigations.
 *
 * Usage:
 *   const { peers, isOnline } = usePresenceChannel({
 *     channelName: presenceChannelName("projects", projectId),
 *     user: { userId, displayName, avatarUrl },
 *   });
 */
export function usePresenceChannel(opts: {
  channelName: string;
  user: { userId: string; displayName: string; avatarUrl?: string };
}): { peers: PresentUser[]; isOnline: boolean } {
  const [peers, setPeers] = useState<PresentUser[]>([]);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(opts.channelName, {
      config: { presence: { key: opts.user.userId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresentUser>();
        const flat: PresentUser[] = [];
        for (const userIdKey in state) {
          for (const meta of state[userIdKey] ?? []) flat.push(meta);
        }
        setPeers(flat);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setIsOnline(true);
          await channel.track({
            userId: opts.user.userId,
            displayName: opts.user.displayName,
            avatarUrl: opts.user.avatarUrl,
            joinedAt: Date.now(),
          });
        } else {
          setIsOnline(false);
        }
      });

    return () => {
      void channel.unsubscribe();
    };
  }, [opts.channelName, opts.user.userId, opts.user.displayName, opts.user.avatarUrl]);

  return { peers, isOnline };
}
