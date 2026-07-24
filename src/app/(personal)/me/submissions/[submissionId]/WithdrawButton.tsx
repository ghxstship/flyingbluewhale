"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { withdrawSubmissionAction, type State } from "./actions";

/**
 * Two-tap withdraw control for the submitter's own submission: the first
 * tap arms the destructive copy, the second submits. In-place arming
 * instead of window.confirm per the design-system Dialog canon.
 */
export function WithdrawButton({ submissionId, labels }: {
  submissionId: string;
  labels: { withdraw: string; confirm: string; cancel: string; done: string };
}) {
  const [armed, setArmed] = useState(false);
  const [state, formAction, pending] = useActionState<State, FormData>(withdrawSubmissionAction, null);

  if (state?.ok) return <p className="text-sm text-[var(--p-text-2)]">{labels.done}</p>;
  if (!armed) {
    return (
      <Button type="button" variant="ghost" onClick={() => setArmed(true)}>
        {labels.withdraw}
      </Button>
    );
  }
  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="submission_id" value={submissionId} />
      <p className="text-sm text-[var(--p-text-2)]">{labels.confirm}</p>
      {state?.error ? <p className="text-sm text-[var(--p-danger-text)]">{state.error}</p> : null}
      <div className="flex items-center gap-2">
        <Button type="submit" variant="danger" disabled={pending}>
          {labels.withdraw}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setArmed(false)} disabled={pending}>
          {labels.cancel}
        </Button>
      </div>
    </form>
  );
}
