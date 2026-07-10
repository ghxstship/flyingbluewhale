"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

/**
 * Auto-refresh island for the Import Center. While any job is in a
 * non-terminal state (pending / parsing / inserting) the server component
 * that mounted this island re-renders every few seconds via
 * router.refresh(), so row-level progress advances without a manual reload.
 * Unmounts (and the interval with it) as soon as every job is terminal.
 */
export function ImportJobsPoller({ intervalMs = 4000 }: { intervalMs?: number }) {
  const router = useRouter();

  React.useEffect(() => {
    const id = window.setInterval(() => router.refresh(), intervalMs);
    return () => window.clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
