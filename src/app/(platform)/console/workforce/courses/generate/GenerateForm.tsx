"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";

type State = "idle" | "loading" | "error";

export function GenerateForm() {
  const t = useT();
  const router = useRouter();
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      topic: fd.get("topic") as string,
      role: (fd.get("role") as string) || undefined,
      lesson_count: Number(fd.get("lesson_count") ?? 3),
      duration_minutes: fd.get("duration_minutes") ? Number(fd.get("duration_minutes")) : undefined,
    };

    setState("loading");
    setError(null);

    try {
      const res = await fetch("/api/v1/ai/generate-course", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message ?? "Generation failed");
        setState("error");
        return;
      }
      router.push(`/console/workforce/courses/${json.data.courseId}`);
    } catch {
      setError("Network error — please try again");
      setState("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.workforce.courses.generate.topic", undefined, "What should this course teach?")}
          <span className="text-[var(--p-accent)] ml-1">*</span>
        </label>
        <textarea
          name="topic"
          required
          rows={3}
          maxLength={500}
          placeholder={t(
            "console.workforce.courses.generate.topicPlaceholder",
            undefined,
            "e.g. Radio comms protocol for festival crew, Fire safety for warehouse staff, Proper stage rigging inspection...",
          )}
          className="ps-input mt-1.5 w-full"
        />
      </div>

      <Input
        label={t("console.workforce.courses.generate.role", undefined, "Target role (optional)")}
        name="role"
        maxLength={80}
        placeholder={t("console.workforce.courses.generate.rolePlaceholder", undefined, "e.g. Stage crew, Drivers, Security")}
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.workforce.courses.generate.lessonCount", undefined, "Lessons")}
          </label>
          <select name="lesson_count" defaultValue="3" className="ps-input mt-1.5 w-full">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <Input
          label={t("console.workforce.courses.generate.duration", undefined, "Target duration — min")}
          name="duration_minutes"
          type="number"
          min="5"
          max="120"
          placeholder="20"
        />
      </div>

      {error && (
        <div className="rounded-md bg-[var(--c-error-subtle)] border border-[var(--c-error)] px-4 py-3 text-sm text-[var(--c-error)]">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={state === "loading"}>
          {state === "loading"
            ? t("console.workforce.courses.generate.generating", undefined, "Generating…")
            : t("console.workforce.courses.generate.submit", undefined, "Generate Course")}
        </Button>
        <Button href="/console/workforce/courses" variant="ghost">
          {t("common.cancel", undefined, "Cancel")}
        </Button>
      </div>

      {state === "loading" && (
        <p className="text-xs text-[var(--p-text-2)]">
          {t(
            "console.workforce.courses.generate.hint",
            undefined,
            "Claude is writing your lessons and quiz — this takes 10–20 seconds.",
          )}
        </p>
      )}
    </form>
  );
}
