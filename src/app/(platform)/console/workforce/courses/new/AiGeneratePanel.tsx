"use client";

import * as React from "react";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type QuizQuestion = {
  question: string;
  options: string[];
  correct_index: number;
};

type Lesson = {
  title: string;
  kind: "text" | "video" | "quiz";
  content: string;
  quiz_questions?: QuizQuestion[];
};

type GeneratedCourse = {
  title: string;
  summary: string;
  duration_minutes: number;
  lessons: Lesson[];
};

// IDs must match the form fields in page.tsx
const FIELD_IDS = {
  title: "course-title",
  summary: "course-summary",
  duration: "course-duration",
};

export function AiGeneratePanel() {
  const [open, setOpen] = React.useState(false);
  const [topic, setTopic] = React.useState("");
  const [audience, setAudience] = React.useState("");
  const [lessonCount, setLessonCount] = React.useState(4);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState<GeneratedCourse | null>(null);

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    setPreview(null);
    try {
      const res = await fetch("/api/v1/ai/generate-course", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic, audience: audience || undefined, lesson_count: lessonCount }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message ?? json?.message ?? "Generation failed");
        return;
      }
      setPreview(json.data ?? json);
    } catch {
      setError("Request failed — please try again");
    } finally {
      setLoading(false);
    }
  };

  const applyToForm = (course: GeneratedCourse) => {
    const titleEl = document.getElementById(FIELD_IDS.title) as HTMLInputElement | null;
    const summaryEl = document.getElementById(FIELD_IDS.summary) as HTMLTextAreaElement | null;
    const durationEl = document.getElementById(FIELD_IDS.duration) as HTMLInputElement | null;
    if (titleEl) titleEl.value = course.title;
    if (summaryEl) summaryEl.value = course.summary;
    if (durationEl) durationEl.value = String(course.duration_minutes);
    setOpen(false);
  };

  return (
    <div className="rounded-lg border border-dashed border-[var(--p-border)] bg-[var(--p-surface)]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
      >
        <span className="flex items-center gap-2">
          <Sparkles size={15} className="text-[var(--p-accent)]" aria-hidden />
          Generate with AI
        </span>
        {open ? <ChevronUp size={14} aria-hidden /> : <ChevronDown size={14} aria-hidden />}
      </button>

      {open && (
        <div className="border-t border-[var(--p-border)] px-4 pb-4 pt-3 space-y-3">
          <p className="text-xs text-[var(--p-text-2)]">
            Describe a training topic and Claude will generate a full course outline — title, summary, lessons, and quiz
            questions — which you can review before applying to the form.
          </p>

          <Input
            label="Topic"
            value={topic}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTopic(e.target.value)}
            placeholder="e.g. Fire safety and evacuation procedures"
            maxLength={300}
          />
          <Input
            label="Target audience (optional)"
            value={audience}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAudience(e.target.value)}
            placeholder="e.g. Stage crew, first-time crew members"
            maxLength={200}
          />
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-[var(--p-text-2)] whitespace-nowrap">
              Lessons: {lessonCount}
            </label>
            <input
              type="range"
              min={1}
              max={8}
              value={lessonCount}
              onChange={(e) => setLessonCount(Number(e.target.value))}
              className="flex-1"
            />
          </div>

          <Button type="button" onClick={generate} disabled={!topic.trim() || loading} size="sm">
            {loading ? "Generating…" : "Generate outline"}
          </Button>

          {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}

          {preview && (
            <div className="mt-3 space-y-3 rounded border border-[var(--p-border)] bg-[var(--p-bg)] p-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--p-text-2)]">Preview</p>
                <p className="mt-1 font-semibold">{preview.title}</p>
                <p className="mt-0.5 text-xs text-[var(--p-text-2)]">{preview.summary}</p>
                <p className="mt-0.5 text-xs text-[var(--p-text-2)]">{preview.duration_minutes} min estimated</p>
              </div>
              <ul className="space-y-1">
                {preview.lessons.map((l, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <span className="mt-0.5 rounded bg-[var(--p-surface)] px-1.5 py-0.5 font-mono text-[0.65rem] uppercase">
                      {l.kind}
                    </span>
                    <span>{l.title}</span>
                    {l.quiz_questions && (
                      <span className="text-[var(--p-text-2)]">· {l.quiz_questions.length} Q</span>
                    )}
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                onClick={() => applyToForm(preview)}
                size="sm"
                variant="ghost"
              >
                Apply to form ↑
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
