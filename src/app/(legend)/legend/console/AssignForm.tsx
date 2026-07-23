"use client";

import { useActionState } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { assignCourseAction, type State } from "./actions";

/**
 * Course-assignment control for the training console. Posts a (member, course)
 * pair to the server action; surfaces the result inline.
 */
export function AssignForm({
  members,
  courses,
}: {
  members: Array<{ id: string; name: string }>;
  courses: Array<{ id: string; title: string }>;
}) {
  const [state, action, pending] = useActionState<State, FormData>(assignCourseAction, null);
  const t = useT();
  return (
    <form action={action} className="surface flex flex-col gap-2 p-4">
      <h2 className="text-sm font-semibold text-[var(--p-text-1)]">
        {t("console.legend.trainingConsole.assign.title", undefined, "Assign a course")}
      </h2>
      <div className="flex flex-col gap-2 sm:flex-row">
        <select name="user_id" className="ps-input flex-1" defaultValue="" required>
          <option value="" disabled>
            {t("console.legend.trainingConsole.assign.selectMember", undefined, "Select member…")}
          </option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <select name="course_id" className="ps-input flex-1" defaultValue="" required>
          <option value="" disabled>
            {t("console.legend.trainingConsole.assign.selectCourse", undefined, "Select course…")}
          </option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <button type="submit" disabled={pending} className="ps-btn ps-btn--primary" style={{ minHeight: 44 }}>
          {pending ? "…" : t("console.legend.trainingConsole.assign.submit", undefined, "Assign")}
        </button>
      </div>
      {state?.error && (
        <p className="text-xs text-[var(--p-danger)]" role="alert">
          {state.error}
        </p>
      )}
      {state?.ok && <p className="text-xs text-[var(--p-success)]">{state.ok}</p>}
    </form>
  );
}
