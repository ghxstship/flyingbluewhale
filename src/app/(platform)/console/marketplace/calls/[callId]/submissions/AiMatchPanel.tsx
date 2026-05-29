"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function AiMatchPanel({
  callId,
  submissionIds,
  scoredCount,
}: {
  callId: string;
  submissionIds: string[];
  scoredCount: number;
}) {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [errors, setErrors] = useState(0);

  const unscored = submissionIds.length - scoredCount;

  async function scoreAll() {
    setRunning(true);
    setDone(0);
    setErrors(0);

    for (const id of submissionIds) {
      try {
        await fetch("/api/v1/ai/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submission_id: id, call_id: callId }),
        });
        setDone((d) => d + 1);
      } catch {
        setErrors((e) => e + 1);
      }
    }

    setRunning(false);
    // Reload to show updated scores
    window.location.reload();
  }

  if (submissionIds.length === 0) return null;

  return (
    <div className="surface-inset rounded-lg p-4 flex items-center justify-between gap-4">
      <div className="text-sm">
        <span className="font-medium">AI Match Scoring</span>
        <span className="text-[var(--text-muted)] ml-2 text-xs">
          {scoredCount}/{submissionIds.length} scored
          {unscored > 0 && ` · ${unscored} pending`}
          {" · scores are advisory only"}
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {running && (
          <span className="text-xs text-[var(--text-muted)] font-mono">
            {done}/{submissionIds.length}
            {errors > 0 && ` · ${errors} err`}
          </span>
        )}
        <Button size="sm" variant="ghost" onClick={scoreAll} disabled={running}>
          {running ? "Scoring…" : "Score All with AI"}
        </Button>
      </div>
    </div>
  );
}
