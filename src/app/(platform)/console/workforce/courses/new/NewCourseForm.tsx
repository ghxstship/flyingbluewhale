"use client";

import { useActionState, useRef } from "react";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { AIDraftButton, type AIDraftResult } from "@/components/ui/AIDraftButton";
import { createCourseAction, type State } from "./actions";

export function NewCourseForm() {
  const [state, formAction, pending] = useActionState<State, FormData>(createCourseAction, null);
  const titleRef = useRef<HTMLInputElement>(null);
  const summaryRef = useRef<HTMLTextAreaElement>(null);
  const lessonsRef = useRef<HTMLTextAreaElement>(null);

  function handleAIDraft(result: AIDraftResult) {
    if (result.type !== "course_outline") return;
    if (titleRef.current) titleRef.current.value = result.title;
    if (summaryRef.current) summaryRef.current.value = result.summary;
    if (lessonsRef.current) {
      lessonsRef.current.value = result.lessons
        .map((l, i) => `Lesson ${i + 1}: ${l.title}\n${l.objective}`)
        .join("\n\n");
    }
  }

  return (
    <div className="surface space-y-4 p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[var(--p-text-2)] uppercase tracking-wide">Course details</span>
        <AIDraftButton draftType="course_outline" onDraft={handleAIDraft} />
      </div>

      <form action={formAction} className="space-y-4">
        <Input label="Title" name="title" required maxLength={200} ref={titleRef} />

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-[var(--p-text-2)]">Summary</span>
          <textarea ref={summaryRef} name="summary" rows={3} maxLength={2000} className="ps-input mt-0 w-full" />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-[var(--p-text-2)]">AI-generated lesson outline</span>
          <textarea
            ref={lessonsRef}
            name="lesson_outline"
            rows={6}
            maxLength={4000}
            placeholder="Paste or edit your lesson outline here. This is for reference — lessons are added individually after the course is created."
            className="ps-input w-full font-mono text-xs"
          />
          <span className="text-[11px] text-[var(--p-text-2)]">
            Lessons are managed from the course detail page. This field is saved to the course notes for reference.
          </span>
        </label>

        <Input
          label="Duration — Minutes"
          name="duration_minutes"
          type="number"
          min="1"
          max="600"
          hint="Estimate; shown to the assignee on /m/learning."
        />
        <Input label="Required for role" name="required_for_role" maxLength={80} />

        {state?.error && <Alert kind="error">{state.error}</Alert>}

        <div className="flex items-center justify-end gap-2">
          <Button href="/console/workforce/courses" variant="ghost">
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create Course"}
          </Button>
        </div>
      </form>
    </div>
  );
}
