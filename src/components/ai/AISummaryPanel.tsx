"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

type Props = {
  dailyLogId: string;
  label?: string;
};

export function AISummaryPanel({ dailyLogId, label = "Generate AI Summary" }: Props) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/ai/summarize-daily-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyLogId }),
      });
      const json = (await res.json()) as { ok: boolean; data?: { summary: string }; error?: { message: string } };
      if (!json.ok || !json.data) {
        setError(json.error?.message ?? "Failed to generate summary");
        return;
      }
      setSummary(json.data.summary);
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">AI Executive Summary</h3>
        <Button size="sm" variant="secondary" onClick={generate} disabled={loading}>
          {loading ? "Generating…" : summary ? "Regenerate" : label}
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-[var(--p-error)]">{error}</p>}
      {summary && (
        <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-[var(--p-text-1)]">{summary}</p>
      )}
      {!summary && !error && (
        <p className="mt-2 text-xs text-[var(--p-text-2)]">
          Synthesizes manpower, deliveries, visitors, and site narrative into a PM-ready paragraph.
        </p>
      )}
    </section>
  );
}
