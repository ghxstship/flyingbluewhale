"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type ApproveResult = {
  processed: number;
  approved: number;
  flagged: number;
  results: { id: string; action: string; reason?: string }[];
};

export function AutoApproveButton() {
  const [result, setResult] = useState<ApproveResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function run() {
    setError(null);
    setResult(null);
    startTransition(async () => {
      const res = await fetch("/api/v1/time-entries/auto-approve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const j = await res.json();
      if (!res.ok) {
        setError((j as { error?: string }).error ?? "Auto-approve failed");
        return;
      }
      setResult(j as ApproveResult);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={run}
        disabled={isPending}
        className="rounded-md border border-[var(--border-color)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-inset)] hover:text-[var(--text-primary)] disabled:opacity-50"
      >
        {isPending ? "Running…" : "✨ Auto-approve"}
      </button>
      {result && (
        <span className="text-xs text-[var(--text-muted)]">
          {result.approved} approved · {result.flagged} flagged
        </span>
      )}
      {error && <span className="text-xs text-[var(--color-error)]">{error}</span>}
    </div>
  );
}
