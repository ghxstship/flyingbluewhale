"use client";

// AI Course Creator — TalentLMS "AI Content Creator" competitive feature
// (2025). Generates a full course (title, summary, lessons, quiz questions)
// from a topic + audience. On success, populates the form fields and shows
// a preview of the generated structure so the author can review before saving.

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";

type Lesson = { ordinal: number; title: string; body: string };
type QuizQuestion = { ordinal: number; prompt: string; choices: string[]; correct_index: number };
type CourseStructure = {
  title: string;
  summary: string;
  duration_minutes: number;
  required_for_role: string | null;
  lessons: Lesson[];
  quiz_questions: QuizQuestion[];
};

export function GenerateCourseButton({
  onGenerated,
}: {
  onGenerated: (course: CourseStructure) => void;
}) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<CourseStructure | null>(null);
  const topicRef = useRef<HTMLInputElement>(null);
  const audienceRef = useRef<HTMLInputElement>(null);
  const durationRef = useRef<HTMLInputElement>(null);

  function generate() {
    const topic = topicRef.current?.value?.trim();
    if (!topic) return;
    start(async () => {
      setError(null);
      setPreview(null);
      try {
        const res = await fetch("/api/v1/ai/courses/generate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            topic,
            audience: audienceRef.current?.value?.trim() || undefined,
            durationMinutes: Number(durationRef.current?.value ?? 30) || 30,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json?.error?.message ?? "Generation failed");
          return;
        }
        setPreview(json.data);
      } catch {
        setError("Network error — try again");
      }
    });
  }

  function apply() {
    if (!preview) return;
    onGenerated(preview);
    setOpen(false);
    setPreview(null);
  }

  return (
    <>
      <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
        ✦ Generate with AI
      </Button>

      {open && (
        <div
          role="dialog"
          aria-label="Generate course with AI"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="w-full max-w-lg rounded-2xl border border-[var(--p-border)] bg-[var(--p-surface)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--p-border)] px-5 py-4">
              <h2 className="text-sm font-semibold">Generate Course with AI</h2>
              <button
                type="button"
                onClick={() => { setOpen(false); setPreview(null); }}
                className="text-[var(--p-text-2)] hover:text-[var(--p-text)]"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {!preview ? (
                <>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-[var(--p-text-2)] mb-1">
                        Topic <span className="text-red-400">*</span>
                      </label>
                      <input
                        ref={topicRef}
                        type="text"
                        placeholder="e.g. Fire extinguisher safety for venue crew"
                        className="ps-input w-full text-sm"
                        maxLength={300}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--p-text-2)] mb-1">
                        Target audience
                      </label>
                      <input
                        ref={audienceRef}
                        type="text"
                        placeholder="e.g. Stage crew, floor managers"
                        className="ps-input w-full text-sm"
                        maxLength={200}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--p-text-2)] mb-1">
                        Duration (minutes)
                      </label>
                      <input
                        ref={durationRef}
                        type="number"
                        defaultValue="30"
                        min="5"
                        max="600"
                        className="ps-input w-32 text-sm"
                      />
                    </div>
                  </div>

                  {error && <p className="text-xs text-red-500">{error}</p>}

                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={pending}
                      onClick={generate}
                    >
                      {pending ? "Generating…" : "Generate"}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    <div>
                      <p className="text-[10px] font-semibold tracking-wider uppercase text-[var(--p-text-2)]">Title</p>
                      <p className="text-sm font-medium mt-0.5">{preview.title}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold tracking-wider uppercase text-[var(--p-text-2)]">Summary</p>
                      <p className="text-xs text-[var(--p-text-2)] mt-0.5">{preview.summary}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold tracking-wider uppercase text-[var(--p-text-2)]">
                        {preview.lessons.length} Lessons · {preview.quiz_questions.length} Quiz questions
                        · {preview.duration_minutes} min
                      </p>
                      <ul className="mt-1.5 space-y-1">
                        {preview.lessons.map((l) => (
                          <li key={l.ordinal} className="text-xs text-[var(--p-text-2)]">
                            {l.ordinal}. {l.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {preview.required_for_role && (
                      <div>
                        <p className="text-[10px] font-semibold tracking-wider uppercase text-[var(--p-text-2)]">Required for role</p>
                        <p className="text-xs mt-0.5">{preview.required_for_role}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between gap-2 pt-1 border-t border-[var(--p-border)]">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreview(null)}
                    >
                      Regenerate
                    </Button>
                    <Button type="button" size="sm" onClick={apply}>
                      Use this course
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
