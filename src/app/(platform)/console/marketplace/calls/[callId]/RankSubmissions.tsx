"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/Badge";

type RankedItem = {
  submission_id: string;
  talent_handle: string | null;
  score: number;
  rationale: string;
};

export function RankSubmissions({ callId }: { callId: string }) {
  const [ranked, setRanked] = useState<RankedItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function rank() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/v1/marketplace/calls/${callId}/rank`, { method: "POST" });
      const j = await res.json();
      if (!res.ok) {
        setError((j as { error?: string }).error ?? "Ranking failed — try again");
        return;
      }
      setRanked((j as { ranked: RankedItem[] }).ranked);
    });
  }

  function scoreTone(score: number): "success" | "info" | "warning" | "error" {
    if (score >= 80) return "success";
    if (score >= 60) return "info";
    if (score >= 40) return "warning";
    return "error";
  }

  return (
    <section className="surface">
      <header className="flex items-center justify-between border-b border-[var(--border-color)] px-4 py-2.5">
        <div>
          <h2 className="text-sm font-semibold">✨ AI Applicant Ranking</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Score submissions against call requirements using AI
          </p>
        </div>
        <button
          onClick={rank}
          disabled={isPending}
          className="rounded-md border border-[var(--border-color)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--surface-inset)] disabled:opacity-50"
        >
          {isPending ? "Ranking…" : "Rank Applicants"}
        </button>
      </header>

      {error && (
        <p className="px-4 py-3 text-sm text-[var(--color-error)]">{error}</p>
      )}

      {ranked === null && !error && (
        <div className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">
          Click <strong>Rank Applicants</strong> to score submissions with AI based on skills, bio, and call fit.
        </div>
      )}

      {ranked !== null && ranked.length === 0 && (
        <div className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">
          No submissions to rank yet.
        </div>
      )}

      {ranked !== null && ranked.length > 0 && (
        <ol className="divide-y divide-[var(--border-color)]">
          {ranked.map((item, i) => (
            <li key={item.submission_id} className="flex items-start gap-3 px-4 py-3">
              <span className="mt-0.5 w-5 shrink-0 font-mono text-xs text-[var(--text-muted)]">
                {i + 1}.
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-sm">
                    {item.talent_handle ?? "Unknown applicant"}
                  </span>
                  <Badge variant={scoreTone(item.score)}>{item.score}/100</Badge>
                </div>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{item.rationale}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
