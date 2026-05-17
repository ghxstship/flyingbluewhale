"use client";

import { useState } from "react";
import { ModuleHeader } from "@/components/Shell";

type Suggestion = {
  crew_id: string;
  name: string;
  score: number;
  reason: string;
  available: boolean;
};

type SuggestResult = {
  suggestions: Suggestion[];
  crew_count: number;
};

export default function SmartSchedulePage() {
  const [role, setRole] = useState("");
  const [skills, setSkills] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [slots, setSlots] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SuggestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runSuggest() {
    if (!role || !startsAt || !endsAt) {
      setError("Role, start time, and end time are required.");
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const resp = await fetch("/api/v1/scheduler/suggest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          role,
          requiredSkills: skills.split(",").map((s) => s.trim()).filter(Boolean),
          startsAt,
          endsAt,
          slotsNeeded: slots,
        }),
      });
      if (!resp.ok) {
        const err = (await resp.json()) as { message?: string };
        throw new Error(err.message ?? "Request failed");
      }
      const data = (await resp.json()) as { data: SuggestResult };
      setResult(data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ModuleHeader
        eyebrow="Workforce"
        title="Smart Scheduler"
        subtitle="AI crew suggestions — LASSO / Rentman parity"
      />
      <div className="page-content max-w-2xl space-y-6">
        <div className="surface rounded-xl p-5 space-y-4">
          <h2 className="font-medium text-sm uppercase tracking-wide text-[var(--text-muted)]">Shift parameters</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium block mb-1">Role needed <span className="text-[color:var(--color-error)]">*</span></label>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Stage Manager, AV Tech, Security"
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-inset)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--org-primary)]"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Shift start <span className="text-[color:var(--color-error)]">*</span></label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value ? new Date(e.target.value).toISOString() : "")}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-inset)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--org-primary)]"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Shift end <span className="text-[color:var(--color-error)]">*</span></label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value ? new Date(e.target.value).toISOString() : "")}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-inset)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--org-primary)]"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Slots needed</label>
              <input
                type="number"
                min={1}
                max={50}
                value={slots}
                onChange={(e) => setSlots(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-inset)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--org-primary)]"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Required skills <span className="text-[var(--text-muted)] font-normal">(comma-separated)</span></label>
              <input
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="e.g. CDL, First Aid, Rigger"
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-inset)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--org-primary)]"
              />
            </div>
          </div>

          {error && <p className="text-sm text-[color:var(--color-error)]">{error}</p>}

          <button
            onClick={runSuggest}
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-[var(--org-primary)] text-white text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Analyzing roster…" : "Suggest crew"}
          </button>
        </div>

        {result && (
          <div className="surface rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="font-medium">AI Suggestions</h2>
              <span className="text-xs text-[var(--text-muted)]">{result.crew_count} crew in roster</span>
            </div>
            {result.suggestions.length === 0 ? (
              <div className="p-6 text-sm text-[var(--text-muted)]">No suggestions available. Add crew to your roster first.</div>
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {result.suggestions.map((s, i) => (
                  <li key={s.crew_id} className="px-4 py-3 flex items-start gap-3">
                    <div className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${s.available ? "bg-[var(--org-primary)]" : "bg-[var(--text-muted)]"}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{s.name}</span>
                        {!s.available && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--surface-raised)] text-[var(--text-muted)]">Conflict</span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--text-muted)] mt-0.5">{s.reason}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className="text-sm font-semibold">{s.score}</span>
                      <span className="text-xs text-[var(--text-muted)]">/100</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </>
  );
}
