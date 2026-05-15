"use client";

import { useState } from "react";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { AICourseGenerator } from "./AICourseGenerator";
import type { createCourseAction } from "./actions";

type ActionType = typeof createCourseAction;

export function NewCourseWithAI({ action }: { action: ActionType }) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [duration, setDuration] = useState("");

  function applyGenerated(course: { title: string; summary: string; duration_minutes: number }) {
    setTitle(course.title);
    setSummary(course.summary);
    setDuration(String(course.duration_minutes));
  }

  return (
    <div className="space-y-5">
      <AICourseGenerator onApply={applyGenerated} />

      <FormShell action={action} cancelHref="/console/workforce/courses" submitLabel="Create Course">
        <Input
          label="Title"
          name="title"
          required
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)]">Summary</label>
          <textarea
            name="summary"
            rows={3}
            maxLength={2000}
            className="input-base mt-1.5 w-full"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </div>
        <Input
          label="Duration (minutes)"
          name="duration_minutes"
          type="number"
          min="1"
          max="600"
          hint="Estimate; shown to the assignee on /m/learning."
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />
        <Input label="Required for role" name="required_for_role" maxLength={80} />
      </FormShell>
    </div>
  );
}
