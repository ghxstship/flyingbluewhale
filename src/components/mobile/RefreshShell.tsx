"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PullToRefresh } from "./PullToRefresh";

/**
 * Server-page adapter for <PullToRefresh>: wraps a server component subtree
 * and refreshes the RSC payload on pull. Mount around the main content of
 * list screens so field crews can pull for fresh data (kit gesture; a soft
 * haptic fires on trigger inside PullToRefresh).
 */
export function RefreshShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const onRefresh = React.useCallback(async () => {
    router.refresh();
    // router.refresh() resolves synchronously; hold the spinner briefly so
    // the gesture visibly did something while the RSC payload streams in.
    await new Promise((r) => setTimeout(r, 600));
  }, [router]);
  return <PullToRefresh onRefresh={onRefresh}>{children}</PullToRefresh>;
}
