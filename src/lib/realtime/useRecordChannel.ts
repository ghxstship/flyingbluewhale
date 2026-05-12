"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { recordChannelName } from "./channels";

export type RecordChangePayload = {
  eventType: "UPDATE" | "DELETE";
  new: Record<string, unknown>;
  old: Record<string, unknown>;
};

/**
 * Subscribe to Postgres `UPDATE`/`DELETE` events for a single row.
 *
 * NOTE: Requires that the table is added to the `supabase_realtime`
 * publication in Supabase. Most FLYTEHAUS tables aren't yet — this hook is
 * forward-looking. When the table isn't published, the subscription
 * succeeds but no events fire, which is the desired no-op fallback.
 *
 * Channel naming + filter mirror SmartSuite's per-record live updates
 * pattern. See `docs/research/smartsuite-parity/04-solutions-permissions-collab.md`
 * (#5).
 */
export function useRecordChannel({
  table,
  id,
  onChange,
}: {
  table: string;
  id: string;
  onChange: (payload: RecordChangePayload) => void;
}): { isOnline: boolean } {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(recordChannelName(table, id))
      .on(
        // The `postgres_changes` event is typed loosely on supabase-js;
        // cast through unknown so we can keep our narrower public payload
        // type without leaking generated types into hook callers.
        "postgres_changes" as never,
        {
          event: "*",
          schema: "public",
          table,
          filter: `id=eq.${id}`,
        } as never,
        (payload: unknown) => {
          const p = payload as {
            eventType?: string;
            new?: Record<string, unknown>;
            old?: Record<string, unknown>;
          };
          if (p.eventType !== "UPDATE" && p.eventType !== "DELETE") return;
          onChange({
            eventType: p.eventType,
            new: p.new ?? {},
            old: p.old ?? {},
          });
        },
      )
      .subscribe((status) => {
        setIsOnline(status === "SUBSCRIBED");
      });

    return () => {
      void channel.unsubscribe();
    };
  }, [table, id, onChange]);

  return { isOnline };
}
