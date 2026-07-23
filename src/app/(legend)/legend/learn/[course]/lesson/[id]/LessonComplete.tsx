"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/LocaleProvider";
import { completeLessonAction } from "../../../actions";

/**
 * Mark-complete control for a real lesson. Calls the server action (which
 * recomputes course progress and awards points on completion), then routes
 * to the next lesson — or back to the overview when it's the last one.
 */
export function LessonComplete({
  courseId,
  lessonId,
  positionSeconds,
  nextHref,
  alreadyDone,
}: {
  courseId: string;
  lessonId: string;
  positionSeconds: number;
  nextHref: string;
  alreadyDone: boolean;
}) {
  const router = useRouter();
  const t = useT();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = () => {
    setError(null);
    const fd = new FormData();
    fd.set("course_id", courseId);
    fd.set("lesson_id", lessonId);
    fd.set("position_seconds", String(positionSeconds));
    start(async () => {
      const res = await completeLessonAction(null, fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.push(nextHref);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="ps-btn ps-btn--cta ps-btn--lg"
        style={{ minHeight: 44, justifyContent: "center" }}
      >
        {pending
          ? "…"
          : alreadyDone
            ? t("console.legend.learn.lesson.completedContinue", undefined, "Completed. Continue")
            : t("console.legend.learn.lesson.markComplete", undefined, "Mark complete & continue")}
      </button>
      {error && (
        <p className="ps-alert ps-alert--danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
