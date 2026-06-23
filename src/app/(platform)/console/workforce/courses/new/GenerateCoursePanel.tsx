"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { GeneratedCourse } from "@/app/api/v1/ai/course-generate/route";
import { createCourseFromAI } from "./actions";

export function GenerateCoursePanel() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [preview, setPreview] = useState<GeneratedCourse | null>(null);
  const [loadingGen, setLoadingGen] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [applying, startApply] = useTransition();
  const [applyError, setApplyError] = useState<string | null>(null);

  const generate = async () => {
    if (!topic.trim() || loadingGen) return;
    setGenError(null);
    setPreview(null);
    setLoadingGen(true);
    try {
      const res = await fetch("/api/v1/ai/course-generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          audience: audience.trim() || undefined,
          lesson_count: 4,
        }),
      });
      const json = (await res.json()) as { course?: GeneratedCourse; error?: { message: string } };
      if (!res.ok) {
        setGenError(json?.error?.message ?? "Generation failed — please try again.");
        return;
      }
      setPreview(json.course ?? null);
    } catch {
      setGenError("Network error — please try again.");
    } finally {
      setLoadingGen(false);
    }
  };

  const apply = () => {
    if (!preview || applying) return;
    setApplyError(null);
    startApply(async () => {
      const res = await createCourseFromAI(preview);
      if (res?.error) {
        setApplyError(res.error);
        return;
      }
      if (res?.courseId) {
        router.push(`/console/workforce/courses/${res.courseId}`);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-[var(--p-text-2)]">Topic</label>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="e.g. Safe rigging practices for concert touring"
          className="ps-input mt-1.5 w-full"
          disabled={loadingGen || applying}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--p-text-2)]">
          Audience <span className="text-[var(--p-text-3)]">(optional)</span>
        </label>
        <input
          type="text"
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          maxLength={200}
          placeholder="e.g. Stage crew, new hires"
          className="ps-input mt-1.5 w-full"
          disabled={loadingGen || applying}
        />
      </div>

      {genError && (
        <div className="ps-alert ps-alert--danger" role="alert">
          {genError}
        </div>
      )}

      <button
        type="button"
        className="ps-btn ps-btn--cta"
        disabled={!topic.trim() || loadingGen || applying}
        onClick={generate}
      >
        {loadingGen ? "Generating…" : "Generate with AI"}
      </button>

      {preview && (
        <div className="surface-inset rounded-lg p-4 space-y-3 mt-2">
          <div className="text-[10px] font-mono text-[var(--p-text-3)] uppercase tracking-wider">Preview</div>
          <div>
            <div className="font-bold text-sm">{preview.title}</div>
            <div className="text-xs text-[var(--p-text-2)] mt-1">{preview.summary}</div>
            <div className="text-[10px] font-mono text-[var(--p-text-3)] mt-1">
              {preview.duration_minutes} min · {preview.lessons.length} lessons ·{" "}
              {preview.quiz_questions.length} quiz questions
            </div>
          </div>
          <div className="space-y-2 border-t border-[var(--p-border)] pt-2">
            {preview.lessons.map((l, i) => (
              <div key={i} className="text-sm">
                <span className="font-medium">
                  {i + 1}. {l.title}
                </span>
                <p className="text-[var(--p-text-2)] text-xs mt-0.5 line-clamp-2">{l.body}</p>
              </div>
            ))}
          </div>

          {applyError && (
            <div className="ps-alert ps-alert--danger" role="alert">
              {applyError}
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="ps-btn ps-btn--cta" disabled={applying} onClick={apply}>
              {applying ? "Creating…" : "Create Course"}
            </button>
            <button type="button" className="ps-btn" disabled={applying} onClick={() => setPreview(null)}>
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
