"use client";

import { useActionState } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { completeStep, finalizeAssignment, type State } from "../actions";

/**
 * One-tap onboarding actions. Client islands so failures render inline
 * instead of replacing the page with the route error boundary.
 */

export function MarkStepDoneButton({ assignmentId, stepId }: { assignmentId: string; stepId: string }) {
  const t = useT();
  const [state, formAction, pending] = useActionState<State, FormData>(completeStep, null);
  return (
    <form action={formAction} className="mt-3 flex flex-col items-end gap-1">
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <input type="hidden" name="stepId" value={stepId} />
      <button type="submit" disabled={pending} className="ps-btn ps-btn--sm">
        {pending ? t("m.onboarding.marking", undefined, "Saving…") : t("m.onboarding.markDone", undefined, "Mark Done")}
      </button>
      {state?.error && <p className="text-xs text-[var(--p-danger)]">{state.error}</p>}
    </form>
  );
}

export function FinalizeButton({ assignmentId }: { assignmentId: string }) {
  const t = useT();
  const [state, formAction, pending] = useActionState<State, FormData>(finalizeAssignment, null);
  return (
    <form action={formAction} className="mt-6 space-y-2">
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <button type="submit" disabled={pending} className="ps-btn w-full">
        {pending
          ? t("m.onboarding.finishing", undefined, "Finishing…")
          : t("m.onboarding.finish", undefined, "Finish Onboarding")}
      </button>
      {state?.error && <p className="text-center text-xs text-[var(--p-danger)]">{state.error}</p>}
    </form>
  );
}
