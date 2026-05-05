"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Lightweight client widget that polls `router.refresh()` on a fixed cadence.
 *
 * Used by the automation run-history pages to flip in-flight runs from
 * `running` → `success`/`failed` without a manual reload. Mounted alongside
 * a server component, so all the heavy lifting still happens in the RSC.
 */
export function RunsAutoRefresh({ intervalMs = 5000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      router.refresh();
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
