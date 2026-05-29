"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type RoleEntry = { name: string; count: number };
type ShiftRow = { role: string; name: string; start: string; end: string; notes?: string };
type DaySchedule = { date: string; day: string; shifts: ShiftRow[] };
type ScheduleResult = {
  week_start: string;
  days: DaySchedule[];
  warnings: string[];
  coverage_pct: number;
};
type SuggestionRow = {
  id: string;
  suggestion_data: ScheduleResult;
  generation_state: string;
};

function getMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

export function ScheduleGeneratorPanel() {
  const [weekStart, setWeekStart] = useState(getMonday());
  const [roles, setRoles] = useState<RoleEntry[]>([{ name: "", count: 1 }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SuggestionRow | null>(null);
  const [expanded, setExpanded] = useState(false);

  function addRole() {
    setRoles((r) => [...r, { name: "", count: 1 }]);
  }
  function removeRole(i: number) {
    setRoles((r) => r.filter((_, idx) => idx !== i));
  }
  function updateRole(i: number, field: keyof RoleEntry, value: string | number) {
    setRoles((r) => r.map((entry, idx) => (idx === i ? { ...entry, [field]: value } : entry)));
  }

  async function generate() {
    setError(null);
    const validRoles = roles.filter((r) => r.name.trim());
    if (!validRoles.length) {
      setError("Add at least one role before generating.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/v1/ai/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ week_start: weekStart, roles: validRoles }),
      });
      const json = (await res.json()) as { data?: SuggestionRow; error?: string; message?: string };
      if (!res.ok) throw new Error(json.message ?? json.error ?? "Request failed");
      setResult(json.data ?? null);
      setExpanded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function markApplied() {
    if (!result) return;
    await fetch("/api/v1/ai/schedule", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: result.id }),
    });
    setResult((r) => (r ? { ...r, generation_state: "applied" } : r));
  }

  return (
    <div className="surface p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Generate AI Schedule</h2>
        <span className="text-xs text-[var(--text-muted)]">Powered by Claude · advisory only</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Week Starting"
          type="date"
          value={weekStart}
          onChange={(e) => setWeekStart(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-[var(--text-secondary)]">Role Requirements</p>
        {roles.map((role, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Role name (e.g. Stage Manager)"
              value={role.name}
              onChange={(e) => updateRole(i, "name", e.target.value)}
              className="input-base flex-1 text-sm"
            />
            <input
              type="number"
              min={1}
              max={99}
              value={role.count}
              onChange={(e) => updateRole(i, "count", Number(e.target.value))}
              className="input-base w-16 text-center text-sm"
            />
            {roles.length > 1 && (
              <button
                type="button"
                onClick={() => removeRole(i)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] px-1"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addRole}
          className="text-xs text-[var(--brand)] hover:underline"
        >
          + Add role
        </button>
      </div>

      {error && <p className="text-xs text-[var(--error)]">{error}</p>}

      <Button onClick={generate} disabled={loading} size="sm">
        {loading ? "Generating…" : "Generate Schedule"}
      </Button>

      {result && (
        <div className="mt-4 border-t border-[var(--border)] pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium">
                Week of {result.suggestion_data.week_start} ·{" "}
                <span className={result.suggestion_data.coverage_pct >= 90 ? "text-[var(--success)]" : ""}>
                  {result.suggestion_data.coverage_pct}% coverage
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setExpanded((x) => !x)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--foreground)]"
              >
                {expanded ? "Collapse" : "Expand"}
              </button>
              {result.generation_state !== "applied" && (
                <Button size="sm" variant="ghost" onClick={markApplied}>
                  Mark Applied
                </Button>
              )}
            </div>
          </div>

          {result.suggestion_data.warnings?.length > 0 && (
            <div className="surface-inset rounded p-3 text-xs text-[var(--warning)] space-y-1">
              {result.suggestion_data.warnings.map((w, i) => (
                <div key={i}>⚠ {w}</div>
              ))}
            </div>
          )}

          {expanded &&
            result.suggestion_data.days?.map((day) => (
              <div key={day.date} className="space-y-1">
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                  {day.day} · {day.date}
                </p>
                <div className="data-table rounded overflow-hidden text-xs">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left">
                        <th className="px-3 py-2">Role</th>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">Start</th>
                        <th className="px-3 py-2">End</th>
                        <th className="px-3 py-2">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {day.shifts.map((s, si) => (
                        <tr key={si}>
                          <td className="px-3 py-1.5">{s.role}</td>
                          <td className="px-3 py-1.5 font-medium">{s.name}</td>
                          <td className="px-3 py-1.5 font-mono">{s.start}</td>
                          <td className="px-3 py-1.5 font-mono">{s.end}</td>
                          <td className="px-3 py-1.5 text-[var(--text-secondary)]">{s.notes ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
