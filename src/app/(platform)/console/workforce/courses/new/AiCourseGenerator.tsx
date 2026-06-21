"use client";

import { useState, useTransition } from "react";
import type { GeneratedCourse } from "@/app/api/v1/ai/generate-course/route";

/** AI course outline generator — Connecteam "AI Generated Courses" pattern.
 *
 * Renders as a collapsible panel above the manual course creation form.
 * On success it pre-fills the page's [name="title"] input and
 * [name="summary"] textarea via direct DOM mutation so the parent
 * FormShell (server-action form) picks up the values on submit. */
export function AiCourseGenerator() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<GeneratedCourse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const generate = () => {
    if (!prompt.trim()) return;
    setError(null);
    setResult(null);
    start(async () => {
      try {
        const res = await fetch("/api/v1/ai/generate-course", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
        const json = (await res.json()) as { ok: boolean; data?: GeneratedCourse; error?: { message: string } };
        if (!json.ok || !json.data) {
          setError(json.error?.message ?? "Generation failed; please try again.");
          return;
        }
        setResult(json.data);
      } catch {
        setError("Network error; please try again.");
      }
    });
  };

  const applyToForm = (course: GeneratedCourse) => {
    const titleEl = document.querySelector<HTMLInputElement>('[name="title"]');
    const summaryEl = document.querySelector<HTMLTextAreaElement>('[name="summary"]');
    if (titleEl) titleEl.value = course.title;
    if (summaryEl) summaryEl.value = course.summary;
    setOpen(false);
  };

  return (
    <div className="surface-inset rounded-xl border border-[var(--p-border)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium hover:bg-[var(--p-surface-raised)] transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="text-[var(--p-accent)] text-base">✦</span>
          Generate with AI
        </span>
        <span className="font-mono text-xs text-[var(--p-text-2)]">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="border-t border-[var(--p-border)] p-4 space-y-3">
          <p className="text-xs text-[var(--p-text-2)]">
            Describe the course topic and audience. AI will generate a title, summary, and lesson outline.
          </p>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Radio comms protocol for COMPVSS field crew — covering channels, etiquette, and emergency procedures"
            rows={3}
            maxLength={2000}
            className="ps-input w-full resize-none text-sm"
          />
          <button
            type="button"
            className="ps-btn"
            disabled={pending || !prompt.trim()}
            onClick={generate}
          >
            {pending ? "Generating…" : "Generate outline"}
          </button>

          {error && (
            <p className="text-xs text-[var(--p-danger-text)]">{error}</p>
          )}

          {result && (
            <div className="space-y-3 rounded-lg border border-[var(--p-border)] bg-[var(--p-surface)] p-4">
              <div>
                <div className="text-[10px] font-semibold tracking-wider uppercase text-[var(--p-text-2)] mb-1">Title</div>
                <p className="text-sm font-semibold">{result.title}</p>
              </div>
              <div>
                <div className="text-[10px] font-semibold tracking-wider uppercase text-[var(--p-text-2)] mb-1">Summary</div>
                <p className="text-xs text-[var(--p-text-2)]">{result.summary}</p>
              </div>
              <div>
                <div className="text-[10px] font-semibold tracking-wider uppercase text-[var(--p-text-2)] mb-1">
                  Lessons ({result.lessons.length})
                </div>
                <ol className="space-y-1.5">
                  {result.lessons.map((lesson, i) => (
                    <li key={i} className="text-xs">
                      <span className="font-medium">{i + 1}. {lesson.title}</span>
                      {" — "}
                      <span className="text-[var(--p-text-2)]">{lesson.body}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  className="ps-btn"
                  onClick={() => applyToForm(result)}
                >
                  Use title & summary
                </button>
                <button
                  type="button"
                  className="ps-btn ps-btn--ghost"
                  onClick={() => { setResult(null); setPrompt(""); }}
                >
                  Discard
                </button>
              </div>
              <p className="text-[10px] text-[var(--p-text-2)]">
                Lessons will appear here as a reference — add them individually after creating the course.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
