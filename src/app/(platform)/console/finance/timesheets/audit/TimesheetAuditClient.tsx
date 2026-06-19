"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";

type TimeEntry = {
  id: string;
  crew_name: string;
  clock_in: string;
  clock_out: string | null;
  total_minutes: number | null;
  date: string;
};

type Finding = {
  crew_name: string;
  date: string;
  issue: string;
  severity: "low" | "medium" | "high";
};

const SEVERITY_VARIANT: Record<string, "error" | "warning" | "muted"> = {
  high: "error",
  medium: "warning",
  low: "muted",
};

export function TimesheetAuditClient({ entries }: { entries: TimeEntry[] }) {
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runAudit() {
    setLoading(true);
    setError(null);
    try {
      const context = JSON.stringify(entries, null, 2);
      const res = await fetch("/api/v1/ai/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "timesheet_audit", context }),
      });
      const json = (await res.json()) as { ok: boolean; data?: { content: string }; error?: { message: string } };
      if (!json.ok) throw new Error(json.error?.message ?? "AI audit failed");
      const content = json.data?.content ?? "";
      // Extract JSON array from the AI response — the model may wrap it in markdown
      const match = content.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]) as Finding[];
        setFindings(parsed);
      } else {
        setFindings([]);
        setError("The AI response did not contain a parseable findings list.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Audit failed");
    } finally {
      setLoading(false);
    }
  }

  function fmtTime(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="space-y-6">
      {/* Raw entries table */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="ps-h text-sm uppercase tracking-widest text-[var(--p-text-2)]">
            Time Entries — Last 14 Days ({entries.length})
          </h2>
          <button
            onClick={runAudit}
            disabled={loading || entries.length === 0}
            className="ps-btn ps-btn--primary ps-btn--sm"
          >
            {loading ? "Running…" : "Run AI Audit"}
          </button>
        </div>
        {entries.length === 0 ? (
          <div className="surface p-6 text-sm text-[var(--p-text-2)]">No time entries in the last 14 days.</div>
        ) : (
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>Crew</th>
                  <th>Date</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Hours</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id}>
                    <td>{e.crew_name}</td>
                    <td className="font-mono text-xs">{e.date}</td>
                    <td className="font-mono text-xs">{fmtTime(e.clock_in)}</td>
                    <td className="font-mono text-xs">{fmtTime(e.clock_out)}</td>
                    <td className="font-mono text-xs">
                      {e.total_minutes != null ? `${(e.total_minutes / 60).toFixed(1)}h` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Findings */}
      {error && (
        <div className="surface-raised border border-[var(--p-danger)] p-4 text-sm text-[var(--p-danger)]">
          {error}
        </div>
      )}

      {findings !== null && (
        <section>
          <h2 className="ps-h mb-3 text-sm uppercase tracking-widest text-[var(--p-text-2)]">
            AI Findings ({findings.length})
          </h2>
          {findings.length === 0 ? (
            <div className="surface-raised p-6 text-sm text-[var(--p-text-2)]">
              No anomalies detected in the provided time entries.
            </div>
          ) : (
            <div className="space-y-3">
              {findings.map((f, i) => (
                <div key={i} className="surface-raised p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{f.crew_name}</div>
                      <div className="mt-0.5 font-mono text-xs text-[var(--p-text-2)]">{f.date}</div>
                      <p className="mt-1.5 text-sm">{f.issue}</p>
                    </div>
                    <div className="shrink-0">
                      <Badge variant={SEVERITY_VARIANT[f.severity] ?? "muted"}>
                        {f.severity.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
