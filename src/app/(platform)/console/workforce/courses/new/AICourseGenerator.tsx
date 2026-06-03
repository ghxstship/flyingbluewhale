"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { GeneratedCourse } from "@/app/api/v1/ai/generate-course/route";

type Props = {
  onSwitch: () => void;
};

export function AICourseGenerator({ onSwitch }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [lessonCount, setLessonCount] = useState("3");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<GeneratedCourse | null>(null);
  const [saving, setSaving] = useState(false);

  async function generate() {
    setError(null);
    setPreview(null);
    startTransition(async () => {
      const res = await fetch("/api/v1/ai/generate-course", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          topic,
          audience: audience || undefined,
          lesson_count: Math.max(1, Math.min(8, Number(lessonCount) || 3)),
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? "Generation failed");
        return;
      }
      setPreview(json.data as GeneratedCourse);
    });
  }

  async function saveCourse() {
    if (!preview) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/ai/generate-course/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(preview),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? "Save failed");
        return;
      }
      router.push(`/console/workforce/courses/${json.data.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="surface space-y-5 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">AI Course Builder</p>
          <p className="text-xs text-[var(--text-muted)]">
            Describe the topic and ATLVS AI generates a full course with lessons and quiz.
          </p>
        </div>
        <button
          type="button"
          onClick={onSwitch}
          className="text-xs text-[var(--text-muted)] underline underline-offset-2 hover:text-[var(--text-primary)]"
        >
          Build manually instead
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">Course Topic *</label>
          <textarea
            rows={2}
            maxLength={400}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Radio communication protocols for stage crew"
            className="input-base focus-ring mt-1.5 w-full"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Audience (optional)</label>
            <input
              type="text"
              maxLength={120}
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g. New stagehands"
              className="input-base focus-ring mt-1.5 w-full"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Lessons</label>
            <select
              value={lessonCount}
              onChange={(e) => setLessonCount(e.target.value)}
              className="input-base focus-ring mt-1.5 w-full"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <option key={n} value={n}>
                  {n} lesson{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error ? (
        <p className="rounded-md bg-[var(--color-error-muted)] px-3 py-2 text-xs text-[var(--color-error)]">{error}</p>
      ) : null}

      {!preview ? (
        <Button onClick={generate} disabled={isPending || topic.trim().length < 4} className="w-full">
          {isPending ? "Generating…" : "Generate Course"}
        </Button>
      ) : (
        <div className="space-y-4">
          <div className="rounded-md border border-[var(--border-color)] p-4 space-y-3">
            <div>
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-semibold">Title</p>
              <p className="text-sm font-medium mt-0.5">{preview.title}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-semibold">Summary</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">{preview.summary}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-semibold mb-1.5">
                Lessons ({preview.lessons.length})
              </p>
              <ol className="space-y-1.5">
                {preview.lessons.map((l, i) => (
                  <li key={i} className="text-xs">
                    <span className="font-medium">{i + 1}. {l.title}</span>
                    <span className="text-[var(--text-muted)] ml-1">— {l.body.slice(0, 80)}…</span>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-semibold mb-1.5">
                Quiz ({preview.quiz_questions.length} questions)
              </p>
              <ol className="space-y-1">
                {preview.quiz_questions.map((q, i) => (
                  <li key={i} className="text-xs text-[var(--text-secondary)]">
                    {i + 1}. {q.prompt}
                  </li>
                ))}
              </ol>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              Estimated duration: {preview.duration_minutes} min
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={generate} disabled={isPending || saving} className="flex-1">
              {isPending ? "Regenerating…" : "Regenerate"}
            </Button>
            <Button onClick={saveCourse} disabled={saving} className="flex-1">
              {saving ? "Saving…" : "Save Course"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
