"use client";

import { useActionState } from "react";
import { enrollAction, type State } from "../actions";
import { useActionErrorResolver } from "@/lib/errors-client";

/**
 * Enroll / continue control for a real course. Posts the course id to the
 * enroll server action (idempotent), which redirects back into the course.
 */
export function CourseEnroll({ courseId, label }: { courseId: string; label: string }) {
  const [state, action, pending] = useActionState<State, FormData>(enrollAction, null);
  const resolveErr = useActionErrorResolver();
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="course_id" value={courseId} />
      <button
        type="submit"
        disabled={pending}
        className="ps-btn ps-btn--cta ps-btn--lg"
        style={{ minHeight: 44, justifyContent: "center" }}
      >
        {pending ? "…" : label}
      </button>
      {state?.error && (
        <p className="ps-alert ps-alert--danger" role="alert">
          {resolveErr(state.error)}
        </p>
      )}
    </form>
  );
}
