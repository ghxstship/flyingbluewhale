"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PullToRefresh } from "./PullToRefresh";
import { REFRESHED_EVENT } from "./SyncStampBar";

/**
 * Server-page adapter for <PullToRefresh>: wraps a server component subtree
 * and refreshes the RSC payload on pull. Mounted ONCE at the shell level
 * (kit 32 B1 — the `(mobile)` layout wraps `<main>`), so every list screen
 * gets the gesture without per-screen copies; a soft haptic fires on
 * trigger inside PullToRefresh. Announces each pull over REFRESHED_EVENT so
 * the <SyncStampBar> re-stamps.
 */
export function RefreshShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const onRefresh = React.useCallback(async () => {
    router.refresh();
    window.dispatchEvent(new Event(REFRESHED_EVENT));
    // router.refresh() resolves synchronously; hold the spinner briefly so
    // the gesture visibly did something while the RSC payload streams in.
    await new Promise((r) => setTimeout(r, 600));
  }, [router]);
  return <PullToRefresh onRefresh={onRefresh}>{children}</PullToRefresh>;
}
