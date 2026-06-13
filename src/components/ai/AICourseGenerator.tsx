"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { GenerateCourseResponse } from "@/app/api/v1/ai/generate-course/route";

type Props = {
  courseId: string;
  courseTitle: string;
};

export function AICourseGenerator({ courseId, courseTitle }: Props) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [lessonCount, setLessonCount] = useState(3);
  const [audience, setAudience] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<GenerateCourseResponse | null>(null);
  const [saving, setSaving] = useState(false);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPreview(null);
    try {
      const res = await fetch("/api/v1/ai/generate-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, lessonCount, audience: audience || undefined, courseTitle }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        data?: GenerateCourseResponse;
        error?: { message: string };
      };
      if (!json.ok || !json.data) {
        setError(json.error?.message ?? "Generation failed");
        return;
      }
      setPreview(json.data);
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  async function applyContent() {
    if (!preview) return;
    setSaving(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("courseId", courseId);
      fd.append("payload", JSON.stringify(preview));
      const res = await fetch("/api/v1/workforce/bulk-insert-course-content", {
        method: "POST",
        body: fd,
      });
      const json = (await res.json()) as { ok: boolean; error?: { message: string } };
      if (!json.ok) {
        setError(json.error?.message ?? "Could not save content");
        return;
      }
      setPreview(null);
      setTopic("");
      router.refresh();
    } catch {
      setError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="surface p-4 lg:col-span-2">
      <h2 className="text-sm font-semibold">Generate Content with AI</h2>
      <p className="mt-1 text-xs text-[var(--p-text-2)]">
        Describe the topic and AI will draft lessons and quiz questions for this course.
      </p>

      <form onSubmit={generate} className="mt-4 space-y-2">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Topic — e.g. Gate access control procedures"
          required
          maxLength={300}
          className="ps-input w-full"
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="Audience · Optional — e.g. Security staff"
            maxLength={200}
            className="ps-input flex-1"
          />
          <select
            value={lessonCount}
            onChange={(e) => setLessonCount(Number(e.target.value))}
            className="ps-input w-32"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} lesson{n > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="secondary" size="sm" disabled={loading || !topic.trim()}>
          {loading ? "Generating…" : "Generate with AI"}
        </Button>
        {error && <p className="text-xs text-[var(--p-error)]">{error}</p>}
      </form>

      {preview && (
        <div className="mt-5 space-y-4 border-t border-[var(--p-border)] pt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--p-text-2)] uppercase tracking-wide">
              Preview — {preview.lessons.length} lessons · {preview.questions.length} questions
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setPreview(null)}>
                Discard
              </Button>
              <Button size="sm" onClick={applyContent} disabled={saving}>
                {saving ? "Saving…" : "Add to Course"}
              </Button>
            </div>
          </div>

          <ol className="space-y-2">
            {preview.lessons.map((l, i) => (
              <li key={i} className="surface-inset rounded-md p-3">
                <div className="text-xs font-mono text-[var(--p-text-2)]">Lesson {i + 1}</div>
                <div className="mt-0.5 text-sm font-semibold">{l.title}</div>
                <p className="mt-1 text-xs leading-relaxed text-[var(--p-text-2)]">{l.body}</p>
              </li>
            ))}
          </ol>

          <ol className="space-y-2">
            {preview.questions.map((q, i) => (
              <li key={i} className="surface-inset rounded-md p-3">
                <div className="text-sm font-semibold">
                  Q{i + 1}. {q.prompt}
                </div>
                <ul className="mt-1.5 space-y-0.5 text-xs">
                  {q.choices.map((ch, idx) => (
                    <li key={idx} className={idx === q.correct_index ? "font-semibold text-[var(--p-success)]" : ""}>
                      {idx === q.correct_index ? "✓ " : "○ "}
                      {ch}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
