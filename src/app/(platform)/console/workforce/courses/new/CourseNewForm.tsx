"use client";

import { useRef, useState } from "react";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { GenerateCourseButton } from "./GenerateCourseButton";
import type { State } from "./actions";

type CourseStructure = {
  title: string;
  summary: string;
  duration_minutes: number;
  required_for_role: string | null;
  lessons: Array<{ ordinal: number; title: string; body: string }>;
  quiz_questions: Array<{ ordinal: number; prompt: string; choices: string[]; correct_index: number }>;
};

export function CourseNewForm({
  action,
  submitLabel,
  titleLabel,
  summaryLabel,
  durationLabel,
  durationHint,
  requiredForRoleLabel,
}: {
  action: (state: State, fd: FormData) => Promise<State>;
  submitLabel: string;
  titleLabel: string;
  summaryLabel: string;
  durationLabel: string;
  durationHint: string;
  requiredForRoleLabel: string;
}) {
  const titleRef = useRef<HTMLInputElement>(null);
  const summaryRef = useRef<HTMLTextAreaElement>(null);
  const durationRef = useRef<HTMLInputElement>(null);
  const roleRef = useRef<HTMLInputElement>(null);
  const [generatedLessons, setGeneratedLessons] = useState<CourseStructure["lessons"] | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<CourseStructure["quiz_questions"] | null>(null);

  function handleGenerated(course: CourseStructure) {
    if (titleRef.current) titleRef.current.value = course.title;
    if (summaryRef.current) summaryRef.current.value = course.summary;
    if (durationRef.current) durationRef.current.value = String(course.duration_minutes);
    if (roleRef.current && course.required_for_role) roleRef.current.value = course.required_for_role;
    setGeneratedLessons(course.lessons);
    setGeneratedQuestions(course.quiz_questions);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-[var(--p-text-2)]">Fill in the fields manually or generate with AI.</p>
        <GenerateCourseButton onGenerated={handleGenerated} />
      </div>

      {/* FormShell owns its own useActionState internally — pass action directly */}
      <FormShell action={action} cancelHref="/console/workforce/courses" submitLabel={submitLabel}>
        <Input
          label={titleLabel}
          name="title"
          required
          maxLength={200}
          ref={titleRef}
        />
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)]">{summaryLabel}</label>
          <textarea
            ref={summaryRef}
            name="summary"
            rows={3}
            maxLength={2000}
            className="ps-input mt-1.5 w-full"
          />
        </div>
        <Input
          label={durationLabel}
          name="duration_minutes"
          type="number"
          min="1"
          max="600"
          hint={durationHint}
          ref={durationRef}
        />
        <Input
          label={requiredForRoleLabel}
          name="required_for_role"
          maxLength={80}
          ref={roleRef}
        />

        {/* Hidden fields: AI-generated lessons + quiz questions are bulk-inserted
            by the server action after the course row is created. */}
        {generatedLessons && (
          <input type="hidden" name="ai_lessons" value={JSON.stringify(generatedLessons)} />
        )}
        {generatedQuestions && (
          <input type="hidden" name="ai_quiz_questions" value={JSON.stringify(generatedQuestions)} />
        )}
      </FormShell>

      {(generatedLessons || generatedQuestions) && (
        <div className="mt-4 rounded-xl border border-[var(--p-border)] bg-[var(--p-surface-raised)] p-4 text-xs">
          <p className="font-semibold text-[var(--p-text-2)] mb-2">AI-generated content will be added after saving:</p>
          {generatedLessons && (
            <ul className="space-y-0.5 mb-2">
              {generatedLessons.map((l) => (
                <li key={l.ordinal} className="text-[var(--p-text-2)]">▸ Lesson {l.ordinal}: {l.title}</li>
              ))}
            </ul>
          )}
          {generatedQuestions && (
            <p className="text-[var(--p-text-2)]">
              + {generatedQuestions.length} quiz question{generatedQuestions.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
