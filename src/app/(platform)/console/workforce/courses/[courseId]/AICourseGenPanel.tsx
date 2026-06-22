"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";

// Competitive parity with Connecteam "AI Generated Courses" (Aug 2025).
// Lets a manager describe a topic and auto-populate lessons + quiz questions.
export function AICourseGenPanel({ courseId }: { courseId: string }) {
  const t = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [topic, setTopic] = useState("");
  const [lessonCount, setLessonCount] = useState(3);
  const [open, setOpen] = useState(false);

  const generate = () => {
    const trimmed = topic.trim();
    if (!trimmed) {
      toast.error(t("console.workforce.courses.ai.topicRequired", undefined, "Enter a topic first"));
      return;
    }
    start(async () => {
      try {
        const res = await fetch("/api/v1/ai/course-gen", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ courseId, topic: trimmed, lessonCount }),
        });
        const body = (await res.json()) as { data?: { lessons: number; questions: number }; error?: { message?: string } };
        if (!res.ok || !body.data) {
          toast.error(body.error?.message ?? t("console.workforce.courses.ai.error", undefined, "Generation failed"));
          return;
        }
        toast.success(
          t(
            "console.workforce.courses.ai.success",
            { lessons: body.data.lessons, questions: body.data.questions },
            `Added ${body.data.lessons} lesson(s) and ${body.data.questions} quiz question(s)`,
          ),
        );
        setTopic("");
        setOpen(false);
        router.refresh();
      } catch {
        toast.error(t("console.workforce.courses.ai.error", undefined, "Generation failed"));
      }
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-medium text-[var(--p-accent)] hover:underline"
      >
        <Sparkles className="size-3.5" />
        {t("console.workforce.courses.ai.trigger", undefined, "Generate with AI")}
      </button>
    );
  }

  return (
    <div className="surface-inset rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--p-text-1)]">
        <Sparkles className="size-3.5 text-[var(--p-accent)]" />
        {t("console.workforce.courses.ai.heading", undefined, "Generate Course Content")}
      </div>
      <p className="text-[11px] text-[var(--p-text-2)]">
        {t(
          "console.workforce.courses.ai.hint",
          undefined,
          "Describe a topic and AI will create lessons and quiz questions and append them to this course.",
        )}
      </p>
      <textarea
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder={t(
          "console.workforce.courses.ai.topicPlaceholder",
          undefined,
          "e.g. Stage rigging safety for front-of-house crew at outdoor festivals",
        )}
        rows={3}
        maxLength={500}
        className="ps-input w-full text-sm"
        disabled={pending}
      />
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-xs">
          <span className="text-[var(--p-text-2)]">
            {t("console.workforce.courses.ai.lessonCount", undefined, "Lessons")}
          </span>
          <select
            value={lessonCount}
            onChange={(e) => setLessonCount(Number(e.target.value))}
            className="ps-input py-0.5 text-xs"
            disabled={pending}
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            {t("common.cancel", undefined, "Cancel")}
          </Button>
          <Button type="button" size="sm" disabled={pending || !topic.trim()} onClick={generate}>
            <Sparkles className="size-3.5" />
            {pending
              ? t("console.workforce.courses.ai.generating", undefined, "Generating…")
              : t("console.workforce.courses.ai.generate", undefined, "Generate")}
          </Button>
        </div>
      </div>
    </div>
  );
}
