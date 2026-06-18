"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";

type GeneratedOutline = {
  title?: string;
  summary?: string;
  duration_minutes?: number;
  lessons?: Array<{ ordinal?: number; title?: string }>;
};

type ApiResponse = {
  ok: boolean;
  data?: { courseId?: string; outline?: GeneratedOutline };
  error?: { message?: string };
};

// "Generate with AI" affordance on the New Course page. Lets the operator
// describe a topic and have the AI author a complete course outline with
// lessons and quiz questions, then optionally persist it directly into the DB.
export function GenerateCourseButton() {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [pending, setPending] = useState(false);

  async function generate() {
    if (!topic.trim()) return;
    setPending(true);
    try {
      const res = await fetch("/api/v1/ai/courses/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic, audience: audience || undefined, persist: true }),
      });
      const body = (await res.json()) as ApiResponse;
      if (!res.ok || !body.ok) {
        toast.error(body.error?.message ?? t("console.workforce.courses.ai.generateError", undefined, "Generation failed"));
        return;
      }
      const { courseId } = body.data ?? {};
      toast.success(t("console.workforce.courses.ai.generateSuccess", undefined, "Course generated"));
      if (courseId) {
        router.push(`/console/workforce/courses/${courseId}`);
      } else {
        router.push("/console/workforce/courses");
        router.refresh();
      }
    } catch {
      toast.error(t("console.workforce.courses.ai.generateError", undefined, "Generation failed"));
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Sparkles className="size-3.5" />
        {t("console.workforce.courses.ai.button", undefined, "Generate with AI")}
      </Button>
    );
  }

  return (
    <div className="surface rounded-lg border border-[var(--p-border)] p-4 space-y-3">
      <p className="text-xs font-semibold text-[var(--p-text-1)]">
        {t("console.workforce.courses.ai.title", undefined, "AI Course Generator")}
      </p>
      <p className="text-xs text-[var(--p-text-2)]">
        {t("console.workforce.courses.ai.description", undefined, "Describe the topic and we'll author a complete course with lessons and quizzes.")}
      </p>
      <div>
        <label className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.workforce.courses.ai.topicLabel", undefined, "Topic *")}
        </label>
        <input
          className="ps-input mt-1 w-full"
          placeholder={t("console.workforce.courses.ai.topicPlaceholder", undefined, "e.g. Rigging safety and load calculations")}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          maxLength={500}
        />
      </div>
      <div>
        <label className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.workforce.courses.ai.audienceLabel", undefined, "Audience (optional)")}
        </label>
        <input
          className="ps-input mt-1 w-full"
          placeholder={t("console.workforce.courses.ai.audiencePlaceholder", undefined, "e.g. Stage crew leads, venue managers")}
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          maxLength={200}
        />
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={pending || !topic.trim()} onClick={generate}>
          <Sparkles className="size-3.5" />
          {pending
            ? t("console.workforce.courses.ai.generating", undefined, "Generating…")
            : t("console.workforce.courses.ai.generate", undefined, "Generate Course")}
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => setOpen(false)}>
          {t("common.cancel", undefined, "Cancel")}
        </Button>
      </div>
    </div>
  );
}
