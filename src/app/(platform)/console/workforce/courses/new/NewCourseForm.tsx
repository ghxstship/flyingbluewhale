"use client";

import { useActionState, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { createCourseAction, type State } from "./actions";

type Lesson = { title: string; kind: string; duration_minutes: number };
type Section = { title: string; lessons: Lesson[] };
type CourseOutline = { title: string; summary: string; sections: Section[] };

export function NewCourseForm() {
  const [state, formAction, pending] = useActionState<State, FormData>(createCourseAction, null);
  const [aiTopic, setAiTopic] = useState("");
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiPending, startAi] = useTransition();
  const [outline, setOutline] = useState<CourseOutline | null>(null);

  function handleGenerate() {
    if (!aiTopic.trim()) return;
    setAiError(null);
    startAi(async () => {
      const res = await fetch("/api/v1/ai/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "course", topic: aiTopic }),
      });
      const json = await res.json();
      if (!res.ok) { setAiError(json.error?.message ?? "AI failed"); return; }
      setOutline(json.data.outline);
    });
  }

  const totalMinutes = outline?.sections.flatMap((s) => s.lessons).reduce((a, l) => a + l.duration_minutes, 0) ?? 0;

  return (
    <div className="space-y-4">
      <div className="surface rounded-md border border-[var(--border-color)] p-4 space-y-3">
        <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Generate with AI</p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Course topic (e.g. Radio etiquette for event crew)"
            value={aiTopic}
            onChange={(e) => setAiTopic(e.target.value)}
            className="input-base focus-ring flex-1 text-sm"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleGenerate())}
          />
          <Button type="button" variant="secondary" onClick={handleGenerate} disabled={aiPending || !aiTopic.trim()}>
            {aiPending ? "Generating…" : "Generate"}
          </Button>
        </div>
        {aiError && <p className="text-xs text-[var(--color-red-600)]">{aiError}</p>}

        {outline && (
          <div className="space-y-2 pt-1">
            <p className="text-xs font-medium">
              Generated: <strong>{outline.title}</strong> · {outline.sections.length} sections · ~{totalMinutes} min
            </p>
            {outline.sections.map((s, i) => (
              <details key={i} className="rounded bg-[var(--surface-inset)] p-2 text-xs">
                <summary className="cursor-pointer font-medium">{s.title}</summary>
                <ul className="mt-1 space-y-0.5 pl-3">
                  {s.lessons.map((l, j) => (
                    <li key={j} className="text-[var(--text-secondary)]">
                      {l.title} <span className="text-[var(--text-muted)]">({l.kind}, {l.duration_minutes}m)</span>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
            <p className="text-[11px] text-[var(--text-muted)]">
              Review the outline above, then fill in the form below to save the course. Lessons can be added after creation.
            </p>
          </div>
        )}
      </div>

      <form action={formAction} className="surface space-y-4 p-6">
        <Input
          label="Title"
          name="title"
          required
          maxLength={200}
          defaultValue={outline?.title ?? ""}
          key={outline?.title}
        />
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">Summary</label>
          <textarea
            name="summary"
            rows={3}
            maxLength={2000}
            className="input-base mt-1.5 w-full"
            defaultValue={outline?.summary ?? ""}
            key={outline?.summary}
          />
        </div>
        <Input
          label="Duration (minutes)"
          name="duration_minutes"
          type="number"
          min="1"
          max="600"
          hint="Estimate; shown to the assignee on /m/learning."
          defaultValue={totalMinutes > 0 ? String(totalMinutes) : ""}
          key={totalMinutes}
        />
        <Input label="Required for role" name="required_for_role" maxLength={80} />

        {state?.error ? <Alert kind="error">{state.error}</Alert> : null}
        <div className="flex items-center justify-end gap-2">
          <Button href="/console/workforce/courses" variant="ghost">Cancel</Button>
          <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create Course"}</Button>
        </div>
      </form>
    </div>
  );
}
