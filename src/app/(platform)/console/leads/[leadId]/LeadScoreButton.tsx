"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";

type ScoreTier = "hot" | "warm" | "cool" | "cold";
type Signal = { type: "positive" | "negative"; text: string };

type ScoreResult = {
  score: number;
  tier: ScoreTier;
  rationale: string;
  signals: Signal[];
};

const TIER_STYLE: Record<ScoreTier, string> = {
  hot: "bg-[#FF2E88]/15 text-[#FF2E88] border border-[#FF2E88]/30",
  warm: "bg-amber-500/15 text-amber-600 border border-amber-400/30",
  cool: "bg-blue-500/15 text-blue-600 border border-blue-400/30",
  cold: "bg-[var(--p-border)] text-[var(--p-text-2)]",
};

export function LeadScoreButton({ leadId }: { leadId: string }) {
  const t = useT();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  function run() {
    start(async () => {
      setError(null);
      try {
        const res = await fetch("/api/v1/ai/leads/score", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ leadId }),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json?.error?.message ?? "Scoring failed");
          return;
        }
        setResult(json.data);
        setOpen(true);
      } catch {
        setError("Network error — try again");
      }
    });
  }

  return (
    <div className="relative inline-flex flex-col items-end gap-2">
      {result && !open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${TIER_STYLE[result.tier]}`}
        >
          {result.score}
          <span className="ml-1 font-normal capitalize">{result.tier}</span>
        </button>
      ) : (
        <Button variant="secondary" size="sm" disabled={pending} onClick={run}>
          {pending
            ? t("console.leads.scoreButton.scoring", undefined, "Scoring…")
            : t("console.leads.scoreButton.label", undefined, "✦ AI Score")}
        </Button>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      {open && result && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-[var(--p-border)] bg-[var(--p-surface)] p-4 shadow-xl">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tabular-nums">{result.score}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${TIER_STYLE[result.tier]}`}>
                  {result.tier}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-[var(--p-text-2)]">{result.rationale}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[var(--p-text-2)] hover:text-[var(--p-text)] text-sm"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          {result.signals.length > 0 && (
            <ul className="mt-3 space-y-1.5 border-t border-[var(--p-border)] pt-3">
              {result.signals.map((s, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs">
                  <span className={s.type === "positive" ? "text-emerald-500" : "text-red-400"} aria-hidden>
                    {s.type === "positive" ? "▲" : "▼"}
                  </span>
                  <span className="text-[var(--p-text-2)]">{s.text}</span>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={run}
            disabled={pending}
            className="mt-3 text-[10px] text-[var(--p-text-2)] underline underline-offset-2 hover:text-[var(--p-text)] disabled:opacity-50"
          >
            {pending ? "Re-scoring…" : "Re-score"}
          </button>
        </div>
      )}
    </div>
  );
}
