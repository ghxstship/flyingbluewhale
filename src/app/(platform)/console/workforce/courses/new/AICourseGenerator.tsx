"use client";

import { useState, useTransition } from "react";

type GeneratedLesson = {
  title: string;
  body: string;
  quiz: { question: string; options: string[]; correct_index: number }[];
};

type GeneratedSection = {
  title: string;
  lessons: GeneratedLesson[];
};

type GeneratedCourse = {
  title: string;
  summary: string;
  duration_minutes: number;
  sections: GeneratedSection[];
};

type Props = {
  onApply: (course: GeneratedCourse) => void;
};

export function AICourseGenerator({ onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [audience, setAudience] = useState("");
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [preview, setPreview] = useState<GeneratedCourse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function generate() {
    if (!prompt.trim()) return;
    setError(null);
    setPreview(null);
    startTransition(async () => {
      const res = await fetch("/api/v1/ai/course-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), audience: audience || undefined, level }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError((j as { error?: string }).error ?? "Generation failed — try again");
        return;
      }
      setPreview((j as { course: GeneratedCourse }).course);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border border-dashed border-[var(--border-color)] px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:border-[var(--org-primary)] hover:text-[var(--org-primary)] transition-colors"
      >
        <span>✨</span> Generate with AI
      </button>
    );
  }

  return (
    <div className="surface rounded-lg border border-[var(--border-color)] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">✨ AI Course Generator</h3>
        <button
          type="button"
          onClick={() => { setOpen(false); setPreview(null); setError(null); }}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          Close
        </button>
      </div>

      <div>
        <label className="text-xs font-medium text-[var(--text-secondary)]">Topic / prompt *</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="e.g. Safety procedures for audio riggers working at heights"
          className="input-base mt-1.5 w-full resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">Audience</label>
          <input
            type="text"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="e.g. Event crew, new hires"
            maxLength={200}
            className="input-base mt-1.5 w-full"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">Level</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as typeof level)}
            className="input-base mt-1.5 w-full"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={generate}
        disabled={!prompt.trim() || isPending}
        className="btn btn-primary w-full"
      >
        {isPending ? "Generating…" : "Generate Course"}
      </button>

      {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}

      {preview && (
        <div className="space-y-3 rounded-md bg-[var(--surface-inset)] p-4">
          <div>
            <p className="text-[10px] font-semibold tracking-widest text-[var(--text-muted)] uppercase">Preview</p>
            <p className="mt-1 font-semibold">{preview.title}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{preview.summary}</p>
            <p className="mt-1 font-mono text-[10px] text-[var(--text-muted)]">
              ~{preview.duration_minutes} min · {preview.sections.length} section
              {preview.sections.length !== 1 ? "s" : ""} ·{" "}
              {preview.sections.reduce((s, sec) => s + sec.lessons.length, 0)} lessons
            </p>
          </div>
          <ul className="space-y-1">
            {preview.sections.map((sec, si) => (
              <li key={si} className="text-xs">
                <span className="font-medium">{sec.title}</span>
                <ul className="ml-3 mt-0.5 space-y-0.5 text-[var(--text-muted)]">
                  {sec.lessons.map((l, li) => (
                    <li key={li}>· {l.title}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => { onApply(preview); setOpen(false); setPreview(null); }}
            className="btn btn-primary w-full"
          >
            Use This Course
          </button>
        </div>
      )}
    </div>
  );
}
