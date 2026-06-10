"use client";

import { useActionState, useState, useTransition } from "react";
import { Sparkles, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { createCourseAction, type State } from "./actions";

type GeneratedCourse = {
  title: string;
  summary: string;
  duration_minutes: number;
  lessons: Array<{
    title: string;
    content: string;
    quiz_questions: Array<{
      question: string;
      options: string[];
      answer_index: number;
    }>;
  }>;
};

export function NewCourseForm() {
  const [state, formAction, submitPending] = useActionState<State, FormData>(createCourseAction, null);
  const [genPending, startGen] = useTransition();
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [topic, setTopic] = useState("");
  const [genError, setGenError] = useState<string | null>(null);
  const [preview, setPreview] = useState<GeneratedCourse | null>(null);

  // Controlled field state — pre-populated by AI generator or edited manually
  const [title, setTitle] = useState(state?.values?.title ?? "");
  const [summary, setSummary] = useState(state?.values?.summary ?? "");
  const [duration, setDuration] = useState(state?.values?.duration_minutes ?? "");

  const generate = () => {
    if (!topic.trim()) return;
    setGenError(null);
    setPreview(null);
    startGen(async () => {
      try {
        const res = await fetch("/api/v1/ai/generate-course", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ topic: topic.trim() }),
        });
        const json = (await res.json()) as { ok: boolean; data?: GeneratedCourse; error?: { message: string } };
        if (!json.ok || !json.data) {
          setGenError(json.error?.message ?? "Generation failed. Try again.");
          return;
        }
        const g = json.data;
        setTitle(g.title ?? "");
        setSummary(g.summary ?? "");
        setDuration(String(g.duration_minutes ?? ""));
        setPreview(g);
        setShowAiPanel(false);
      } catch {
        setGenError("Network error. Check your connection and try again.");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* AI generation panel */}
      <div className="surface overflow-hidden rounded-lg border border-[var(--p-border)]">
        <button
          type="button"
          onClick={() => setShowAiPanel((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-3.5 text-sm font-medium hover:bg-[var(--p-surface-raised)] transition-colors"
        >
          <span className="flex items-center gap-2">
            <Sparkles size={15} className="text-[var(--p-accent)]" aria-hidden="true" />
            Generate with AI
          </span>
          {showAiPanel ? <ChevronUp size={15} aria-hidden="true" /> : <ChevronDown size={15} aria-hidden="true" />}
        </button>

        {showAiPanel && (
          <div className="border-t border-[var(--p-border)] px-5 py-4 space-y-3">
            <p className="text-xs text-[var(--p-text-2)]">
              Describe the training topic and we&apos;ll draft the title, summary, lessons, and quiz questions for you to review and edit.
            </p>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-[var(--p-text-2)]">Topic</span>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="e.g. Radio communication protocols for event crew, Fire extinguisher operation and placement, Safe rigging practices for overhead loads"
                className="ps-input w-full text-sm"
              />
            </label>
            {genError && (
              <div className="flex items-start gap-2 rounded-md border border-[var(--p-danger)] bg-[var(--p-danger-subtle,#fee2e2)] px-3 py-2 text-xs text-[var(--p-danger)]">
                <AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                {genError}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAiPanel(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={genPending || !topic.trim()}
                onClick={generate}
              >
                {genPending ? "Generating…" : "Generate course"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Lesson preview strip — shown after generation so user knows what was produced */}
      {preview && preview.lessons.length > 0 && (
        <div className="surface rounded-lg border border-[var(--p-border)] px-5 py-4 space-y-2">
          <p className="text-xs font-semibold text-[var(--p-text-2)] uppercase tracking-wide">
            Generated — {preview.lessons.length} lesson{preview.lessons.length !== 1 ? "s" : ""}
          </p>
          <ul className="space-y-1">
            {preview.lessons.map((l, i) => (
              <li key={i} className="flex items-baseline gap-2 text-sm">
                <span className="font-mono text-[10px] text-[var(--p-text-2)] shrink-0">{i + 1}.</span>
                <span>{l.title}</span>
                <span className="text-[10px] text-[var(--p-text-2)]">
                  · {l.quiz_questions.length} Q
                </span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-[var(--p-text-2)]">
            Lessons are saved when you create the course. Edit them from the course detail page.
          </p>
        </div>
      )}

      {/* Main form */}
      <form action={formAction} className="surface space-y-4 p-6">
        {preview?.lessons.map((lesson, li) => (
          <input key={li} type="hidden" name={`lesson_${li}`} value={JSON.stringify(lesson)} />
        ))}

        <Input
          label="Title"
          name="title"
          required
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-[var(--p-text-2)]">Summary</span>
          <textarea
            name="summary"
            rows={3}
            maxLength={2000}
            className="ps-input w-full"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </label>

        <Input
          label="Duration — Minutes"
          name="duration_minutes"
          type="number"
          min="1"
          max="600"
          hint="Estimate; shown to the assignee on /m/learning."
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />

        <Input
          label="Required for role"
          name="required_for_role"
          maxLength={80}
          defaultValue={state?.values?.required_for_role}
        />

        {state?.error && <Alert kind="error">{state.error}</Alert>}

        <div className="flex items-center justify-end gap-2">
          <Button href="/console/workforce/courses" variant="ghost">
            Cancel
          </Button>
          <Button type="submit" disabled={submitPending}>
            {submitPending ? "Creating…" : "Create Course"}
          </Button>
        </div>
      </form>
    </div>
  );
}
