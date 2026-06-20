"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { AiCourseDraft } from "@/app/api/v1/courses/ai-draft/route";

type Props = {
  onDraft: (draft: AiCourseDraft) => void;
};

export function AiCourseBuilder({ onDraft }: Props) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [role, setRole] = useState("");
  const [duration, setDuration] = useState(30);
  const [pending, start] = useTransition();

  const generate = () => {
    if (!topic.trim()) return;
    start(async () => {
      const res = await fetch("/api/v1/courses/ai-draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          targetRole: role.trim() || undefined,
          durationMinutes: duration,
        }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        draft?: AiCourseDraft;
        error?: { message: string };
      };
      if (!json.ok || !json.draft) {
        toast.error(json.error?.message ?? "AI generation failed — please retry");
        return;
      }
      onDraft(json.draft);
      setOpen(false);
      toast.success("Course outline generated — review and save");
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ps-btn ps-btn--ghost flex items-center gap-1.5 text-[var(--p-accent-text)]"
      >
        <span aria-hidden>✦</span> Generate with AI
      </button>
    );
  }

  return (
    <div className="surface rounded-lg p-4 space-y-3 mb-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Generate Course with AI</p>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-[var(--p-text-2)]">
          Cancel
        </button>
      </div>

      <div>
        <label className="text-xs font-medium text-[var(--p-text-2)] block mb-1">Topic *</label>
        <input
          className="ps-input w-full"
          placeholder="e.g. Stage rigging safety, Radio protocol, Load-in procedures"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          maxLength={200}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)] block mb-1">Target role (optional)</label>
          <input
            className="ps-input w-full"
            placeholder="e.g. Rigger, Stage Manager"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            maxLength={80}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)] block mb-1">Duration (minutes)</label>
          <input
            className="ps-input w-full"
            type="number"
            min={5}
            max={300}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
        </div>
      </div>

      <button
        type="button"
        className="ps-btn w-full"
        disabled={!topic.trim() || pending}
        onClick={generate}
      >
        {pending ? "Generating…" : "Generate course outline"}
      </button>
    </div>
  );
}
