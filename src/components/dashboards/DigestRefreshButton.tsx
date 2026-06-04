"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * Client island — POSTs to /api/v1/ai/digest to force-regenerate the
 * operator briefing, then triggers a router refresh so the server component
 * renders the new snapshot.
 */
export function DigestRefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleRefresh() {
    setError(null);
    try {
      const res = await fetch("/api/v1/ai/digest", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.error ?? "Refresh failed");
        return;
      }
    } catch {
      setError("Network error");
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={isPending}
      className="text-xs text-[var(--text-tertiary)] hover:text-[var(--org-primary)] transition-colors disabled:opacity-50 disabled:cursor-wait"
      aria-label="Refresh AI briefing"
    >
      {isPending ? "Refreshing…" : error ? `⚠ ${error}` : "Refresh"}
    </button>
  );
}
