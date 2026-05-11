"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribe to Supabase Realtime on `${schema}.${table}` filtered by a
 * single column equality. Any incoming change triggers a soft router
 * refresh — the server component re-renders, fresh rows appear, and
 * the user never sees a manual reload prompt.
 *
 * Designed as a tiny island for surfaces that already render server-side
 * (chat rooms, updates feed) — we don't add a heavyweight realtime
 * cache, we just nudge the framework to re-fetch when the truth changes.
 */
export function RealtimeRefresh({
  table,
  filter,
  channelName,
  event = "*",
  debounceMs = 300,
}: {
  table: string;
  filter?: string;
  channelName: string;
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  debounceMs?: number;
}) {
  const router = useRouter();
  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const nudge = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), debounceMs);
    };
    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", { event, schema: "public", table, ...(filter ? { filter } : {}) }, nudge)
      .subscribe();
    return () => {
      if (timer) clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [router, table, filter, channelName, event, debounceMs]);
  return null;
}
