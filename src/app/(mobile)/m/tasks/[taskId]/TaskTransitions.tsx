"use client";

import { useActionState } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { setTaskStatus, type State } from "./actions";

const TRANSITIONS = [
  { value: "in_progress", labelKey: "m.tasks.detail.transition.start", labelFallback: "Start" },
  { value: "blocked", labelKey: "m.tasks.detail.transition.block", labelFallback: "Block" },
  { value: "review", labelKey: "m.tasks.detail.transition.review", labelFallback: "Review" },
  { value: "done", labelKey: "m.tasks.detail.transition.done", labelFallback: "Done" },
] as const;

/**
 * One-tap task state transitions. Client island so a rejected update
 * surfaces inline instead of tripping the route error boundary.
 */
export function TaskTransitions({ taskId, taskState }: { taskId: string; taskState: string }) {
  const t = useT();
  const [state, formAction, pending] = useActionState<State, FormData>(setTaskStatus.bind(null, taskId), null);
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {TRANSITIONS.filter((tx) => tx.value !== taskState).map((tx) => (
          <form key={tx.value} action={formAction}>
            <input type="hidden" name="status" value={tx.value} />
            <button type="submit" disabled={pending} className="ps-btn ps-btn--ghost w-full">
              {t(tx.labelKey, undefined, tx.labelFallback)}
            </button>
          </form>
        ))}
      </div>
      {state?.error && <p className="text-xs text-[var(--p-danger)]">{state.error}</p>}
    </div>
  );
}
