"use client";

import { useState } from "react";
import { ModuleHeader } from "@/components/Shell";

export default function ShiftAssistPage() {
  const [projectId, setProjectId] = useState("");
  const [shiftDate, setShiftDate] = useState("");
  const [role, setRole] = useState("");
  const [gapDescription, setGapDescription] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOutput("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/v1/ai/shift-assist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId, shiftDate, role, gapDescription }),
      });

      if (!res.ok || !res.body) {
        const json = await res.json().catch(() => ({}));
        setError((json as { error?: { message?: string } }).error?.message ?? "Request failed");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const payload = JSON.parse(line.slice(6)) as { text?: string; message?: string };
              if (payload.text) setOutput((p) => p + payload.text);
              if (payload.message) setError(payload.message);
            } catch {
              // skip malformed
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ModuleHeader
        eyebrow="AI"
        title="Shift Coverage Assistant"
        subtitle="Deputy AI parity — identify crew gaps and get ranked replacement recommendations powered by Claude."
      />
      <div className="page-content space-y-5">
        <div className="surface p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block text-xs font-semibold">
                Project ID (UUID)
                <input
                  type="text"
                  required
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="mt-1 w-full rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2 font-mono text-sm"
                />
              </label>
              <label className="block text-xs font-semibold">
                Shift Date
                <input
                  type="date"
                  required
                  value={shiftDate}
                  onChange={(e) => setShiftDate(e.target.value)}
                  className="mt-1 w-full rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2 text-sm"
                />
              </label>
            </div>
            <label className="block text-xs font-semibold">
              Open Role (optional)
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Stage Manager, Rigger, AV Tech"
                className="mt-1 w-full rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs font-semibold">
              Gap Description (optional)
              <textarea
                rows={3}
                value={gapDescription}
                onChange={(e) => setGapDescription(e.target.value)}
                placeholder="Describe what coverage is needed, any skill requirements, urgency..."
                className="mt-1 w-full rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2 text-sm"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? "Analyzing coverage…" : "Find Coverage"}
            </button>
          </form>
        </div>

        {error && (
          <div className="surface border border-[var(--color-error,#ef4444)] p-4 text-sm text-[var(--color-error,#ef4444)]">
            {error}
          </div>
        )}

        {(output || loading) && (
          <div className="surface p-5">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">
                Claude — Shift Coverage Analysis
              </span>
              {loading && (
                <span className="font-mono text-xs text-[var(--text-muted)] animate-pulse">streaming…</span>
              )}
            </div>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{output}</pre>
          </div>
        )}

        <div className="surface p-4 text-xs text-[var(--text-muted)] space-y-1">
          <p className="font-semibold">How it works</p>
          <p>
            Claude cross-references your org&apos;s crew roster against active time entries and approved time-off
            requests for the shift date to build an availability map, then ranks the best-fit crew by role and skill
            alignment. Competing with Deputy AI Labor Optimisation and Homebase Scheduling Assistant.
          </p>
        </div>
      </div>
    </>
  );
}
