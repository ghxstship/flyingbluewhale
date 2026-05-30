"use client";

import { useState } from "react";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { AiCoursePrompt } from "./AiCoursePrompt";
import { createCourseAction } from "./actions";

export default function Page() {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");

  function handleGenerated(course: { title: string; summary: string; duration_minutes?: number }) {
    setTitle(course.title);
    setSummary(course.summary);
    if (course.duration_minutes != null) {
      setDurationMinutes(String(course.duration_minutes));
    }
  }

  return (
    <>
      <ModuleHeader eyebrow="Training" title="New Course" />
      <div className="page-content max-w-2xl">
        <AiCoursePrompt onGenerated={handleGenerated} />
        <FormShell action={createCourseAction} cancelHref="/console/workforce/courses" submitLabel="Create Course">
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
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
          />
          <Input label="Required for role" name="required_for_role" maxLength={80} />
        </FormShell>
      </div>
    </>
  );
}
