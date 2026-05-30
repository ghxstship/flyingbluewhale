"use client";

import { useState } from "react";
import type { GeneratedCourse } from "@/lib/ai/generate-course";

type Props = {
  onGenerated: (course: { title: string; summary: string; duration_minutes?: number }) => void;
};

export function AiCoursePrompt({ onGenerated }: Props) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!topic.trim()) {
      setError("Please enter a course topic.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/v1/workforce/courses/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          target_role: targetRole.trim() || undefined,
          duration_minutes: durationMinutes ? Number(durationMinutes) : undefined,
        }),
      });
      const json = (await res.json()) as { ok: boolean; data?: { course: GeneratedCourse }; error?: { message: string } };
      if (!res.ok || !json.ok || !json.data) {
        setError(json.error?.message ?? "Generation failed. Please try again.");
        return;
      }
      const { course } = json.data;
      onGenerated({
        title: course.title,
        summary: course.summary,
        duration_minutes: course.duration_minutes,
      });
      // Collapse the panel after a successful generation.
      setOpen(false);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="surface rounded-lg border border-[var(--border)] mb-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-[var(--surface-raised)] transition-colors rounded-lg"
      >
        <span className="flex items-center gap-2">
          <span className="text-[var(--text-secondary)]">✦</span>
          Generate with AI
        </span>
        <span className="text-[var(--text-secondary)] text-xs">{open ? "▲ Collapse" : "▼ Expand"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-[var(--border)] pt-3">
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">
              Course topic <span className="text-[var(--danger)]">*</span>
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder="e.g. Stage rigging safety for riggers with 0-2 years experience"
              className="input-base w-full"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">
                Target role <span className="text-[var(--text-tertiary)]">(optional)</span>
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                maxLength={80}
                placeholder="e.g. Rigger, Stage Manager"
                className="input-base w-full"
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1">
                Duration (minutes) <span className="text-[var(--text-tertiary)]">(optional)</span>
              </label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                min={10}
                max={480}
                placeholder="e.g. 30"
                className="input-base w-full"
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-[var(--danger)] bg-[var(--danger-subtle)] rounded px-3 py-2">{error}</p>
          )}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            className="btn btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Generating…" : "Generate outline"}
          </button>

          <p className="text-xs text-[var(--text-tertiary)]">
            AI will fill in the title, summary, and duration. You can edit them before saving.
          </p>
        </div>
      )}
    </div>
  );
}
