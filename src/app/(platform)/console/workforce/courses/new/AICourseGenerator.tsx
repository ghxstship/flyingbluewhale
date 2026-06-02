"use client";

import * as React from "react";
import { toast } from "sonner";

type Lesson = { title: string; objective: string };
type GeneratedCourse = { title: string; summary: string; lessons: Lesson[] };

export function AICourseGenerator({
  onAccept,
}: {
  onAccept: (course: GeneratedCourse) => void;
}) {
  const [topic, setTopic] = React.useState("");
  const [role, setRole] = React.useState("");
  const [duration, setDuration] = React.useState("");
  const [generating, setGenerating] = React.useState(false);
  const [result, setResult] = React.useState<GeneratedCourse | null>(null);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;
    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch("/api/v1/ai/generate-course", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          targetRole: role.trim() || undefined,
          durationMinutes: duration ? Number(duration) : undefined,
        }),
      });
      const json = await res.json();
      if (!json?.ok) {
        toast.error(json?.error?.message ?? "Generation failed");
        return;
      }
      setResult(json.data as GeneratedCourse);
    } catch {
      toast.error("Network error — try again");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={generate} className="space-y-3">
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">
            Topic <span className="text-[var(--color-error)]">*</span>
          </label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            maxLength={500}
            required
            placeholder="e.g. Load-in safety and rigging best practices"
            className="input-base mt-1.5 w-full"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Target role (optional)</label>
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              maxLength={80}
              placeholder="e.g. Rigger, Stage Manager"
              className="input-base mt-1.5 w-full"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Duration (min, optional)</label>
            <input
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              type="number"
              min={5}
              max={480}
              placeholder="e.g. 30"
              className="input-base mt-1.5 w-full"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={generating || !topic.trim()}
          className="btn btn-primary w-full"
        >
          {generating ? "Generating…" : "Generate with AI"}
        </button>
      </form>

      {result && (
        <div className="surface-raised rounded-lg border border-[var(--border-color)] p-4 space-y-3">
          <div className="space-y-1">
            <div className="text-[10px] font-semibold tracking-wider uppercase text-[var(--text-muted)]">
              Generated Course
            </div>
            <p className="text-sm font-semibold">{result.title}</p>
            <p className="text-xs text-[var(--text-secondary)]">{result.summary}</p>
          </div>
          {result.lessons.length > 0 && (
            <ol className="space-y-1.5 list-none">
              {result.lessons.map((l, i) => (
                <li key={i} className="text-xs">
                  <span className="font-medium">
                    {i + 1}. {l.title}
                  </span>
                  <span className="text-[var(--text-muted)]"> — {l.objective}</span>
                </li>
              ))}
            </ol>
          )}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              className="btn btn-primary btn-sm flex-1"
              onClick={() => onAccept(result)}
            >
              Use This Course
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setResult(null)}
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
