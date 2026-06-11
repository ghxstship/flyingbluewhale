"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

type Assignment = {
  shift_id: string;
  crew_member_id: string;
  crew_member_name: string;
  reason: string;
  confidence: "high" | "medium" | "low";
};

type ScheduleResult = {
  assignments: Assignment[];
  unassigned_shift_ids: string[];
  notes: string;
};

const CONFIDENCE_BADGE: Record<Assignment["confidence"], string> = {
  high: "bg-[var(--p-accent)] text-white",
  medium: "bg-yellow-500 text-white",
  low: "bg-[var(--p-text-3)] text-white",
};

export function AutoScheduleButton({
  shifts,
  crew,
}: {
  shifts: Array<{
    id: string;
    starts_at: string;
    ends_at: string;
    role?: string | null;
    venue_name?: string | null;
    required_skills?: string[];
  }>;
  crew: Array<{
    id: string;
    full_name: string;
    role?: string | null;
    skills?: string[];
    overtime_eligible?: boolean;
  }>;
}) {
  const [result, setResult] = useState<ScheduleResult | null>(null);
  const [pending, start] = useTransition();

  const run = () => {
    start(async () => {
      setResult(null);
      const res = await fetch("/api/v1/ai/schedule", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ shifts, crew }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        data?: { schedule: ScheduleResult };
        error?: { message: string };
      };
      if (!json.ok) {
        toast.error(json.error?.message ?? "AI scheduling failed");
        return;
      }
      setResult(json.data!.schedule);
      toast.success("Schedule generated — review below before applying");
    });
  };

  if (shifts.length === 0) return null;

  return (
    <div className="space-y-4">
      <button
        type="button"
        className="ps-btn ps-btn--sm"
        disabled={pending}
        onClick={run}
      >
        {pending ? "Generating schedule…" : "✦ AI Auto-Schedule"}
      </button>

      {result && (
        <div className="surface p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">AI Schedule Suggestion</h3>
            <button
              type="button"
              className="text-xs text-[var(--p-text-2)] hover:underline"
              onClick={() => setResult(null)}
            >
              Dismiss
            </button>
          </div>

          {result.notes && (
            <p className="text-xs text-[var(--p-text-2)]">{result.notes}</p>
          )}

          {result.assignments.length > 0 && (
            <ul className="space-y-2">
              {result.assignments.map((a) => (
                <li key={a.shift_id} className="surface-raised flex items-start gap-3 rounded-lg p-3 text-sm">
                  <span
                    className={[
                      "mt-0.5 rounded px-1.5 py-0.5 text-xs font-semibold",
                      CONFIDENCE_BADGE[a.confidence],
                    ].join(" ")}
                  >
                    {a.confidence}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{a.crew_member_name}</div>
                    <div className="text-xs text-[var(--p-text-2)]">{a.reason}</div>
                  </div>
                  <span className="font-mono text-xs text-[var(--p-text-3)]">
                    shift {a.shift_id.slice(0, 8)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {result.unassigned_shift_ids.length > 0 && (
            <div className="surface-inset rounded-lg p-3 text-xs text-[var(--p-text-2)]">
              <span className="font-semibold text-[var(--p-error)]">Unassigned:</span>{" "}
              {result.unassigned_shift_ids.length} shift
              {result.unassigned_shift_ids.length === 1 ? "" : "s"} couldn't be filled —
              insufficient crew or availability conflicts.
            </div>
          )}

          <p className="text-xs text-[var(--p-text-3)]">
            Review suggestions above. Apply by updating each shift in Deployment.
          </p>
        </div>
      )}
    </div>
  );
}
